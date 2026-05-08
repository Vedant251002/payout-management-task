import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

// Load .env.local since tsx doesn't auto-load it like Next.js
config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not set. Please set it in .env.local");
  process.exit(1);
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db!;

    // Clear existing data
    await db.collection("users").deleteMany({});
    await db.collection("vendors").deleteMany({});
    await db.collection("payouts").deleteMany({});
    await db.collection("payoutaudits").deleteMany({});
    console.log("🗑️  Cleared existing data");

    // Seed users
    const opsPassword = await bcrypt.hash("ops123", 10);
    const finPassword = await bcrypt.hash("fin123", 10);

    await db.collection("users").insertMany([
      {
        email: "ops@demo.com",
        password: opsPassword,
        role: "OPS",
        name: "Ops User",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "finance@demo.com",
        password: finPassword,
        role: "FINANCE",
        name: "Finance User",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log("👤 Seeded users: ops@demo.com (OPS), finance@demo.com (FINANCE)");

    // Seed sample vendors
    await db.collection("vendors").insertMany([
      {
        name: "Acme Corp",
        upi_id: "acme@upi",
        bank_account: "1234567890",
        ifsc: "HDFC0001234",
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "TechVendor Ltd",
        upi_id: null,
        bank_account: "9876543210",
        ifsc: "ICIC0005678",
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "CloudServices Inc",
        upi_id: "cloud@paytm",
        bank_account: null,
        ifsc: null,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log("🏢 Seeded 3 sample vendors");

    console.log("\n🎉 Seed complete! You can now login with:");
    console.log("   OPS:     ops@demo.com / ops123");
    console.log("   FINANCE: finance@demo.com / fin123");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
