require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');

const FARMER_EMAIL = 'farmer@demo.com';

const products = [
  // ── VEGETABLES ──────────────────────────────────────────────
  {
    name: 'Fresh Tomatoes',
    description: 'Juicy, vine-ripened tomatoes grown without pesticides. Perfect for curries, salads, and chutneys.',
    price: 35,
    marketPrice: 55,
    category: 'vegetable',
    image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=600&q=80',
    stock: 80,
    unit: 'kg',
    harvestDate: daysAgo(0),
    shelfLife: '4-5 days',
  },
  {
    name: 'Spinach (Palak)',
    description: 'Tender, dark-green spinach leaves. Rich in iron and vitamins. Freshly harvested this morning.',
    price: 25,
    marketPrice: 40,
    category: 'vegetable',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80',
    stock: 50,
    unit: 'bunch',
    harvestDate: daysAgo(1),
    shelfLife: '2-3 days',
  },
  {
    name: 'Carrots',
    description: 'Crunchy, sweet orange carrots. Great for juices, halwa, and salads. Organically grown.',
    price: 30,
    marketPrice: 45,
    category: 'vegetable',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&q=80',
    stock: 100,
    unit: 'kg',
    harvestDate: daysAgo(1),
    shelfLife: '7-10 days',
  },
  {
    name: 'Broccoli',
    description: 'Fresh green broccoli florets. High in fibre and Vitamin C. Ideal for stir-fry and soups.',
    price: 60,
    marketPrice: 90,
    category: 'vegetable',
    image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&q=80',
    stock: 40,
    unit: 'piece',
    harvestDate: daysAgo(2),
    shelfLife: '3-5 days',
  },
  {
    name: 'Onions',
    description: 'Farm-fresh red onions. Essential kitchen staple. Pungent, flavourful, and long-lasting.',
    price: 20,
    marketPrice: 30,
    category: 'vegetable',
    image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=600&q=80',
    stock: 200,
    unit: 'kg',
    harvestDate: daysAgo(3),
    shelfLife: '2-3 weeks',
  },
  {
    name: 'Potatoes',
    description: 'Starchy, versatile potatoes. Perfect for fries, curries, and aloo dishes. Freshly dug.',
    price: 22,
    marketPrice: 32,
    category: 'vegetable',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80',
    stock: 150,
    unit: 'kg',
    harvestDate: daysAgo(4),
    shelfLife: '2-3 weeks',
  },
  {
    name: 'Bitter Gourd (Karela)',
    description: 'Fresh bitter gourd. Excellent for managing blood sugar. A must-have for diabetic-friendly cooking.',
    price: 40,
    marketPrice: 60,
    category: 'vegetable',
    image: 'https://images.unsplash.com/photo-1601648764658-cf37e8c89b70?w=600&q=80',
    stock: 30,
    unit: 'kg',
    harvestDate: daysAgo(0),
    shelfLife: '3-4 days',
  },
  {
    name: 'Cucumber',
    description: 'Cool, crisp cucumbers. Hydrating and refreshing. Great for raita, salads, and detox water.',
    price: 18,
    marketPrice: 28,
    category: 'vegetable',
    image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=600&q=80',
    stock: 90,
    unit: 'kg',
    harvestDate: daysAgo(1),
    shelfLife: '5-7 days',
  },

  // ── FRUITS ──────────────────────────────────────────────────
  {
    name: 'Alphonso Mangoes',
    description: 'The king of mangoes! Sweet, aromatic Alphonso mangoes from Ratnagiri. Limited seasonal stock.',
    price: 120,
    marketPrice: 180,
    category: 'fruit',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80',
    stock: 60,
    unit: 'dozen',
    harvestDate: daysAgo(0),
    shelfLife: '3-4 days',
  },
  {
    name: 'Bananas',
    description: 'Ripe, yellow bananas. Energy-packed and naturally sweet. Great for smoothies and snacking.',
    price: 40,
    marketPrice: 55,
    category: 'fruit',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80',
    stock: 120,
    unit: 'dozen',
    harvestDate: daysAgo(1),
    shelfLife: '3-5 days',
  },
  {
    name: 'Watermelon',
    description: 'Big, juicy watermelons. 92% water content — perfect summer coolant. Seedless variety.',
    price: 25,
    marketPrice: 35,
    category: 'fruit',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80',
    stock: 35,
    unit: 'piece',
    harvestDate: daysAgo(2),
    shelfLife: '5-7 days',
  },
  {
    name: 'Papaya',
    description: 'Sweet, orange-fleshed papaya. Rich in digestive enzymes. Great for breakfast and smoothies.',
    price: 45,
    marketPrice: 65,
    category: 'fruit',
    image: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=600&q=80',
    stock: 25,
    unit: 'piece',
    harvestDate: daysAgo(1),
    shelfLife: '3-4 days',
  },
  {
    name: 'Pomegranate',
    description: 'Ruby-red pomegranates bursting with antioxidants. Great for heart health and fresh juices.',
    price: 80,
    marketPrice: 120,
    category: 'fruit',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&q=80',
    stock: 45,
    unit: 'kg',
    harvestDate: daysAgo(2),
    shelfLife: '1-2 weeks',
  },

  // ── GRAINS ──────────────────────────────────────────────────
  {
    name: 'Basmati Rice',
    description: 'Long-grain, aromatic basmati rice. Aged for 1 year for perfect texture. Ideal for biryani.',
    price: 90,
    marketPrice: 130,
    category: 'grain',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
    stock: 200,
    unit: 'kg',
    harvestDate: daysAgo(30),
    shelfLife: '6-12 months',
  },
  {
    name: 'Red Lentils (Masoor Dal)',
    description: 'Protein-rich red lentils. Quick-cooking and nutritious. A staple in every Indian kitchen.',
    price: 75,
    marketPrice: 100,
    category: 'grain',
    image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=600&q=80',
    stock: 150,
    unit: 'kg',
    harvestDate: daysAgo(20),
    shelfLife: '6-12 months',
  },
  {
    name: 'Wheat Flour (Atta)',
    description: 'Stone-ground whole wheat flour. Made from 100% whole wheat. Perfect for rotis and parathas.',
    price: 45,
    marketPrice: 60,
    category: 'grain',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80',
    stock: 300,
    unit: 'kg',
    harvestDate: daysAgo(15),
    shelfLife: '3-6 months',
  },

  // ── DAIRY ───────────────────────────────────────────────────
  {
    name: 'Fresh Cow Milk',
    description: 'Pure, fresh cow milk from free-range desi cows. No hormones, no additives. Delivered daily.',
    price: 55,
    marketPrice: 70,
    category: 'dairy',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80',
    stock: 100,
    unit: 'litre',
    harvestDate: daysAgo(0),
    shelfLife: '1-2 days',
  },
  {
    name: 'Desi Ghee',
    description: 'Hand-churned pure desi ghee from A2 cow milk. Rich aroma, golden colour. Traditional bilona method.',
    price: 550,
    marketPrice: 750,
    category: 'dairy',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80',
    stock: 30,
    unit: '500g',
    harvestDate: daysAgo(5),
    shelfLife: '6-12 months',
  },
  {
    name: 'Paneer (Cottage Cheese)',
    description: 'Soft, fresh paneer made from full-fat cow milk. High in protein. Made fresh every morning.',
    price: 80,
    marketPrice: 110,
    category: 'dairy',
    image: 'https://images.unsplash.com/photo-1631452180775-1c4e5e5e5e5e?w=600&q=80',
    stock: 40,
    unit: '200g',
    harvestDate: daysAgo(0),
    shelfLife: '2-3 days',
  },
  {
    name: 'Curd (Yogurt)',
    description: 'Thick, creamy homemade curd. Set fresh daily from pure cow milk. Perfect for raita and lassi.',
    price: 30,
    marketPrice: 45,
    category: 'dairy',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
    stock: 60,
    unit: '500g',
    harvestDate: daysAgo(0),
    shelfLife: '2-3 days',
  },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    const farmer = await User.findOne({ email: FARMER_EMAIL });
    if (!farmer) {
      console.error('❌ Farmer not found. Register farmer@demo.com first.');
      process.exit(1);
    }
    console.log(`✅ Farmer found: ${farmer.name} (${farmer._id})`);

    // Clear existing seeded products
    await Product.deleteMany({ farmerId: farmer._id });
    console.log('🗑️  Cleared old seeded products');

    const docs = products.map((p) => ({
      ...p,
      farmerId: farmer._id,
      farmerName: farmer.name,
    }));

    const inserted = await Product.insertMany(docs);
    console.log(`\n🌱 Successfully seeded ${inserted.length} products:\n`);
    inserted.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} — ₹${p.price}/${p.unit} (${p.category}) | Stock: ${p.stock}`);
    });

    console.log('\n✅ Seed complete! Visit http://localhost:5173/shop to see them.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
