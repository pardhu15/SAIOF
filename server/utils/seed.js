const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Product = require('../models/Product');

const sampleProducts = [
  // --- ELECTRONICS ---
  {
    title: 'AcousticFlux Noise-Cancelling Headphones',
    description: 'Over-ear hybrid active noise cancelling headphones with hi-res audio, 40-hour battery life, and memory foam earcups.',
    category: 'Electronics',
    price: 189.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    stock: 25,
    ratings: 4.8
  },
  {
    title: 'UltraView 4K Portable Projector',
    description: 'Mini smart home theater projector supporting 4K decoding, built-in dual speakers, and seamless Wi-Fi streaming.',
    category: 'Electronics',
    price: 299.00,
    image: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=500&q=80',
    stock: 8,
    ratings: 4.6
  },
  {
    title: 'Lumix Pro RGB Mechanical Keyboard',
    description: 'Hot-swappable mechanical gaming keyboard featuring linear red switches, PBT keycaps, and customizable per-key backlighting.',
    category: 'Electronics',
    price: 119.50,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80',
    stock: 15,
    ratings: 4.7
  },
  {
    title: 'SuperCharge 3-in-1 Wireless Dock',
    description: 'Multi-device magnetic charging dock delivering fast power to your phone, smartwatch, and wireless earbuds concurrently.',
    category: 'Electronics',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1622445262465-2481c4574875?w=500&q=80',
    stock: 30,
    ratings: 4.4
  },
  {
    title: 'PrimeStream USB Audio DAC Receiver',
    description: 'Portable high-fidelity digital-to-analog converter and amplifier designed to drive studio-grade headphones.',
    category: 'Electronics',
    price: 85.00,
    image: 'https://images.unsplash.com/photo-1558089687-f282ffcbd1d5?w=500&q=80',
    stock: 12,
    ratings: 4.5
  },

  // --- FASHION ---
  {
    title: 'UrbanDrape Oversized Cotton Hoodie',
    description: 'Premium heavyweight French terry cotton hoodie with drop-shoulder silhouette and ribbed trims. Perfect for casual wear.',
    category: 'Fashion',
    price: 65.00,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80',
    stock: 45,
    ratings: 4.5
  },
  {
    title: 'Nomad Explorer Canvas Windbreaker',
    description: 'Water-resistant waxed canvas utility jacket featuring a packable hood, brass hardware, and multiple storage pockets.',
    category: 'Fashion',
    price: 145.00,
    image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500&q=80',
    stock: 10,
    ratings: 4.7
  },
  {
    title: 'AeroStride Breathable Running Shoes',
    description: 'Lightweight road running shoes engineered with high-rebound cushioning midsoles and breathable engineered mesh uppers.',
    category: 'Fashion',
    price: 110.00,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    stock: 20,
    ratings: 4.3
  },
  {
    title: 'ThermaWeave Merino Wool Scarf',
    description: 'Ultra-soft, temperature-regulating scarf crafted from 100% fine Australian merino wool in a modern ribbed knit design.',
    category: 'Fashion',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1520903928273-0f44b0a2fe9a?w=500&q=80',
    stock: 50,
    ratings: 4.6
  },
  {
    title: 'MetroFit Tailored Linen Blazer',
    description: 'Unstructured slim-fit blazer made of lightweight breathable linen, ideal for smart-casual warm weather dressing.',
    category: 'Fashion',
    price: 135.00,
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&q=80',
    stock: 8,
    ratings: 4.4
  },

  // --- BOOKS ---
  {
    title: 'The Art of Clean Code (Paperback)',
    description: 'A comprehensive handbook of software craftsmanship, detail-oriented design rules, and refactoring practices for developers.',
    category: 'Books',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&q=80',
    stock: 100,
    ratings: 4.9
  },
  {
    title: 'Designing Distributed Micro-Architectures',
    description: 'A deep-dive technical manual detailing pattern practices, concurrency pipelines, and scalable database cluster structures.',
    category: 'Books',
    price: 49.50,
    image: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=500&q=80',
    stock: 35,
    ratings: 4.8
  },
  {
    title: 'Chronicles of the Iron Galaxy',
    description: 'An epic science fiction space opera following the interstellar journey and trade struggles of a cargo freighter crew.',
    category: 'Books',
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&q=80',
    stock: 80,
    ratings: 4.2
  },
  {
    title: 'The Chef\'s Palette: Modern Gastronomy',
    description: 'A beautifully photographed cookbook exploring the fusion of molecular gastronomy, presentation, and classic flavors.',
    category: 'Books',
    price: 28.00,
    image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=500&q=80',
    stock: 22,
    ratings: 4.6
  },
  {
    title: 'Mind Over Chaos: Habits of High Performers',
    description: 'A revolutionary self-help guide outlines behavioral strategies to optimize focus, manage stress, and build routines.',
    category: 'Books',
    price: 18.00,
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&q=80',
    stock: 90,
    ratings: 4.5
  },

  // --- ACCESSORIES ---
  {
    title: 'LeatherCraft Minimalist Bifold Wallet',
    description: 'Slim bifold wallet handcrafted from full-grain vegetable-tanned leather featuring RFID-blocking security card slots.',
    category: 'Accessories',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1627124118123-e4d31489ed5f?w=500&q=80',
    stock: 60,
    ratings: 4.7
  },
  {
    title: 'Nomad Pack Water-Resistant Backpack',
    description: 'Industrial-grade water-resistant commuter backpack with a padded 16-inch laptop compartment and hidden luggage strap.',
    category: 'Accessories',
    price: 89.00,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
    stock: 18,
    ratings: 4.8
  },
  {
    title: 'Horizon Chronograph Leather Watch',
    description: 'Classic analogue watch with a Japanese quartz movement, stainless steel case, and a genuine brown leather strap.',
    category: 'Accessories',
    price: 175.00,
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&q=80',
    stock: 12,
    ratings: 4.6
  },
  {
    title: 'ClearSight Polarized Matte Sunglasses',
    description: 'Classic square sunglasses featuring lightweight flexible frames and HD polarized anti-glare lenses.',
    category: 'Accessories',
    price: 32.50,
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80',
    stock: 75,
    ratings: 4.4
  },
  {
    title: 'KeyOrganize Premium Leather Loop',
    description: 'An elegant leather keyholder with a locking mechanism that secures up to 7 keys in a quiet, organized stack.',
    category: 'Accessories',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=500&q=80',
    stock: 110,
    ratings: 4.3
  },

  // --- GADGETS ---
  {
    title: 'VibeGrip Portable Bluetooth Speaker',
    description: 'Rugged IPX7 waterproof portable speaker delivering rich 360-degree sound, punchy bass, and 24 hours of playtime.',
    category: 'Gadgets',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80',
    stock: 40,
    ratings: 4.7
  },
  {
    title: 'SparkDrive Portable Pocket Drone',
    description: 'Ultra-lightweight folding pocket drone with a 1080p HD camera, altitude hold, and gesture control for aerial photos.',
    category: 'Gadgets',
    price: 199.00,
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500&q=80',
    stock: 7,
    ratings: 4.5
  },
  {
    title: 'SmartPlant Wi-Fi Soil Monitor',
    description: 'Smart environmental sensor that tracks soil moisture, ambient temperature, and sunlight levels via a mobile app.',
    category: 'Gadgets',
    price: 29.50,
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500&q=80',
    stock: 65,
    ratings: 4.2
  },
  {
    title: 'PocketGlow Rechargeable Hand Warmer',
    description: 'Double-sided electric hand warmer and power bank with 3 heating levels, perfect for winter commutes and outdoor sports.',
    category: 'Gadgets',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1584006682522-dc17d6c0d9ec?w=500&q=80',
    stock: 120,
    ratings: 4.6
  }
];

const seedProducts = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saiof';
    console.log(`[Seed Script] Connecting to ${connStr}...`);
    await mongoose.connect(connStr);

    console.log('[Seed Script] Clearing existing products...');
    await Product.deleteMany({});

    console.log('[Seed Script] Seeding sample products...');
    await Product.insertMany(sampleProducts);

    console.log('[Seed Script] Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Script Error] Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedProducts();
