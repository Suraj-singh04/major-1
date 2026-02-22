# 🧠 Smart Expiry-Driven Retailer Matching Engine

> An intelligent inventory clearance system that dynamically identifies at-risk stock and ranks the best retailers to offload it — before it expires.

---

## 🧭 What Is This Project?

This is a backend system built for **merchandisers** who manage perishable inventory. The core problem it solves:

> *"I have products expiring soon. Which retailers should I contact, and in what order?"*

Most systems answer this with a simple rule: *"alert if expiry < 7 days."* This system is different. It uses a **multi-layer intelligent engine** that:

- Dynamically calculates how soon is "too soon" — differently for each product
- Scores every retailer across 5 dimensions of buying behaviour
- Ranks and returns the top 5 best-fit retailers per at-risk product
- Gets smarter over time by learning from outcomes (coming in Phase 5)

---

## 🏗️ System Architecture

The engine is split into **5 layers**, each with one clear job:

```
┌─────────────────────────────────────────────────────┐
│              POST /api/engine/run                   │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │   L2: Expiry Engine     │  ← "What is at risk?"
          │  computeProductAnalytics│
          │  computeAtRiskBatches   │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │   L3: Scoring Engine    │  ← "Who should we contact?"
          │   scoreRetailersFor     │
          │       Product()         │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │   L4: Orchestration     │  ← "How do we notify?" (coming soon)
          │   NotificationLog       │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │   L5: Feedback Loop     │  ← "Learn from outcomes" (coming soon)
          │   Weight retuning       │
          └─────────────────────────┘
```

---

## ✅ What Has Been Built (Current State)

### Layer 2 — Expiry Intelligence Engine (COMPLETE)

**File:** `src/lib/engine/computeProductAnalytics.js`

This function looks at all historical order data for every product and computes:

| Field | What It Means |
|---|---|
| `avgDaysToSell` | Rolling average: how many days this product typically takes to sell |
| `sellVelocityPerDay` | Units sold per day over all time |
| `stdDevDays` | How unpredictable the demand is (high = inconsistent buyers) |
| `dynamicThresholdDays` | **The key output:** how many days before expiry we should flag this product |

The threshold formula is:
```
dynamicThresholdDays = ceil(avgDaysToSell + 1.5 × stdDevDays)
```

So a product that averages 10 days to sell with a std dev of 4 days gets a threshold of `ceil(10 + 6) = 16 days`. A fast-moving dairy product with avg 4 days and std dev 1 gets `ceil(4 + 1.5) = 6 days`. **No hardcoding. Fully automatic.**

---

**File:** `src/lib/engine/computeAtRiskBatches.js`

This function reads all inventory batches and flags the ones inside the danger window:

```
urgencyScore = 1 - (daysRemaining / dynamicThresholdDays)
```

- Score of `0.0` = just entered the at-risk window (still time)
- Score of `0.9+` = expiring in 1-2 days (critical)
- Batches are sorted highest urgency first

---

### Layer 3 — Retailer Scoring Engine (COMPLETE)

**File:** `src/lib/engine/scoreRetailer.js`

For every at-risk product, this scores all 15 retailers across **5 dimensions**:

| Score | What It Measures | Data Source |
|---|---|---|
| `purchaseFrequencyScore` | How often they buy this product category (last 180 days) | `Order` table |
| `volumeScore` | Average units per order — bigger buyers score higher | `OrderItem` table |
| `recencyScore` | How recently they bought — decays exponentially over time | `Order` table |
| `sellThroughScore` | How fast they actually sell to end customers | `DailySale` table ⭐ |
| `reliabilityScore` | % of orders that were completed | `Order` status |

All scores are **normalized to 0–1** using min-max normalization so no single dimension dominates unfairly.

**Composite score formula (current weights):**
```
composite = (0.20 × frequency) + (0.20 × volume) + (0.15 × recency)
          + (0.25 × sellThrough) + (0.20 × reliability)
```

The sell-through score has the highest weight (0.25) because a retailer who sells inventory fast is the best home for expiring goods.

Results are saved to the `RetailerScore` table after each run.

---

### The API Endpoint (COMPLETE)

**Route:** `POST /api/engine/run`

Triggers L2 → L3 in sequence and returns:

```json
{
  "success": true,
  "atRiskCount": 37,
  "batches": [
    {
      "batchId": "...",
      "product": "Amul Cheese Slices 200g",
      "category": "Dairy",
      "daysRemaining": 2,
      "urgencyScore": 0.913,
      "quantity": 394,
      "topRetailers": [
        {
          "retailerName": "Sharma General Store Owner",
          "shopName": "Sharma General Store",
          "compositeScore": 0.8727,
          "scores": {
            "frequency": 1,
            "volume": 1,
            "recency": 0.8183,
            "sellThrough": 1,
            "reliability": 0.5
          }
        }
        // ... top 5 retailers
      ]
    }
    // ... all 37 at-risk batches
  ]
}
```

---

## 📊 Understanding the Output

Here is how to read the engine output:

**urgencyScore** tells you how critical the batch is:
- `0.9+` → Expiring in 1-2 days. Notify immediately.
- `0.5–0.9` → Entering danger zone. Notify today.
- `0.0–0.5` → Just entered threshold. Monitor.

**compositeScore** tells you how good a fit the retailer is:
- `0.8+` → Excellent match. They buy this category often, sell fast, reliable.
- `0.5–0.8` → Good match.
- `<0.5` → Weak match — they don't buy this category much or sell slowly.

**What you can verify right now:** Retailers seeded as "high frequency buyers" (retailers 1–5 in the seeder) consistently appear in the top 2 positions across dairy and beverage products. Retailers 11–15 (low frequency) rarely appear. This proves the scoring is working correctly.

---

## 🗄️ Database Schema

### Original Tables (your CRUD)
- `User` — merchandisers and retailers
- `Product` — product catalogue
- `InventoryBatch` — batches with expiry dates
- `Order` + `OrderItem` — purchase history
- `RetailerStock` — current stock at retailer level
- `DailySale` — what retailers sell to end customers each day

### New Engine Tables (added for this project)

**`ProductAnalytics`** — computed stats per product (threshold, velocity, std dev)

**`RetailerScore`** — saved scores per retailer per product after each engine run

**`NotificationLog`** — audit trail of every notification sent (ready for L4/L5)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Database | PostgreSQL |
| ORM | Prisma |
| Runtime | Node.js |
| Containerization | Docker |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL running (or Docker)
- `.env` file with `DATABASE_URL`

### Setup

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed the database with realistic test data
node prisma/seed.js

# Start development server
npm run dev
```

### Seed Data
The seeder creates:
- 3 merchandisers
- 15 retailers (5 high-frequency, 5 medium, 5 low — for scoring validation)
- 20 FMCG products (Indian market: Amul, Patanjali, Parle, etc.)
- ~80 inventory batches (deliberately varied expiry dates)
- ~300+ orders with 90 days of history
- ~1800+ daily sales records across 60 days

### Run the Engine

```bash
# Trigger a full engine run
curl -X POST http://localhost:3000/api/engine/run
```

---

## 📁 Project Structure

```
src/
├── app/
│   └── api/
│       └── engine/
│           └── run/
│               └── route.js          # Engine trigger endpoint
├── lib/
│   ├── db.js                         # Prisma client
│   └── engine/
│       ├── computeProductAnalytics.js # L2: Dynamic threshold computation
│       ├── computeAtRiskBatches.js    # L2: At-risk batch identification
│       └── scoreRetailer.js          # L3: Multi-dimensional retailer scoring
prisma/
├── schema.prisma                     # Full database schema
└── seed.js                           # Realistic data seeder
```

---

## 🗺️ Roadmap

### ✅ Phase 1 — Foundation
Database schema, migrations, CRUD operations

### ✅ Phase 2 — Expiry Intelligence (L2)
Dynamic threshold computation using statistical demand modeling

### ✅ Phase 3 — Retailer Scoring (L3)
5-dimension scoring engine with min-max normalization

### 🔄 Phase 4 — Orchestration & Notifications (L4) ← Next
- Write to `NotificationLog` table
- Deduplication (don't spam same retailer about same batch)
- Top-N selection per batch
- In-app + email notification dispatch

### 📋 Phase 5 — Feedback Loop (L5)
- Track notification outcomes (viewed / ordered / ignored)
- Correlation-based weight retuning
- Engine improves automatically over time

### 📋 Phase 6 — Dashboard UI
- At-risk inventory view for merchandiser
- Retailer notification inbox
- Score breakdown visualization
- Weight evolution chart

### 📋 Phase 7 — LLM Integration
- AI-generated notification copy per retailer
- Natural language analytics ("Why was retailer X ranked #1?")

---

## 💡 Key Design Decisions

**Why dynamic thresholds instead of hardcoded days?**
A product that sells in 3 days needs a 5-day warning window. A slow mover needs 20. Hardcoding "7 days" ignores this entirely and produces false alarms for slow products and missed alerts for fast ones.

**Why is sell-through score weighted highest?**
A retailer who sells inventory fast is the best home for expiring goods — not just because they buy, but because they'll actually clear the stock before it expires on their end too.

**Why min-max normalization?**
Without normalization, a retailer who orders 500 units would always dominate over one who orders 50, regardless of all other factors. Normalization ensures each dimension contributes fairly to the composite score.

---

## 👤 Author

Built as a major portfolio project demonstrating:
- Systems design and multi-layer architecture
- Statistical demand modeling
- Multi-dimensional scoring algorithms
- Production-grade API design
- Database schema design for analytical workloads