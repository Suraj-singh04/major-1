// prisma/seed.js
// Run with: node prisma/seed.js
//
// What's new in this version:
// 1. Realistic Indian retailer profiles with real buying patterns
// 2. Thresholds are generous — products flagged early enough for retailers to sell
// 3. Dynamic pricing — price drops based on how close to expiry
// 4. Diverse order history so scoring produces meaningful differentiation
// 5. Real product data with accurate shelf lives

const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

// ── HELPERS ──────────────────────────────────────────────────────────────────

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min, max, decimals = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

function daysFromNow(days) {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d
}

// ── DYNAMIC PRICING LOGIC ─────────────────────────────────────────────────────
// The more urgent the batch, the lower the price offered to retailers.
// This gives retailers a real incentive to take near-expiry stock.
//
// urgencyScore 0.0 → full wholesale price (no discount)
// urgencyScore 0.3 → 5% discount
// urgencyScore 0.6 → 12% discount
// urgencyScore 0.9 → 20% discount
//
// This is applied when creating batches so the DB has realistic selling prices.
function computeDiscountedPrice(baseWholesalePrice, urgencyScore) {
    const maxDiscount = 0.20  // 20% max discount at urgency = 1.0
    const discount = urgencyScore * maxDiscount
    return parseFloat((baseWholesalePrice * (1 - discount)).toFixed(2))
}

// ── PRODUCT CATALOGUE ─────────────────────────────────────────────────────────
// avgSellDays: realistic days this product takes to sell at retail
// warningDays: how many days before expiry the ENGINE should flag this product
//              This is intentionally generous — retailer needs time to sell!
//              Rule of thumb: warningDays = avgSellDays * 2.5
// mrp: max retail price (what end consumer pays)
// wholesale: what retailer normally pays the merchandiser
//
// Example: Maggi noodles average 20 days to sell → warn at 50 days before expiry
// This gives the retailer time to actually sell it before it expires on their shelf

const PRODUCTS = [
    // ── DAIRY (short shelf life, needs early warning) ─────────────────────────
    {
        name: "Amul Full Cream Milk 1L",
        brand: "Amul",
        category: "Dairy",
        unit: "Litre",
        avgSellDays: 3,
        warningDays: 10,   // warn 10 days before expiry — dairy sells fast but spoils fast
        mrp: 68,
        wholesale: 58,
    },
    {
        name: "Amul Butter 500g",
        brand: "Amul",
        category: "Dairy",
        unit: "Pack",
        avgSellDays: 10,
        warningDays: 30,
        mrp: 285,
        wholesale: 252,
    },
    {
        name: "Mother Dairy Curd 400g",
        brand: "Mother Dairy",
        category: "Dairy",
        unit: "Pack",
        avgSellDays: 4,
        warningDays: 12,
        mrp: 55,
        wholesale: 47,
    },
    {
        name: "Amul Cheese Slices 200g",
        brand: "Amul",
        category: "Dairy",
        unit: "Pack",
        avgSellDays: 12,
        warningDays: 35,
        mrp: 145,
        wholesale: 122,
    },
    {
        name: "Nestle Yogurt Strawberry 100g",
        brand: "Nestle",
        category: "Dairy",
        unit: "Cup",
        avgSellDays: 7,
        warningDays: 20,
        mrp: 38,
        wholesale: 30,
    },
    {
        name: "Patanjali Ghee 500ml",
        brand: "Patanjali",
        category: "Dairy",
        unit: "Jar",
        avgSellDays: 25,
        warningDays: 60,
        mrp: 295,
        wholesale: 260,
    },

    // ── BEVERAGES ─────────────────────────────────────────────────────────────
    {
        name: "Minute Maid Pulpy Orange 1L",
        brand: "Coca-Cola",
        category: "Beverages",
        unit: "Bottle",
        avgSellDays: 14,
        warningDays: 40,
        mrp: 99,
        wholesale: 82,
    },
    {
        name: "Real Fruit Juice Mixed 1L",
        brand: "Dabur",
        category: "Beverages",
        unit: "Bottle",
        avgSellDays: 16,
        warningDays: 45,
        mrp: 130,
        wholesale: 108,
    },
    {
        name: "Paper Boat Aamras 250ml",
        brand: "Paper Boat",
        category: "Beverages",
        unit: "Pack",
        avgSellDays: 12,
        warningDays: 35,
        mrp: 40,
        wholesale: 32,
    },
    {
        name: "Maaza Mango 600ml",
        brand: "Coca-Cola",
        category: "Beverages",
        unit: "Bottle",
        avgSellDays: 18,
        warningDays: 50,
        mrp: 45,
        wholesale: 36,
    },
    {
        name: "Tropicana Orange 1L",
        brand: "PepsiCo",
        category: "Beverages",
        unit: "Bottle",
        avgSellDays: 15,
        warningDays: 42,
        mrp: 120,
        wholesale: 99,
    },

    // ── SNACKS ────────────────────────────────────────────────────────────────
    {
        name: "Lays Classic Salted 52g",
        brand: "PepsiCo",
        category: "Snacks",
        unit: "Pack",
        avgSellDays: 20,
        warningDays: 55,
        mrp: 20,
        wholesale: 16,
    },
    {
        name: "Kurkure Masala Munch 90g",
        brand: "PepsiCo",
        category: "Snacks",
        unit: "Pack",
        avgSellDays: 22,
        warningDays: 60,
        mrp: 25,
        wholesale: 20,
    },
    {
        name: "Haldirams Aloo Bhujia 200g",
        brand: "Haldirams",
        category: "Snacks",
        unit: "Pack",
        avgSellDays: 25,
        warningDays: 65,
        mrp: 85,
        wholesale: 70,
    },

    // ── BISCUITS ──────────────────────────────────────────────────────────────
    {
        name: "Parle-G Biscuits 800g",
        brand: "Parle",
        category: "Biscuits",
        unit: "Pack",
        avgSellDays: 28,
        warningDays: 70,
        mrp: 50,
        wholesale: 42,
    },
    {
        name: "Britannia Good Day Cashew 200g",
        brand: "Britannia",
        category: "Biscuits",
        unit: "Pack",
        avgSellDays: 25,
        warningDays: 65,
        mrp: 40,
        wholesale: 33,
    },
    {
        name: "Hide & Seek Chocolate 120g",
        brand: "Parle",
        category: "Biscuits",
        unit: "Pack",
        avgSellDays: 30,
        warningDays: 75,
        mrp: 35,
        wholesale: 28,
    },
    {
        name: "Maggi 2-Minute Noodles 12-pack",
        brand: "Nestle",
        category: "Instant Food",
        unit: "Pack",
        avgSellDays: 20,
        warningDays: 55,   // warn 55 days before expiry so retailer has 35 days to sell
        mrp: 132,
        wholesale: 110,
    },

    // ── STAPLES ───────────────────────────────────────────────────────────────
    {
        name: "Tata Salt 1kg",
        brand: "Tata",
        category: "Staples",
        unit: "Pack",
        avgSellDays: 45,
        warningDays: 90,   // salt has long shelf life but warn early anyway
        mrp: 28,
        wholesale: 22,
    },
    {
        name: "Fortune Soyabean Oil 1L",
        brand: "Fortune",
        category: "Staples",
        unit: "Bottle",
        avgSellDays: 38,
        warningDays: 85,
        mrp: 165,
        wholesale: 140,
    },
    {
        name: "Aashirvaad Atta 5kg",
        brand: "ITC",
        category: "Staples",
        unit: "Bag",
        avgSellDays: 22,
        warningDays: 60,
        mrp: 265,
        wholesale: 235,
    },

    // ── PERSONAL CARE ─────────────────────────────────────────────────────────
    {
        name: "Dettol Handwash 250ml",
        brand: "Dettol",
        category: "Personal Care",
        unit: "Bottle",
        avgSellDays: 35,
        warningDays: 80,
        mrp: 105,
        wholesale: 88,
    },
    {
        name: "Colgate MaxFresh 150g",
        brand: "Colgate",
        category: "Personal Care",
        unit: "Tube",
        avgSellDays: 32,
        warningDays: 75,
        mrp: 88,
        wholesale: 72,
    },
    {
        name: "Lifebuoy Total 10 Soap 4-pack",
        brand: "HUL",
        category: "Personal Care",
        unit: "Pack",
        avgSellDays: 28,
        warningDays: 70,
        mrp: 72,
        wholesale: 60,
    },
]

// ── REALISTIC RETAILER PROFILES ───────────────────────────────────────────────
// Each retailer has a defined personality that determines their scoring.
// This is what makes the engine rankings meaningful and differentiated.
//
// Tier 1 (rank 1-5): Large shops, buy frequently, sell fast, reliable
// Tier 2 (rank 6-10): Medium shops, buy occasionally, decent sell-through
// Tier 3 (rank 11-15): Small shops, infrequent buyers, slower sell-through

const RETAILERS = [
    // ── TIER 1: High-value buyers ─────────────────────────────────────────────
    {
        shopName: "Sharma General Store",
        ownerName: "Rajesh Sharma",
        address: "Station Road, Jaipur",
        city: "Jaipur",
        phone: "9829100001",
        tier: 1,
        preferredCategories: ["Dairy", "Beverages", "Staples"],
        orderFrequencyDays: 4,   // orders every 4 days
        avgUnitsPerOrder: 120,
        reliability: 0.96,       // 96% orders completed
        sellThroughSpeed: "fast", // clears stock in 60-70% of avg sell days
    },
    {
        shopName: "Shree Ram Provision Store",
        ownerName: "Ramesh Kumar",
        address: "Sindhi Camp, Jaipur",
        city: "Jaipur",
        phone: "9829100002",
        tier: 1,
        preferredCategories: ["Beverages", "Snacks", "Biscuits"],
        orderFrequencyDays: 3,
        avgUnitsPerOrder: 140,
        reliability: 0.94,
        sellThroughSpeed: "fast",
    },
    {
        shopName: "Jai Hind Stores",
        ownerName: "Suresh Gupta",
        address: "Lal Kothi, Jaipur",
        city: "Jaipur",
        phone: "9829100003",
        tier: 1,
        preferredCategories: ["Biscuits", "Snacks", "Instant Food"],
        orderFrequencyDays: 4,
        avgUnitsPerOrder: 110,
        reliability: 0.95,
        sellThroughSpeed: "fast",
    },
    {
        shopName: "Meena Traders",
        ownerName: "Dinesh Meena",
        address: "Civil Lines, Jodhpur",
        city: "Jodhpur",
        phone: "9829100004",
        tier: 1,
        preferredCategories: ["Staples", "Personal Care", "Dairy"],
        orderFrequencyDays: 5,
        avgUnitsPerOrder: 100,
        reliability: 0.93,
        sellThroughSpeed: "fast",
    },
    {
        shopName: "Rajputana Kirana",
        ownerName: "Vikram Singh Rathore",
        address: "Nehru Nagar, Ajmer",
        city: "Ajmer",
        phone: "9829100005",
        tier: 1,
        preferredCategories: ["Dairy", "Staples", "Beverages"],
        orderFrequencyDays: 5,
        avgUnitsPerOrder: 95,
        reliability: 0.92,
        sellThroughSpeed: "fast",
    },

    // ── TIER 2: Medium buyers ─────────────────────────────────────────────────
    {
        shopName: "Bharat Bazaar",
        ownerName: "Anil Verma",
        address: "Mansarovar, Jaipur",
        city: "Jaipur",
        phone: "9829100006",
        tier: 2,
        preferredCategories: ["Beverages", "Dairy"],
        orderFrequencyDays: 10,
        avgUnitsPerOrder: 60,
        reliability: 0.82,
        sellThroughSpeed: "medium",
    },
    {
        shopName: "Rajdhani Retail",
        ownerName: "Pradeep Joshi",
        address: "Vidhyadhar Nagar, Jaipur",
        city: "Jaipur",
        phone: "9829100007",
        tier: 2,
        preferredCategories: ["Dairy", "Biscuits"],
        orderFrequencyDays: 9,
        avgUnitsPerOrder: 55,
        reliability: 0.80,
        sellThroughSpeed: "medium",
    },
    {
        shopName: "Gupta Super Store",
        ownerName: "Mahesh Gupta",
        address: "Murlipura, Jaipur",
        city: "Jaipur",
        phone: "9829100008",
        tier: 2,
        preferredCategories: ["Staples", "Personal Care"],
        orderFrequencyDays: 11,
        avgUnitsPerOrder: 50,
        reliability: 0.78,
        sellThroughSpeed: "medium",
    },
    {
        shopName: "Vaishnav Mart",
        ownerName: "Harish Vaishnav",
        address: "Gopalpura, Jaipur",
        city: "Jaipur",
        phone: "9829100009",
        tier: 2,
        preferredCategories: ["Personal Care", "Staples"],
        orderFrequencyDays: 12,
        avgUnitsPerOrder: 45,
        reliability: 0.76,
        sellThroughSpeed: "medium",
    },
    {
        shopName: "New India Stores",
        ownerName: "Govind Prasad",
        address: "Tonk Road, Jaipur",
        city: "Jaipur",
        phone: "9829100010",
        tier: 2,
        preferredCategories: ["Snacks", "Beverages"],
        orderFrequencyDays: 10,
        avgUnitsPerOrder: 65,
        reliability: 0.83,
        sellThroughSpeed: "medium",
    },

    // ── TIER 3: Small / infrequent buyers ─────────────────────────────────────
    {
        shopName: "Soni Provision Store",
        ownerName: "Kamlesh Soni",
        address: "Bapu Nagar, Jaipur",
        city: "Jaipur",
        phone: "9829100011",
        tier: 3,
        preferredCategories: ["Staples"],
        orderFrequencyDays: 22,
        avgUnitsPerOrder: 25,
        reliability: 0.65,
        sellThroughSpeed: "slow",
    },
    {
        shopName: "Om Shanti Kirana",
        ownerName: "Brijmohan Sharma",
        address: "Sodala, Jaipur",
        city: "Jaipur",
        phone: "9829100012",
        tier: 3,
        preferredCategories: ["Biscuits"],
        orderFrequencyDays: 25,
        avgUnitsPerOrder: 20,
        reliability: 0.60,
        sellThroughSpeed: "slow",
    },
    {
        shopName: "Mahaveer Traders",
        ownerName: "Santosh Jain",
        address: "C-Scheme, Jaipur",
        city: "Jaipur",
        phone: "9829100013",
        tier: 3,
        preferredCategories: ["Dairy"],
        orderFrequencyDays: 28,
        avgUnitsPerOrder: 18,
        reliability: 0.58,
        sellThroughSpeed: "slow",
    },
    {
        shopName: "Shreenath Kirana",
        ownerName: "Ramkishore Pareek",
        address: "Vaishali Nagar, Jaipur",
        city: "Jaipur",
        phone: "9829100014",
        tier: 3,
        preferredCategories: ["Snacks", "Biscuits"],
        orderFrequencyDays: 30,
        avgUnitsPerOrder: 15,
        reliability: 0.55,
        sellThroughSpeed: "slow",
    },
    {
        shopName: "Durga General Store",
        ownerName: "Mohan Lal Sharma",
        address: "Raja Park, Jaipur",
        city: "Jaipur",
        phone: "9829100015",
        tier: 3,
        preferredCategories: ["Staples", "Personal Care"],
        orderFrequencyDays: 26,
        avgUnitsPerOrder: 22,
        reliability: 0.62,
        sellThroughSpeed: "slow",
    },
]

const MERCHANDISERS = [
    {
        name: "Vikram Agarwal",
        shopName: "Vikram Agarwal Distributors",
        address: "Industrial Area Phase 2, Jaipur",
        phone: "9828000001",
    },
    {
        name: "Sunil Bansal",
        shopName: "Rajasthan FMCG Hub",
        address: "Sanganer, Jaipur",
        phone: "9828000002",
    },
    {
        name: "Amit Khandelwal",
        shopName: "Jaipur Wholesale Depot",
        address: "Sitapura Industrial Area, Jaipur",
        phone: "9828000003",
    },
]

// ── MAIN SEEDER ───────────────────────────────────────────────────────────────

async function main() {
    console.log("🌱 Starting ShelfSense seed — v2 (realistic data)\n")

    // ── CLEAR EXISTING DATA ───────────────────────────────────────────────────
    console.log("🗑️  Clearing existing data...")
    await prisma.engineRunLog.deleteMany().catch(() => { })
    await prisma.notificationLog.deleteMany().catch(() => { })
    await prisma.retailerScore.deleteMany().catch(() => { })
    await prisma.productAnalytics.deleteMany().catch(() => { })
    await prisma.dailySale.deleteMany().catch(() => { })
    await prisma.orderItem.deleteMany().catch(() => { })
    await prisma.order.deleteMany().catch(() => { })
    await prisma.retailerStock.deleteMany().catch(() => { })
    await prisma.inventoryBatch.deleteMany().catch(() => { })
    await prisma.product.deleteMany().catch(() => { })
    await prisma.user.deleteMany().catch(() => { })
    console.log("   ✅ Cleared\n")

    // ── 1. CREATE MERCHANDISERS ───────────────────────────────────────────────
    console.log("👤 Creating merchandisers...")
    const merchandisers = []
    for (const m of MERCHANDISERS) {
        const created = await prisma.user.create({
            data: {
                name: m.name,
                phone: m.phone,
                role: "MERCHANDISER",
                shopName: m.shopName,
                address: m.address,
                isActive: true,
            },
        })
        merchandisers.push(created)
    }
    console.log(`   ✅ ${merchandisers.length} merchandisers created`)

    // ── 2. CREATE RETAILERS ───────────────────────────────────────────────────
    console.log("🏪 Creating retailers with profiles...")
    const retailerRecords = []
    for (const r of RETAILERS) {
        const created = await prisma.user.create({
            data: {
                name: r.ownerName,
                phone: r.phone,
                role: "RETAILER",
                shopName: r.shopName,
                address: r.address,
                isActive: true,
            },
        })
        retailerRecords.push({ ...created, profile: r })
    }
    console.log(`   ✅ ${retailerRecords.length} retailers created`)

    // ── 3. CREATE PRODUCTS ────────────────────────────────────────────────────
    console.log("📦 Creating products...")
    const productRecords = []
    for (const p of PRODUCTS) {
        const created = await prisma.product.create({
            data: {
                name: p.name,
                brand: p.brand,
                category: p.category,
                unit: p.unit,
            },
        })
        productRecords.push({ ...created, meta: p })
    }
    console.log(`   ✅ ${productRecords.length} products created`)

    // ── 4. CREATE INVENTORY BATCHES WITH DYNAMIC PRICING ─────────────────────
    // Key insight: batches are created with expiry dates that span a wide range.
    // The warning threshold (warningDays) determines when the ENGINE flags them.
    // Pricing drops based on urgency — closer to expiry = cheaper for retailer.
    console.log("🏭 Creating inventory batches with dynamic pricing...")
    const batchRecords = []
    const merchandiser = merchandisers[0] // primary merchandiser owns all batches

    for (const product of productRecords) {
        const { warningDays, wholesale, avgSellDays } = product.meta

        // Create 4 batches per product spanning different urgency levels
        const batchConfigs = [
            // Batch 1: CRITICAL — inside warning window, urgent
            // Retailer gets significant discount to move this fast
            {
                expiryDays: Math.floor(warningDays * 0.3), // 30% of warning window left
                qty: randomBetween(80, 300),
                label: "critical"
            },
            // Batch 2: WARNING — just entered warning window
            // Small discount to incentivize early action
            {
                expiryDays: Math.floor(warningDays * 0.7), // 70% of warning window left
                qty: randomBetween(100, 400),
                label: "warning"
            },
            // Batch 3: MONITOR — approaching warning window
            // Full price, just starting to be tracked
            {
                expiryDays: Math.floor(warningDays * 1.2), // just outside window
                qty: randomBetween(150, 500),
                label: "monitor"
            },
            // Batch 4: SAFE — plenty of time, full price
            {
                expiryDays: warningDays + randomBetween(30, 90),
                qty: randomBetween(200, 600),
                label: "safe"
            },
        ]

        for (const config of batchConfigs) {
            // Compute urgency for pricing — mirrors what engine will compute
            const daysLeft = config.expiryDays
            const urgency = daysLeft <= 0 ? 1.0
                : daysLeft <= warningDays
                    ? parseFloat((1 - daysLeft / warningDays).toFixed(4))
                    : 0

            // Apply dynamic discount based on urgency
            const discountedPrice = computeDiscountedPrice(wholesale, urgency)

            const batch = await prisma.inventoryBatch.create({
                data: {
                    productId: product.id,
                    merchandiserId: merchandiser.id,
                    quantity: config.qty,
                    purchasePrice: parseFloat((wholesale * 0.80).toFixed(2)), // merchandiser bought at 80% of wholesale
                    sellingPrice: discountedPrice, // dynamic price based on urgency
                    expiryDate: daysFromNow(config.expiryDays),
                    createdAt: daysFromNow(-randomBetween(5, 45)),
                },
            })
            batchRecords.push({ ...batch, label: config.label, productMeta: product.meta })
        }
    }
    console.log(`   ✅ ${batchRecords.length} batches created with dynamic pricing`)

    // ── 5. CREATE REALISTIC ORDER HISTORY (120 days) ──────────────────────────
    // This is the most important part for scoring.
    // Each retailer's buying history directly determines their scores.
    console.log("🛒 Creating 120 days of order history...")
    let totalOrders = 0
    let totalItems = 0

    for (const retailer of retailerRecords) {
        const { profile } = retailer
        const { preferredCategories, orderFrequencyDays, avgUnitsPerOrder, reliability } = profile

        // Generate orders going back 120 days
        let currentDay = -120
        while (currentDay < 0) {
            // Add slight randomness to order frequency (+/- 2 days)
            const nextOrderGap = orderFrequencyDays + randomBetween(-2, 2)

            // Skip order based on reliability score
            if (Math.random() > reliability) {
                currentDay += nextOrderGap
                continue
            }

            const orderDate = daysFromNow(currentDay)

            // Select products for this order
            // 75% chance to pick from preferred categories, 25% anything
            const numProducts = randomBetween(2, 5)
            const selectedProducts = []

            for (let i = 0; i < numProducts; i++) {
                const usePreferred = Math.random() < 0.75
                const pool = usePreferred
                    ? productRecords.filter(p => preferredCategories.includes(p.meta.category))
                    : productRecords

                if (pool.length === 0) continue
                const picked = randomItem(pool)
                if (!selectedProducts.find(p => p.id === picked.id)) {
                    selectedProducts.push(picked)
                }
            }

            if (selectedProducts.length === 0) {
                currentDay += nextOrderGap
                continue
            }

            // Build order items — find a batch for each product
            const orderItems = []
            for (const product of selectedProducts) {
                const batch = batchRecords.find(b => b.productId === product.id)
                if (!batch) continue

                // Units ordered varies by retailer tier
                const units = randomBetween(
                    Math.floor(avgUnitsPerOrder * 0.5),
                    Math.floor(avgUnitsPerOrder * 1.5)
                )

                orderItems.push({
                    inventoryBatchId: batch.id,
                    quantity: units,
                    price: batch.sellingPrice,
                })
            }

            if (orderItems.length === 0) {
                currentDay += nextOrderGap
                continue
            }

            // Determine order status — tier 1 almost always complete
            const status = Math.random() < reliability ? "COMPLETED" : "CANCELLED"

            await prisma.order.create({
                data: {
                    retailerId: retailer.id,
                    merchandiserId: merchandiser.id,
                    status,
                    createdAt: orderDate,
                    items: { create: orderItems },
                },
            })

            totalOrders++
            totalItems += orderItems.length
            currentDay += nextOrderGap
        }
    }
    console.log(`   ✅ ${totalOrders} orders, ${totalItems} order items`)

    // ── 6. CREATE DAILY SALES (sell-through data) ─────────────────────────────
    // Sell-through score depends on this — how fast does each retailer
    // actually clear stock to end customers?
    // Tier 1 retailers sell fast, Tier 3 slow.
    console.log("📊 Creating daily sales data...")
    let totalSales = 0

    for (const retailer of retailerRecords) {
        const { profile } = retailer
        const { preferredCategories, sellThroughSpeed } = profile

        // Velocity multiplier based on tier
        const velocityMultiplier = sellThroughSpeed === "fast" ? 1.8
            : sellThroughSpeed === "medium" ? 1.0
                : 0.45

        const relevantProducts = productRecords.filter(p =>
            preferredCategories.includes(p.meta.category)
        )

        for (const product of relevantProducts) {
            const { avgSellDays } = product.meta

            // Generate daily sales for last 90 days
            for (let day = -90; day < 0; day++) {
                // Tier 1: sells 80% of days, Tier 3: sells 40% of days
                const saleChance = sellThroughSpeed === "fast" ? 0.80
                    : sellThroughSpeed === "medium" ? 0.60
                        : 0.40

                if (Math.random() > saleChance) continue

                // Base daily sales = (units per month) / 30 × velocity
                const monthlyUnits = avgSellDays > 0 ? 30 / avgSellDays : 2
                const dailyQty = Math.max(1, Math.round(
                    monthlyUnits * velocityMultiplier * randomFloat(0.7, 1.3)
                ))

                const saleDate = daysFromNow(day)
                saleDate.setHours(0, 0, 0, 0)

                try {
                    await prisma.dailySale.create({
                        data: {
                            retailerId: retailer.id,
                            productId: product.id,
                            quantity: dailyQty,
                            date: saleDate,
                        },
                    })
                    totalSales++
                } catch {
                    // Skip duplicate date+retailer+product combos
                }
            }
        }
    }
    console.log(`   ✅ ${totalSales} daily sale records`)

    // ── 7. CREATE RETAILER STOCK ──────────────────────────────────────────────
    console.log("📦 Creating retailer stock levels...")
    let totalStock = 0

    for (const retailer of retailerRecords) {
        const { profile } = retailer
        const relevantProducts = productRecords.filter(p =>
            profile.preferredCategories.includes(p.meta.category)
        )

        for (const product of relevantProducts) {
            // Tier 1 holds more stock, Tier 3 holds less
            const stockQty = profile.tier === 1 ? randomBetween(50, 250)
                : profile.tier === 2 ? randomBetween(20, 100)
                    : randomBetween(5, 40)

            await prisma.retailerStock.upsert({
                where: { retailerId_productId: { retailerId: retailer.id, productId: product.id } },
                update: {},
                create: {
                    retailerId: retailer.id,
                    productId: product.id,
                    quantity: stockQty,
                },
            })
            totalStock++
        }
    }
    console.log(`   ✅ ${totalStock} retailer stock records`)

    // ── SUMMARY ───────────────────────────────────────────────────────────────
    console.log("\n═══════════════════════════════════════════════════════")
    console.log("✅ SHELFSENSE SEED COMPLETE")
    console.log("═══════════════════════════════════════════════════════")
    console.log(`   👤 Merchandisers  : ${merchandisers.length}`)
    console.log(`   🏪 Retailers      : ${retailerRecords.length} (5 Tier1 / 5 Tier2 / 5 Tier3)`)
    console.log(`   📦 Products       : ${productRecords.length}`)
    console.log(`   🏭 Batches        : ${batchRecords.length} (with dynamic pricing)`)
    console.log(`   🛒 Orders         : ${totalOrders} (120 days history)`)
    console.log(`   📋 Order Items    : ${totalItems}`)
    console.log(`   📊 Daily Sales    : ${totalSales} (90 days)`)
    console.log(`   📦 Retailer Stock : ${totalStock}`)
    console.log("═══════════════════════════════════════════════════════")
    console.log("\n💡 Key improvements in this seed:")
    console.log("   • warningDays is generous — retailers get real lead time")
    console.log("   • Prices drop as urgency increases (dynamic pricing)")
    console.log("   • Retailers have distinct profiles — scoring will differentiate")
    console.log("   • 120 days of order history for better score accuracy")
    console.log("   • Real Indian retailer names and locations")
    console.log("\n🚀 Now run POST /api/engine/run to see scores!\n")
}

main()
    .catch(e => {
        console.error("❌ Seed failed:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })