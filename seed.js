require('dotenv').config();
const { connectDB, collections } = require('./db');

const SELLER = {
  name: 'Karim Electronics',
  email: 'seller@resellhub.com',
  photo: 'https://i.pravatar.cc/150?img=15',
  phone: '+8801712345678',
  location: 'Dhaka, Bangladesh',
};

const products = [
  {
    title: 'Used Dell Inspiron 15 Laptop',
    category: 'Electronics', condition: 'Good', price: 35000, stock: 2,
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80'],
    description: 'Dell Inspiron 15, Core i5 10th Gen, 8GB RAM, 512GB SSD. Used for 2 years, excellent battery health.',
  },
  {
    title: 'Apple MacBook Air M1 (2020)',
    category: 'Electronics', condition: 'Like New', price: 78000, stock: 1,
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80'],
    description: 'MacBook Air M1, 8GB RAM, 256GB SSD. Barely used, comes with original box and charger.',
  },
  {
    title: 'Samsung Galaxy S21 Ultra',
    category: 'Mobile Phones', condition: 'Good', price: 52000, stock: 3,
    images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80'],
    description: '256GB, Phantom Black. Minor scratches on the back, screen is flawless. Includes case.',
  },
  {
    title: 'iPhone 12 - 128GB',
    category: 'Mobile Phones', condition: 'Like New', price: 49000, stock: 2,
    images: ['https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600&q=80'],
    description: 'iPhone 12 Blue, 128GB. Battery health 89%. No dents, always used with a case and screen protector.',
  },
  {
    title: 'Wooden Study Table',
    category: 'Furniture', condition: 'Good', price: 4500, stock: 1,
    images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80'],
    description: 'Solid wood study table with drawer. Sturdy and spacious. Some minor wear on the surface.',
  },
  {
    title: 'Comfortable Fabric Sofa Set',
    category: 'Furniture', condition: 'Used', price: 18000, stock: 1,
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80'],
    description: '3+2 seater fabric sofa. Comfortable and clean. Selling due to relocation.',
  },
  {
    title: 'Honda CB Hornet 160R',
    category: 'Vehicles', condition: 'Good', price: 145000, stock: 1,
    images: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80'],
    description: 'Honda CB Hornet 160R, 2021 model. 12,000 km driven. All papers up to date, well maintained.',
  },
  {
    title: 'Trek Mountain Bicycle',
    category: 'Vehicles', condition: 'Like New', price: 22000, stock: 2,
    images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80'],
    description: '21-speed mountain bike, aluminium frame. Hardly used. Perfect for city and trails.',
  },
  {
    title: "Men's Leather Jacket",
    category: 'Fashion', condition: 'Like New', price: 3200, stock: 4,
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80'],
    description: 'Genuine leather jacket, size L. Worn twice. Timeless style, excellent condition.',
  },
  {
    title: 'Designer Wrist Watch',
    category: 'Fashion', condition: 'Good', price: 5500, stock: 2,
    images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&q=80'],
    description: 'Stainless steel analog watch. Keeps perfect time. Comes with original strap and box.',
  },
  {
    title: 'The Lean Startup - Eric Ries',
    category: 'Books', condition: 'Good', price: 350, stock: 5,
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'],
    description: 'Bestselling business book in good condition. No torn pages, light highlighting in a few chapters.',
  },
  {
    title: 'Atomic Habits - James Clear',
    category: 'Books', condition: 'Like New', price: 450, stock: 6,
    images: ['https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=600&q=80'],
    description: 'Atomic Habits hardcover, like new. A must-read on building good habits. Clean pages.',
  },
];

async function seed() {
  await connectDB();

  // Upsert seller and fetch its id.
  await collections.users.updateOne(
    { email: SELLER.email },
    { $set: { ...SELLER, role: 'seller', status: 'active', verified: true, createdAt: new Date() } },
    { upsert: true }
  );
  const seller = await collections.users.findOne({ email: SELLER.email });

  const sellerInfo = {
    userId: seller._id.toString(),
    name: seller.name,
    email: seller.email,
    phone: seller.phone,
    photo: seller.photo,
    verified: true,
    location: seller.location,
  };

  // Avoid duplicates if re-run.
  await collections.products.deleteMany({ 'sellerInfo.email': SELLER.email });

  const docs = products.map((p, i) => ({
    ...p,
    location: SELLER.location,
    sellerInfo,
    status: 'available',
    approvalStatus: 'approved',
    reportCount: 0,
    createdAt: new Date(Date.now() - i * 3600 * 1000),
  }));

  const result = await collections.products.insertMany(docs);
  console.log(`✅ Seeded seller + ${result.insertedCount} products.`);
  process.exit(0);
}

seed().catch((e) => { console.error('Seed error:', e.message); process.exit(1); });
