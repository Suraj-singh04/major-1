// prisma/seed.js
// Run with: node prisma/seed.js
// Make sure your DATABASE_URL is set in .env

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─── HELPERS ────────────────────────────────────────────────────────────────

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Returns a date that is `daysFromNow` days in the future (positive) or past (negative)
function daysFromNow(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
}

// Returns a random date between two day offsets from today
function randomDateBetween(minDays, maxDays) {
    return daysFromNow(randomBetween(minDays, maxDays));
}

// ─── MASTER DATA ─────────────────────────────────────────────────────────────

const PRODUCTS = [
    // Fast-moving dairy — expires quickly, high velocity
    { name: "Amul Full Cream Milk 1L", brand: "Amul", category: "Dairy", unit: "Litre", avgSellDays: 4, priceRange: [55, 62] },
    { name: "Amul Butter 500g", brand: "Amul", category: "Dairy", unit: "Pack", avgSellDays: 8, priceRange: [240, 260] },
    { name: "Mother Dairy Curd 400g", brand: "Mother Dairy", category: "Dairy", unit: "Pack", avgSellDays: 5, priceRange: [45, 55] },
    { name: "Amul Cheese Slices 200g", brand: "Amul", category: "Dairy", unit: "Pack", avgSellDays: 10, priceRange: [120, 140] },
    { name: "Nestle Yogurt Mango 100g", brand: "Nestle", category: "Dairy", unit: "Cup", avgSellDays: 6, priceRange: [25, 35] },

    // Packaged snacks — medium shelf life
    { name: "Lays Classic Salted 26g", brand: "Lays", category: "Snacks", unit: "Pack", avgSellDays: 18, priceRange: [10, 10] },
    { name: "Kurkure Masala Munch 90g", brand: "Kurkure", category: "Snacks", unit: "Pack", avgSellDays: 20, priceRange: [20, 20] },
    { name: "Parle-G Biscuits 800g", brand: "Parle", category: "Biscuits", unit: "Pack", avgSellDays: 25, priceRange: [40, 45] },
    { name: "Britannia Good Day 200g", brand: "Britannia", category: "Biscuits", unit: "Pack", avgSellDays: 22, priceRange: [30, 35] },
    { name: "Hide & Seek Chocolate 120g", brand: "Parle", category: "Biscuits", unit: "Pack", avgSellDays: 28, priceRange: [30, 32] },

    // Beverages
    { name: "Minute Maid Pulpy Orange 1L", brand: "Coca-Cola", category: "Beverages", unit: "Bottle", avgSellDays: 12, priceRange: [80, 90] },
    { name: "Real Fruit Juice Mixed 1L", brand: "Dabur", category: "Beverages", unit: "Bottle", avgSellDays: 14, priceRange: [110, 120] },
    { name: "Paper Boat Aamras 250ml", brand: "Paper Boat", category: "Beverages", unit: "Pack", avgSellDays: 10, priceRange: [30, 35] },
    { name: "Maaza Mango 600ml", brand: "Coca-Cola", category: "Beverages", unit: "Bottle", avgSellDays: 15, priceRange: [35, 40] },

    // Personal care / FMCG with longer shelf life
    { name: "Dettol Handwash 250ml", brand: "Dettol", category: "Personal Care", unit: "Bottle", avgSellDays: 35, priceRange: [85, 95] },
    { name: "Colgate MaxFresh 150g", brand: "Colgate", category: "Personal Care", unit: "Tube", avgSellDays: 30, priceRange: [70, 80] },

    // Staples
    { name: "Tata Salt 1kg", brand: "Tata", category: "Staples", unit: "Pack", avgSellDays: 40, priceRange: [22, 25] },
    { name: "Fortune Soyabean Oil 1L", brand: "Fortune", category: "Staples", unit: "Bottle", avgSellDays: 35, priceRange: [140, 155] },
    { name: "Aashirvaad Atta 5kg", brand: "ITC", category: "Staples", unit: "Bag", avgSellDays: 20, priceRange: [230, 250] },
    { name: "Patanjali Ghee 500ml", brand: "Patanjali", category: "Dairy", unit: "Jar", avgSellDays: 22, priceRange: [260, 280] },
];

const RETAILER_SHOPS = [
    { shopName: "Sharma General Store", address: "Station Road, Jaipur" },
    { shopName: "Rajputana Kirana", address: "Nehru Nagar, Ajmer" },
    { shopName: "Meena Traders", address: "Civil Lines, Jodhpur" },
    { shopName: "Shree Ram Provision", address: "Sindhi Camp, Jaipur" },
    { shopName: "Jai Hind Stores", address: "Lal Kothi, Jaipur" },
    { shopName: "Vaishnav Mart", address: "Gopalpura, Jaipur" },
    { shopName: "Bharat Bazaar", address: "Mansarovar, Jaipur" },
    { shopName: "Om Shanti Kirana", address: "Sodala, Jaipur" },
    { shopName: "Gupta Super Store", address: "Murlipura, Jaipur" },
    { shopName: "Rajdhani Retail", address: "Vidhyadhar Nagar, Jaipur" },
    { shopName: "New India Stores", address: "Tonk Road, Jaipur" },
    { shopName: "Soni Provision", address: "Bapu Nagar, Jaipur" },
    { shopName: "Mahaveer Traders", address: "C-Scheme, Jaipur" },
    { shopName: "Shreenath Kirana", address: "Vaishali Nagar, Jaipur" },
    { shopName: "Durga General Store", address: "Raja Park, Jaipur" },
];

const MERCHANDISER_NAMES = [
    { name: "Vikram Agarwal Distributors", address: "Industrial Area, Jaipur" },
    { name: "Rajasthan FMCG Hub", address: "Sanganer, Jaipur" },
    { name: "Jaipur Wholesale Depot", address: "Sitapura, Jaipur" },
];

// ─── MAIN SEEDER ─────────────────────────────────────────────────────────────

async function main() {
    console.log("🌱 Starting seed...\n");

    // ── 0. CLEAR EXISTING DATA (in correct FK order) ──────────────────────────
    console.log("🗑️  Clearing existing data...");
    await prisma.notificationLog.deleteMany().catch(() => {}); // new table may not exist yet
    await prisma.retailerScore.deleteMany().catch(() => {});
    await prisma.productAnalytics.deleteMany().catch(() => {});
    await prisma.dailySale.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.retailerStock.deleteMany();
    await prisma.inventoryBatch.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    console.log("✅ Cleared\n");

    // ── 1. CREATE MERCHANDISERS ───────────────────────────────────────────────
    console.log("👤 Creating merchandisers...");
    const merchandisers = [];
    for (let i = 0; i < MERCHANDISER_NAMES.length; i++) {
        const m = await prisma.user.create({
            data: {
                name: MERCHANDISER_NAMES[i].name,
                phone: `9800000${String(i + 1).padStart(3, "0")}`,
                role: "MERCHANDISER",
                shopName: MERCHANDISER_NAMES[i].name,
                address: MERCHANDISER_NAMES[i].address,
                isActive: true,
            },
        });
        merchandisers.push(m);
    }
    console.log(`   ✅ Created ${merchandisers.length} merchandisers`);

    // ── 2. CREATE RETAILERS ───────────────────────────────────────────────────
    console.log("🏪 Creating retailers...");
    const retailers = [];
    for (let i = 0; i < RETAILER_SHOPS.length; i++) {
        const shop = RETAILER_SHOPS[i];
        const r = await prisma.user.create({
            data: {
                name: shop.shopName + " Owner",
                phone: `9900000${String(i + 1).padStart(3, "0")}`,
                role: "RETAILER",
                shopName: shop.shopName,
                address: shop.address,
                isActive: true,
            },
        });
        retailers.push(r);
    }
    console.log(`   ✅ Created ${retailers.length} retailers`);

    // ── 3. CREATE PRODUCTS ────────────────────────────────────────────────────
    console.log("📦 Creating products...");
    const products = [];
    for (const p of PRODUCTS) {
        const product = await prisma.product.create({
            data: {
                name: p.name,
                brand: p.brand,
                category: p.category,
                unit: p.unit,
            },
        });
        products.push({ ...product, meta: p }); // attach metadata for seeding logic
    }
    console.log(`   ✅ Created ${products.length} products`);

    // ── 4. CREATE INVENTORY BATCHES ───────────────────────────────────────────
    // Strategy: create batches with varied expiry dates so the engine has
    // something to find. Some expiring very soon, some with time to spare.
    console.log("🏭 Creating inventory batches...");
    const batches = [];
    const merchandiser = merchandisers[0]; // primary merchandiser

    for (const product of products) {
        // Create 3-5 batches per product with different expiry dates
        const batchCount = randomBetween(3, 5);

        for (let b = 0; b < batchCount; b++) {
            // Mix of: already near expiry, mid-range, plenty of time
            // This ensures the engine finds REAL at-risk items
            let expiryDaysFromNow;
            if (b === 0) {
                // Critical: expiring in 2-5 days (definitely at risk)
                expiryDaysFromNow = randomBetween(2, 5);
            } else if (b === 1) {
                // Warning: expiring in 6-15 days (may be at risk depending on threshold)
                expiryDaysFromNow = randomBetween(6, 15);
            } else {
                // Safe: expiring in 30-90 days (safe, should NOT appear in at-risk)
                expiryDaysFromNow = randomBetween(30, 90);
            }

            const purchasePrice = randomFloat(
                product.meta.priceRange[0] * 0.7,
                product.meta.priceRange[0] * 0.85
            );
            const sellingPrice = randomFloat(
                product.meta.priceRange[0],
                product.meta.priceRange[1]
            );

            const batch = await prisma.inventoryBatch.create({
                data: {
                    productId: product.id,
                    merchandiserId: merchandiser.id,
                    quantity: randomBetween(50, 500),
                    purchasePrice,
                    sellingPrice,
                    expiryDate: daysFromNow(expiryDaysFromNow),
                    createdAt: daysFromNow(-randomBetween(1, 30)),
                },
            });
            batches.push(batch);
        }
    }
    console.log(`   ✅ Created ${batches.length} inventory batches`);

    // ── 5. CREATE HISTORICAL ORDERS (90 days of history) ─────────────────────
    // This is the most important part — it's what the scoring engine reads.
    // Each retailer gets a different buying PERSONALITY so scoring produces
    // varied, meaningful results.

    console.log("🛒 Creating order history (this takes a moment)...");

    // Retailer personalities — determines how they'll be scored
    // Top retailers will score high, weak retailers will score low
    const retailerPersonality = retailers.map((r, i) => ({
        retailer: r,
        orderFrequency: i < 5 ? "high" : i < 10 ? "medium" : "low",
        // high = orders every 3-5 days, medium = every 8-12 days, low = every 20-30 days
        preferredCategories:
            i % 3 === 0
                ? ["Dairy", "Beverages"]
                : i % 3 === 1
                    ? ["Snacks", "Biscuits"]
                    : ["Staples", "Personal Care"],
        avgOrderSize: i < 5 ? randomBetween(80, 150) : i < 10 ? randomBetween(30, 80) : randomBetween(5, 30),
        paymentReliability: i < 5 ? 0.95 : i < 10 ? 0.80 : 0.60, // % of orders completed
    }));

    let totalOrders = 0;
    let totalOrderItems = 0;

    for (const persona of retailerPersonality) {
        const { retailer, orderFrequency, preferredCategories, avgOrderSize, paymentReliability } = persona;

        // Determine how many days between orders for this retailer
        const daysBetweenOrders =
            orderFrequency === "high"
                ? randomBetween(3, 5)
                : orderFrequency === "medium"
                    ? randomBetween(8, 12)
                    : randomBetween(20, 30);

        // Generate orders going back 90 days
        let currentDay = -90;
        while (currentDay < 0) {
            const orderDate = daysFromNow(currentDay);

            // Skip this order based on reliability (simulates cancelled/missed orders)
            if (Math.random() > paymentReliability) {
                currentDay += daysBetweenOrders;
                continue;
            }

            // Pick 1-4 products for this order, preferring their category
            const numProducts = randomBetween(1, 4);
            const orderProducts = [];

            for (let p = 0; p < numProducts; p++) {
                // 70% chance to pick from preferred category, 30% anything
                const usePreferred = Math.random() < 0.7;
                const candidateProducts = usePreferred
                    ? products.filter((prod) => preferredCategories.includes(prod.meta.category))
                    : products;

                if (candidateProducts.length > 0) {
                    const chosenProduct = randomItem(candidateProducts);
                    // Avoid duplicating same product in one order
                    if (!orderProducts.find((op) => op.id === chosenProduct.id)) {
                        orderProducts.push(chosenProduct);
                    }
                }
            }

            if (orderProducts.length === 0) {
                currentDay += daysBetweenOrders;
                continue;
            }

            // Find a valid batch for each product (one that existed at order time)
            const orderItemsData = [];
            for (const product of orderProducts) {
                const relevantBatch = batches.find((b) => b.productId === product.id);
                if (!relevantBatch) continue;

                const qty = randomBetween(
                    Math.floor(avgOrderSize * 0.5),
                    Math.floor(avgOrderSize * 1.5)
                );

                orderItemsData.push({
                    inventoryBatchId: relevantBatch.id,
                    quantity: qty,
                    price: relevantBatch.sellingPrice,
                });
            }

            if (orderItemsData.length === 0) {
                currentDay += daysBetweenOrders;
                continue;
            }

            // Create the order
            const order = await prisma.order.create({
                data: {
                    retailerId: retailer.id,
                    merchandiserId: merchandiser.id,
                    status: "COMPLETED",
                    createdAt: orderDate,
                    items: {
                        create: orderItemsData,
                    },
                },
            });

            totalOrders++;
            totalOrderItems += orderItemsData.length;
            currentDay += daysBetweenOrders + randomBetween(-1, 1); // slight randomness
        }
    }

    console.log(`   ✅ Created ${totalOrders} orders with ${totalOrderItems} order items`);

    // ── 6. CREATE DAILY SALES (retailer sell-through data) ───────────────────
    // This is what the sell-through score reads — how fast do retailers
    // actually sell inventory to end customers
    console.log("📊 Creating daily sales data...");
    let totalSales = 0;

    for (const persona of retailerPersonality) {
        const { retailer, orderFrequency, preferredCategories } = persona;

        // Sales velocity multiplier — high-frequency retailers sell faster
        const velocityMultiplier =
            orderFrequency === "high" ? 1.5 : orderFrequency === "medium" ? 1.0 : 0.5;

        // For each product this retailer buys, generate daily sales going back 60 days
        const relevantProducts = products.filter((p) =>
            preferredCategories.includes(p.meta.category)
        );

        for (const product of relevantProducts) {
            // Not every product is sold every day — skip some days
            for (let day = -60; day < 0; day++) {
                // 60% chance of having a sale on any given day for preferred products
                if (Math.random() > 0.6) continue;

                const baseDailySales = Math.ceil(
                    (product.meta.avgSellDays > 0 ? 30 / product.meta.avgSellDays : 2) * velocityMultiplier
                );
                const quantity = randomBetween(
                    Math.max(1, Math.floor(baseDailySales * 0.5)),
                    Math.ceil(baseDailySales * 1.5)
                );

                const saleDate = daysFromNow(day);
                // Normalize to midnight for the unique constraint
                saleDate.setHours(0, 0, 0, 0);

                try {
                    await prisma.dailySale.create({
                        data: {
                            retailerId: retailer.id,
                            productId: product.id,
                            quantity,
                            date: saleDate,
                        },
                    });
                    totalSales++;
                } catch (e) {
                    // Skip duplicate date entries (unique constraint)
                }
            }
        }
    }

    console.log(`   ✅ Created ${totalSales} daily sale records`);

    // ── 7. CREATE RETAILER STOCK ──────────────────────────────────────────────
    console.log("📦 Creating retailer stock records...");
    let totalStock = 0;

    for (const persona of retailerPersonality) {
        const { retailer, preferredCategories } = persona;
        const relevantProducts = products.filter((p) =>
            preferredCategories.includes(p.meta.category)
        );

        for (const product of relevantProducts) {
            await prisma.retailerStock.upsert({
                where: {
                    retailerId_productId: {
                        retailerId: retailer.id,
                        productId: product.id,
                    },
                },
                update: {},
                create: {
                    retailerId: retailer.id,
                    productId: product.id,
                    quantity: randomBetween(10, 200),
                },
            });
            totalStock++;
        }
    }

    console.log(`   ✅ Created ${totalStock} retailer stock records`);

    // ── SUMMARY ───────────────────────────────────────────────────────────────
    console.log("\n═══════════════════════════════════════════");
    console.log("✅ SEED COMPLETE — Here's what was created:");
    console.log("═══════════════════════════════════════════");
    console.log(`   👤 Merchandisers  : ${merchandisers.length}`);
    console.log(`   🏪 Retailers      : ${retailers.length}`);
    console.log(`   📦 Products       : ${products.length}`);
    console.log(`   🏭 Batches        : ${batches.length} (with varied expiry dates)`);
    console.log(`   🛒 Orders         : ${totalOrders}`);
    console.log(`   📋 Order Items    : ${totalOrderItems}`);
    console.log(`   📊 Daily Sales    : ${totalSales}`);
    console.log(`   📦 Retailer Stock : ${totalStock}`);
    console.log("═══════════════════════════════════════════");
    console.log("\n💡 Retailer score distribution:");
    console.log("   Retailers 1-5  → HIGH buyers (will score highest)");
    console.log("   Retailers 6-10 → MEDIUM buyers (will score mid)");
    console.log("   Retailers 11-15→ LOW buyers  (will score lowest)");
    console.log("\n🚀 Now hit POST /api/engine/run to see the engine work!\n");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });