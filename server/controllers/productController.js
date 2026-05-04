const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const axios = require('axios');

const AI_VERIFIER_URL = process.env.AI_VERIFIER_URL || 'http://localhost:5001';

const getProducts = async (req, res) => {
  const { category, search, sort, page = 1, limit = 12 } = req.query;
  const query = {};
  if (category && category !== 'all') query.category = category;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } },
  ];
  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
  }

  const sortObj = sort === 'price_asc' ? { price: 1 }
    : sort === 'price_desc' ? { price: -1 }
    : sort === 'newest' ? { createdAt: -1 }
    : { createdAt: -1 };

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('farmerId', 'name');

  res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
};

const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id).populate('farmerId', 'name email');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

const createProduct = async (req, res) => {
  const { name, description, price, category, image, harvestDate, stock, unit, marketPrice } = req.body;
  const product = await Product.create({
    name, description, price, category, image, harvestDate, stock, unit, marketPrice,
    farmerId: req.user._id,
    farmerName: req.user.name,
  });
  res.status(201).json(product);
};

const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.farmerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  Object.assign(product, req.body);
  const updated = await product.save();
  res.json(updated);
};

const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.farmerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  await product.deleteOne();
  res.json({ message: 'Product deleted' });
};

const getFarmerProducts = async (req, res) => {
  const products = await Product.find({ farmerId: req.user._id }).sort({ createdAt: -1 });
  res.json(products);
};

const uploadLabReport = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.farmerId.toString() !== req.user._id.toString())
    return res.status(403).json({ message: 'Not authorized' });

  const { file } = req.body;
  if (!file) return res.status(400).json({ message: 'No file provided' });

  const isPdf = file.startsWith('data:application/pdf');

  // Upload to Cloudinary
  const uploadResult = await cloudinary.uploader.upload(file, {
    folder: 'farmazon/lab_reports',
    resource_type: isPdf ? 'raw' : 'image',
    format: isPdf ? 'pdf' : undefined,
  });

  // Save with pending status immediately
  product.labReport = {
    url: uploadResult.secure_url,
    fileType: isPdf ? 'pdf' : 'image',
    uploadedAt: new Date(),
    verified: false,
    aiStatus: 'pending',
    aiScore: null,
    aiBreakdown: null,
  };
  await product.save();

  // Call AI verifier asynchronously
  runAIVerification(product._id, file, isPdf ? 'pdf' : 'image').catch(() => {});

  res.json({
    message: 'Lab report uploaded. AI verification in progress...',
    labReport: product.labReport,
  });
};

async function runAIVerification(productId, fileBase64, fileType) {
  try {
    const response = await axios.post(`${AI_VERIFIER_URL}/verify`, {
      file: fileBase64,
      fileType,
    }, { timeout: 120000 }); // 2 min timeout for OCR

    const { score, status, breakdown } = response.data;

    await Product.findByIdAndUpdate(productId, {
      'labReport.aiScore': score,
      'labReport.aiStatus': status,
      'labReport.aiBreakdown': breakdown,
      'labReport.aiVerifiedAt': new Date(),
      'labReport.verified': status === 'approved',
    });
  } catch (err) {
    // Mark as needs_review if AI service is down
    await Product.findByIdAndUpdate(productId, {
      'labReport.aiStatus': 'needs_review',
      'labReport.aiScore': 0,
      'labReport.aiBreakdown': { error: 'AI service unavailable' },
    });
  }
}

const getLabVerificationStatus = async (req, res) => {
  const product = await Product.findById(req.params.id).select('labReport');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ labReport: product.labReport });
};

const retriggerAIVerification = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.farmerId.toString() !== req.user._id.toString())
    return res.status(403).json({ message: 'Not authorized' });
  if (!product.labReport?.url)
    return res.status(400).json({ message: 'No lab report uploaded yet' });

  product.labReport.aiStatus = 'pending';
  product.labReport.aiScore = null;
  await product.save();

  // Re-fetch file from Cloudinary URL and re-run
  const fileRes = await axios.get(product.labReport.url, { responseType: 'arraybuffer', timeout: 30000 });
  const base64 = Buffer.from(fileRes.data).toString('base64');
  const dataUri = `data:${product.labReport.fileType === 'pdf' ? 'application/pdf' : 'image/jpeg'};base64,${base64}`;

  runAIVerification(product._id, dataUri, product.labReport.fileType).catch(() => {});

  res.json({ message: 'AI re-verification triggered', labReport: product.labReport });
};

const verifyLabReport = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.farmerId.toString() !== req.user._id.toString())
    return res.status(403).json({ message: 'Not authorized' });
  if (!product.labReport?.url) return res.status(400).json({ message: 'No lab report uploaded yet' });
  product.labReport.verified = req.body.verified !== false;
  await product.save();
  res.json({ message: `Lab report ${product.labReport.verified ? 'verified' : 'unverified'}`, labReport: product.labReport });
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getFarmerProducts, uploadLabReport, verifyLabReport, getLabVerificationStatus, retriggerAIVerification };
