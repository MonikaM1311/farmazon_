const Product = require('../models/Product');

const kb = {
  immunity:    { items: ['Spinach', 'Broccoli', 'Garlic', 'Ginger', 'Citrus fruits', 'Bell peppers', 'Amla', 'Turmeric'], why: 'rich in Vitamin C, antioxidants, and zinc' },
  weight_loss: { items: ['Cucumber', 'Lettuce', 'Tomatoes', 'Watermelon', 'Papaya', 'Berries', 'Bottle gourd', 'Ridge gourd'], why: 'low-calorie and high in fiber to keep you full' },
  energy:      { items: ['Bananas', 'Sweet potatoes', 'Beets', 'Oranges', 'Mangoes', 'Dates', 'Corn'], why: 'packed with natural sugars, iron, and complex carbs' },
  digestion:   { items: ['Papaya', 'Pineapple', 'Ginger', 'Fennel', 'Apples', 'Banana', 'Curd'], why: 'contain natural digestive enzymes and probiotics' },
  budget:      { items: ['Carrots', 'Onions', 'Potatoes', 'Cabbage', 'Bananas', 'Tomatoes', 'Spinach', 'Radish'], why: 'nutritious, widely available, and very affordable' },
  diabetes:    { items: ['Bitter gourd', 'Fenugreek leaves', 'Spinach', 'Broccoli', 'Berries', 'Guava', 'Drumstick'], why: 'low glycemic index and help regulate blood sugar' },
  heart:       { items: ['Tomatoes', 'Leafy greens', 'Berries', 'Pomegranate', 'Garlic', 'Walnuts'], why: 'rich in antioxidants, omega-3, and heart-healthy nutrients' },
  skin:        { items: ['Carrots', 'Tomatoes', 'Cucumber', 'Papaya', 'Avocado', 'Sweet potato', 'Berries'], why: 'high in Vitamin A, C, and antioxidants for glowing skin' },
  bones:       { items: ['Broccoli', 'Kale', 'Spinach', 'Figs', 'Sesame seeds', 'Milk', 'Drumstick leaves'], why: 'rich in calcium, Vitamin K, and magnesium' },
  protein:     { items: ['Lentils', 'Chickpeas', 'Green peas', 'Soybeans', 'Mushrooms', 'Quinoa', 'Peanuts'], why: 'excellent plant-based protein sources' },
  kids:        { items: ['Bananas', 'Mangoes', 'Carrots', 'Sweet corn', 'Peas', 'Apples', 'Milk'], why: 'nutrient-dense, naturally sweet, and kid-friendly' },
  pregnancy:   { items: ['Spinach', 'Lentils', 'Bananas', 'Avocado', 'Sweet potato', 'Oranges', 'Broccoli'], why: 'high in folate, iron, and essential vitamins for mother and baby' },
  monsoon:     { items: ['Ginger', 'Turmeric', 'Garlic', 'Corn', 'Jamun', 'Pear', 'Litchi'], why: 'seasonal monsoon produce that boosts immunity and digestion' },
  summer:      { items: ['Watermelon', 'Mango', 'Cucumber', 'Coconut', 'Lemon', 'Mint', 'Bottle gourd'], why: 'hydrating and cooling summer produce' },
  winter:      { items: ['Carrots', 'Peas', 'Cauliflower', 'Mustard greens', 'Amla', 'Guava', 'Radish'], why: 'peak-season winter vegetables packed with nutrients' },
};

const recipes = {
  tomato:   '🍅 **Tomato Rasam**: Boil tomatoes with tamarind, pepper, cumin, and curry leaves. Great for digestion!',
  spinach:  '🥬 **Palak Paneer**: Blanch spinach, blend smooth, cook with paneer and spices. Rich in iron and protein.',
  carrot:   '🥕 **Carrot Halwa**: Grate carrots, cook in milk with ghee and sugar. A classic Indian dessert!',
  banana:   '🍌 **Banana Smoothie**: Blend banana with milk, honey, and cardamom. Perfect pre-workout energy!',
  ginger:   '🫚 **Ginger Tea**: Boil ginger slices with water, add honey and lemon. Best for cold and digestion.',
  cucumber: '🥒 **Cucumber Raita**: Mix grated cucumber with curd, cumin, and salt. Cooling summer side dish.',
  beetroot: '🫀 **Beetroot Juice**: Blend beetroot with apple and ginger. Boosts stamina and iron levels.',
  mango:    '🥭 **Mango Lassi**: Blend mango pulp with curd, sugar, and cardamom. A refreshing summer drink!',
};

const storage = {
  tomato:   '🍅 Store at room temperature, away from sunlight. Refrigerate only when fully ripe.',
  spinach:  '🥬 Wrap in a damp paper towel and store in the fridge. Use within 3–4 days.',
  carrot:   '🥕 Remove greens, store in a sealed bag in the fridge. Stays fresh for 2–3 weeks.',
  potato:   '🥔 Store in a cool, dark, dry place. Never refrigerate — it turns starchy.',
  onion:    '🧅 Keep in a mesh bag in a cool, dry place away from potatoes.',
  banana:   '🍌 Keep at room temperature. Separate from the bunch to slow ripening.',
  mango:    '🥭 Ripen at room temperature, then refrigerate for up to 5 days.',
  ginger:   '🫚 Wrap in a paper towel and refrigerate, or freeze for longer shelf life.',
  cucumber: '🥒 Wrap in a paper towel and store in the fridge. Best used within 5–7 days.',
  broccoli: '🥦 Store unwashed in a loose bag in the fridge. Use within 3–5 days.',
};

// Tamil keyword map → English intent
const tamilMap = {
  // greetings
  'வணக்கம்': 'hello', 'ஹலோ': 'hello', 'நமஸ்தே': 'hello',
  // health
  'நோய் எதிர்ப்பு': 'immunity', 'சளி': 'cold immunity', 'காய்ச்சல்': 'fever immunity',
  'எடை குறைக்க': 'weight loss', 'உடல் எடை': 'weight loss',
  'சக்தி': 'energy', 'சோர்வு': 'tired energy', 'உற்சாகம்': 'energy',
  'செரிமானம்': 'digestion', 'வயிறு': 'stomach digestion',
  'சர்க்கரை நோய்': 'diabetes', 'நீரிழிவு': 'diabetes',
  'இதயம்': 'heart health', 'ரத்த அழுத்தம்': 'blood pressure heart',
  'சருமம்': 'skin glow', 'முகம்': 'skin glow',
  'எலும்பு': 'bones calcium', 'கால்சியம்': 'bones calcium',
  'புரதம்': 'protein muscle', 'தசை': 'protein muscle',
  'குழந்தை': 'kids growth', 'கர்ப்பம்': 'pregnancy',
  // products
  'தக்காளி': 'tomato', 'கீரை': 'spinach', 'கேரட்': 'carrot',
  'வாழைப்பழம்': 'banana', 'மாம்பழம்': 'mango', 'வெள்ளரி': 'cucumber',
  'இஞ்சி': 'ginger', 'பீட்ரூட்': 'beetroot', 'உருளைக்கிழங்கு': 'potato',
  'வெங்காயம்': 'onion', 'பூண்டு': 'garlic', 'முட்டைகோஸ்': 'cabbage',
  // actions
  'வாங்க': 'buy', 'கார்ட்': 'cart add', 'சேர்': 'add cart',
  'விலை': 'price', 'கிடைக்கும்': 'available', 'இருக்கா': 'available',
  'ரெசிபி': 'recipe', 'சமையல்': 'recipe cook',
  'சேமிப்பு': 'storage store', 'கெட்டுவிடாம': 'storage fresh',
  // season / budget
  'பட்ஜெட்': 'budget', 'மலிவான': 'cheap budget', 'சீசன்': 'season',
  'மழைக்காலம்': 'monsoon season', 'கோடை': 'summer season', 'குளிர்': 'winter season',
  // general
  'என்ன': 'what', 'எப்படி': 'how', 'எது': 'which', 'நன்றி': 'thank you',
  'சரி': 'ok', 'ஆமா': 'yes', 'இல்ல': 'no',
};

const translateTamil = (msg) => {
  let translated = msg;
  for (const [tamil, english] of Object.entries(tamilMap)) {
    if (msg.includes(tamil)) translated = translated.replace(tamil, english);
  }
  return translated;
};

const isTamil = (msg) => /[\u0B80-\u0BFF]/.test(msg);

// Search live products from DB
const searchProducts = async (query, limit = 4) => {
  return Product.find({
    stock: { $gt: 0 },
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } },
    ],
  })
    .sort({ avgRating: -1, createdAt: -1 })
    .limit(limit)
    .select('_id name price unit image stock category avgRating farmerName');
};

// Detect add-to-cart intent: "add tomato to cart", "cart lo tomato", "buy spinach"
const detectCartIntent = (msg) => {
  const cartPatterns = [
    /add (.+?) to cart/i,
    /cart[- ]?lo (.+)/i,
    /buy (.+?) now/i,
    /i want (.+)/i,
    /order (.+)/i,
    /get me (.+)/i,
    /(.+?) cart[- ]?[లో]?/i,
  ];
  for (const pattern of cartPatterns) {
    const match = msg.match(pattern);
    if (match) return match[1].trim().replace(/\b(some|fresh|the|a|an)\b/gi, '').trim();
  }
  return null;
};

const getLocalResponse = (msg) => {
  // Greeting
  if (/^(hi|hello|hey|namaste|hii|helo|vanakkam)\b/i.test(msg)) {
    return `👋 Hello! I'm **Farma**, your smart farm assistant on Farmazon.\n\nI can help you with:\n- 🛒 **Search & add products** to your cart\n- 🥗 **Health goal** recommendations\n- 🍳 **Recipe ideas**\n- 📦 **Storage tips**\n- 🌦️ **Seasonal** produce\n- 💰 **Budget** grocery planning\n- 🌐 **Any general question**\n\nWhat would you like today?`;
  }

  // Thank you
  if (/thank|thanks|நன்றி/i.test(msg)) {
    return `😊 You're welcome! Happy to help. Is there anything else you'd like to know?`;
  }

  // Recipe
  const recipeMatch = Object.keys(recipes).find((k) => msg.toLowerCase().includes(k));
  if (msg.match(/recipe|cook|make|prepare|சமையல்|ரெசிபி/i)) {
    if (recipeMatch) return recipes[recipeMatch];
    return `🍳 I have recipes for: **${Object.keys(recipes).map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}**.\n\nTry: "Give me a tomato recipe"`;
  }
  if (recipeMatch) return recipes[recipeMatch];

  // Storage
  const storageMatch = Object.keys(storage).find((k) => msg.toLowerCase().includes(k));
  if (msg.match(/store|storage|keep|fresh|preserve|சேமிப்பு/i)) {
    if (storageMatch) return storage[storageMatch];
    return `📦 I have storage tips for: **${Object.keys(storage).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}**.\n\nTry: "How to store tomatoes?"`;
  }
  if (storageMatch) return storage[storageMatch];

  // Seasonal
  const month = new Date().getMonth();
  const currentSeason = month >= 5 && month <= 8 ? 'monsoon' : month >= 9 || month <= 1 ? 'winter' : 'summer';
  if (msg.match(/season|monsoon|summer|winter|right now|available now|சீசன்|மழை|கோடை|குளிர்/i)) {
    const season = msg.includes('monsoon') || msg.includes('மழை') ? 'monsoon'
      : msg.includes('summer') || msg.includes('கோடை') ? 'summer'
      : msg.includes('winter') || msg.includes('குளிர்') ? 'winter'
      : currentSeason;
    const s = kb[season];
    return `🌦️ **${season.charAt(0).toUpperCase() + season.slice(1)} Season Picks** — ${s.why}:\n\n**${s.items.join(', ')}**\n\nAll available fresh on Farmazon! 🌿`;
  }

  // Budget
  const budgetAmt = msg.match(/[₹rs]?\s*(\d+)/);
  if (msg.match(/budget|cheap|affordable|under|₹|மலிவான|பட்ஜெட்/i)) {
    const amount = budgetAmt ? budgetAmt[1] : '200';
    return `💰 For a budget of ₹${amount}, I suggest:\n\n**${kb.budget.items.join(', ')}**\n\nThese are ${kb.budget.why}. Great for a family of 4! 🛒`;
  }

  // Health goals
  const matchers = {
    immunity:    ['immun', 'cold', 'flu', 'sick', 'fever', 'vitamin c', 'infection', 'நோய் எதிர்ப்பு'],
    weight_loss: ['weight', 'diet', 'slim', 'fat', 'calorie', 'lose', 'obesity', 'எடை குறை'],
    energy:      ['energy', 'tired', 'fatigue', 'weak', 'stamina', 'workout', 'சக்தி', 'சோர்வு'],
    digestion:   ['digest', 'stomach', 'gut', 'bloat', 'constipat', 'acidity', 'செரிமானம்', 'வயிறு'],
    diabetes:    ['diabet', 'sugar', 'blood sugar', 'glucose', 'நீரிழிவு', 'சர்க்கரை'],
    heart:       ['heart', 'cholesterol', 'bp', 'blood pressure', 'cardiac', 'இதயம்', 'ரத்த அழுத்தம்'],
    skin:        ['skin', 'glow', 'acne', 'pimple', 'complexion', 'சருமம்', 'முகம்'],
    bones:       ['bone', 'calcium', 'joint', 'arthritis', 'எலும்பு', 'கால்சியம்'],
    protein:     ['protein', 'muscle', 'gym', 'vegan', 'புரதம்', 'தசை'],
    kids:        ['kid', 'child', 'baby', 'toddler', 'குழந்தை'],
    pregnancy:   ['pregnan', 'expecting', 'trimester', 'கர்ப்பம்'],
  };
  const scores = {};
  for (const [goal, keywords] of Object.entries(matchers)) {
    scores[goal] = keywords.filter((k) => msg.toLowerCase().includes(k)).length;
  }
  const topGoal = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (topGoal && topGoal[1] > 0) {
    const g = kb[topGoal[0]];
    const emoji = { immunity: '🌿', weight_loss: '🥗', energy: '⚡', digestion: '🫚', diabetes: '🩺', heart: '❤️', skin: '✨', bones: '🦴', protein: '💪', kids: '👶', pregnancy: '🤰' };
    return `${emoji[topGoal[0]] || '🌱'} For **${topGoal[0].replace('_', ' ')}**, I recommend:\n\n**${g.items.join(', ')}**\n\nThese are ${g.why}. Find them fresh on Farmazon! 🛒`;
  }

  // Farmazon info
  if (msg.match(/farmazon|about|how does|how it work/i)) {
    return `🌾 **Farmazon** is a farm-to-consumer marketplace.\n\n- Farmers list fresh produce directly\n- You buy without any middlemen\n- Farmers earn more, you pay less\n- Delivery in 2–3 days\n\nRegister as a **consumer** to shop or as a **farmer** to sell! 🚜`;
  }

  return null; // signal to use OpenAI or general fallback
};

const chat = async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ message: 'Message required' });

  const tamil = isTamil(message);
  const translatedMsg = tamil ? translateTamil(message) : message;
  const workingMsg = translatedMsg.toLowerCase();
  const langNote = tamil ? '\n\n_(தமிழில் கேட்டதற்கு நன்றி! / Thanks for asking in Tamil!)_' : '';

  // 1. Check add-to-cart intent FIRST
  const cartQuery = detectCartIntent(workingMsg);
  if (cartQuery) {
    const products = await searchProducts(cartQuery, 4);
    if (products.length > 0) {
      return res.json({
        reply: `🛒 I found **${products.length}** result(s) for "${cartQuery}". Tap **Add to Cart** to add them!${langNote}`,
        action: 'show_products',
        products,
      });
    }
    return res.json({
      reply: `😔 Sorry, I couldn't find "${cartQuery}" in stock right now.\n\nTry browsing the **Shop** page for all available products!${langNote}`,
    });
  }

  // 2. Check live product search intent: "show me tomatoes", "is mango available", "search carrots"
  const searchPatterns = [
    /show (?:me )?(.+)/i, /search (?:for )?(.+)/i, /find (.+)/i,
    /is (.+?) available/i, /do you have (.+)/i, /(.+?) available/i,
    /(.+?) இருக்கா/i, /(.+?) கிடைக்கும்/i, /(.+?) விலை/i,
  ];
  for (const pattern of searchPatterns) {
    const match = workingMsg.match(pattern);
    if (match) {
      const query = match[1].trim().replace(/\b(some|fresh|the|a|an|in stock|today)\b/gi, '').trim();
      if (query.length > 1) {
        const products = await searchProducts(query, 4);
        if (products.length > 0) {
          return res.json({
            reply: `✅ Found **${products.length}** product(s) for "${query}" in stock:${langNote}`,
            action: 'show_products',
            products,
          });
        }
        return res.json({
          reply: `😔 No products found for "${query}" right now.\n\nCheck the **Shop** page for all available items!${langNote}`,
        });
      }
    }
  }

  // 3. Try local knowledge base
  const localReply = getLocalResponse(workingMsg);
  if (localReply) {
    return res.json({ reply: localReply + langNote });
  }

  // 4. OpenAI for general questions (anything outside farm/health scope)
  if (process.env.OPENAI_API_KEY) {
    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const systemPrompt = `You are Farma, a smart and friendly AI assistant for Farmazon — an Indian farm-to-consumer marketplace.

Primary expertise:
- Fresh fruit and vegetable recommendations based on health goals
- Budget grocery planning in Indian Rupees (₹)
- Simple Indian recipes using farm produce
- Storage tips to keep produce fresh
- Seasonal produce for Indian seasons (summer, monsoon, winter)
- Farmazon platform information

You can ALSO answer general knowledge questions on any topic — science, history, technology, math, etc. When answering general questions, keep it brief and always try to relate back to food/health/farming if possible.

Language: ${tamil ? 'The user wrote in Tamil. Respond in both Tamil and English.' : 'Respond in English.'}

Rules:
- Keep responses concise and warm
- Use relevant emojis
- Use **bold** for key points
- Format lists with "- " bullet points
- For Indian context: prices in ₹, Indian vegetables/fruits preferred`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6).map((h) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text })),
        { role: 'user', content: message },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 350,
        temperature: 0.7,
      });
      return res.json({ reply: completion.choices[0].message.content });
    } catch (err) {
      console.error('OpenAI error:', err.message);
    }
  }

  // 5. Final fallback
  res.json({
    reply: `🤔 I didn't quite catch that${tamil ? ' (தமிழில்)' : ''}. Here's what I can help with:\n\n- 🛒 "Show me tomatoes" / "Add mango to cart"\n- 💪 "What's good for immunity?"\n- 🍳 "Give me a spinach recipe"\n- 📦 "How to store carrots?"\n- 🌦️ "What's in season now?"\n- 💰 "Budget groceries under ₹300"\n- 🌐 Any general question!${langNote}`,
  });
};

module.exports = { chat };
