const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const password = bcrypt.hashSync("demo1234", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Platform Admin",
      email: "admin@demo.com",
      password,
      role: "ADMIN",
      location: "HQ",
    },
  });

  const john = await prisma.user.create({
    data: {
      name: "John Electrician",
      email: "john@demo.com",
      password,
      role: "TRADESMAN",
      location: "Austin, TX",
      businessName: "John's Tool Rentals",
      providerStatus: "APPROVED",
      providerAppliedAt: new Date(),
      providerReviewedAt: new Date(),
    },
  });

  const sarah = await prisma.user.create({
    data: {
      name: "Sarah Builder",
      email: "sarah@demo.com",
      password,
      role: "TRADESMAN",
      location: "Denver, CO",
      businessName: "Sarah's Heavy Equipment Co.",
      providerStatus: "APPROVED",
      providerAppliedAt: new Date(),
      providerReviewedAt: new Date(),
    },
  });

  const tom = await prisma.user.create({
    data: {
      name: "Tom Renter",
      email: "tom@demo.com",
      password,
      role: "USER",
      location: "Chicago, IL",
    },
  });

  // A provider application still waiting on admin review, to demo the
  // approval workflow at /admin/providers.
  await prisma.user.create({
    data: {
      name: "Priya Events Co.",
      email: "priya@demo.com",
      password,
      role: "TRADESMAN",
      location: "Mumbai, MH",
      businessName: "Priya Decor & Events",
      providerStatus: "PENDING",
      providerAppliedAt: new Date(),
    },
  });

  const tools = [
    // ---------- Tools & Equipment ----------
    {
      name: "Bosch Rotary Hammer",
      description: "Heavy-duty concrete drill, 850W, includes 3 bits.",
      categoryGroup: "TOOLS",
      category: "Power Tools",
      pricePerDay: 18,
      salePrice: 220,
      securityDeposit: 50,
      location: "Austin, TX",
      condition: "Excellent",
      image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400",
      ownerId: john.id,
    },
    {
      name: "Mini Excavator Kubota U-17",
      description: "Compact excavator suitable for small earthmoving jobs.",
      categoryGroup: "TOOLS",
      category: "Heavy Machinery",
      pricePerDay: 450,
      securityDeposit: 500,
      location: "Denver, CO",
      condition: "Good",
      image: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=400",
      ownerId: sarah.id,
    },
    {
      name: "DeWalt Cordless Drill Set",
      description: "20V max, includes two batteries and charger.",
      categoryGroup: "TOOLS",
      category: "Power Tools",
      pricePerDay: 12,
      salePrice: 150,
      location: "Austin, TX",
      condition: "Like New",
      image: "https://images.unsplash.com/photo-1517164852305-99a3e65bb47e?w=400",
      ownerId: john.id,
    },
    {
      name: "Bosch Laser Level",
      description: "Self-leveling cross-line laser, perfect for construction.",
      categoryGroup: "TOOLS",
      category: "Measuring Tools",
      pricePerDay: 8,
      location: "Denver, CO",
      condition: "Excellent",
      image: "https://images.unsplash.com/photo-1526948531399-320e7e40f0ca?w=400",
      ownerId: sarah.id,
    },
    {
      name: "Werner Extension Ladder",
      description: "28 ft aluminum extension ladder, 300 lb rating.",
      categoryGroup: "TOOLS",
      category: "Ladders",
      pricePerDay: 15,
      location: "Austin, TX",
      condition: "Good",
      image: "https://images.unsplash.com/photo-1590005354167-6da94370c0b6?w=400",
      ownerId: john.id,
    },
    {
      name: "Bauer Table Saw",
      description: "10-inch sliding compound miter saw.",
      categoryGroup: "TOOLS",
      category: "Power Tools",
      pricePerDay: 30,
      location: "Denver, CO",
      condition: "Good",
      image: "https://images.unsplash.com/photo-1527683601-d6a58494c6a3?w=400",
      ownerId: sarah.id,
    },
    {
      name: "Ridgid Wet/Dry Vacuum",
      description: "16 gallon, 5 HP, perfect for cleanup.",
      categoryGroup: "TOOLS",
      category: "Cleaning Equipment",
     pricePerDay: 10,
      location: "Chicago, IL",
      condition: "New",
      image: "https://images.unsplash.com/photo-1621842057727-e31eeaeb0f96?w=400",
      ownerId: john.id,
    },

    // ---------- Industrial & Manufacturing ----------
    {
      name: "Mini Excavator Kubota U-17",
      description: "Compact excavator suitable for small earthmoving jobs.",
      categoryGroup: "INDUSTRIAL",
      category: "Earthmoving Equipment",
      pricePerDay: 450,
      location: "Denver, CO",
      condition: "Good",
      image: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=400",
      ownerId: sarah.id,
    },
    {
      name: "Heavy Duty Generac Generator",
      description: "7500W portable generator, electric start, ideal for job sites.",
      categoryGroup: "INDUSTRIAL",
      category: "Heavy Generators",
      pricePerDay: 60,
      location: "Chicago, IL",
      condition: "Good",
      image: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400",
      ownerId: sarah.id,
    },
    {
      name: "Toyota 3-Ton Forklift",
      description: "Diesel forklift, 3000kg capacity, ideal for warehouse and manufacturing use.",
      categoryGroup: "INDUSTRIAL",
      category: "Forklifts",
      pricePerDay: 120,
      location: "Chicago, IL",
      condition: "Good",
      image: "https://images.unsplash.com/photo-1615488072395-c7b12a24e2c8?w=400",
      ownerId: john.id,
    },
    {
      name: "Lincoln Arc Welding Machine",
      description: "220V industrial welding machine with accessories kit.",
      categoryGroup: "INDUSTRIAL",
      category: "Welding Machines",
      pricePerDay: 45,
      location: "Denver, CO",
      condition: "Excellent",
      image: "https://images.unsplash.com/photo-1565087389897-4e1b6f5f3d8e?w=400",
      ownerId: sarah.id,
    },

    // ---------- Events & Occasion Decoration ----------
    {
      name: "Birthday Balloon Arch & Backdrop Set",
      description: "Full balloon arch kit with themed backdrop, ideal for kids' birthday parties.",
      categoryGroup: "EVENTS",
      category: "Birthday Decoration",
      pricePerDay: 40,
      location: "Austin, TX",
      condition: "New",
      image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400",
      ownerId: john.id,
    },
    {
      name: "Ganpati Mandap Decoration Set",
      description: "Traditional Ganpati mandap with LED lighting, flowers & drapes for the full festival.",
      categoryGroup: "EVENTS",
      category: "Ganpati Decoration",
      pricePerDay: 150,
      location: "Chicago, IL",
      condition: "Excellent",
      image: "https://images.unsplash.com/photo-1600100397608-f9f24009e4e0?w=400",
      ownerId: john.id,
    },
    {
      name: "DJ Sound System with Lighting",
      description: "Complete DJ setup with speakers, mixer and dance-floor lighting for events.",
      categoryGroup: "EVENTS",
      category: "Sound & DJ Setup",
      pricePerDay: 90,
      location: "Denver, CO",
      condition: "Good",
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
      ownerId: sarah.id,
    },
  ];

  for (const tool of tools) {
    await prisma.tool.create({ data: tool });
  }

  console.log("✅ Database seeded successfully!");
  console.log("");
  console.log("Demo accounts (password for all: demo1234):");
  console.log("  Admin:                admin@demo.com");
  console.log("  Approved provider:    john@demo.com  (John's Tool Rentals)");
  console.log("  Approved provider:    sarah@demo.com (Sarah's Heavy Equipment Co.)");
  console.log("  Pending provider:     priya@demo.com (waiting on admin approval)");
  console.log("  Customer:             tom@demo.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
