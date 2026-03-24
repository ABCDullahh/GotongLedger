<h1 align="center">GotongLedger</h1>

<p align="center">
  <strong>Radical Transparency by Design</strong>
</p>

<p align="center">
  A full-stack Web3 donation transparency platform powered by the Ethereum blockchain.<br/>
  Every donation recorded on-chain. Every expense verifiable via IPFS. Every cent accounted for.
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Production%20Ready-2EAD33?style=flat" />
  <img alt="Solidity" src="https://img.shields.io/badge/Solidity-0.8.24-363636?style=flat&logo=solidity" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-000000?style=flat&logo=next.js" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat&logo=typescript" />
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat&logo=tailwindcss" />
  <img alt="Playwright" src="https://img.shields.io/badge/Tests-300%2B%20E2E-2EAD33?style=flat&logo=playwright" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-yellow?style=flat" />
</p>

---

## Preview

<table>
  <tr>
    <td><img src="showcase/01-homepage.png" alt="Homepage" width="400"/></td>
    <td><img src="showcase/02-campaign-detail.png" alt="Campaign Detail" width="400"/></td>
  </tr>
  <tr>
    <td align="center"><strong>Homepage</strong></td>
    <td align="center"><strong>Campaign Detail</strong></td>
  </tr>
  <tr>
    <td><img src="showcase/03-transparency-report.png" alt="Transparency Report" width="400"/></td>
    <td><img src="showcase/04-analytics.png" alt="Analytics Dashboard" width="400"/></td>
  </tr>
  <tr>
    <td align="center"><strong>Transparency Report</strong></td>
    <td align="center"><strong>Analytics Dashboard</strong></td>
  </tr>
  <tr>
    <td><img src="showcase/05-admin.png" alt="Admin Command Center" width="400"/></td>
    <td><img src="showcase/06-how-it-works.png" alt="How It Works" width="400"/></td>
  </tr>
  <tr>
    <td align="center"><strong>Admin Command Center</strong></td>
    <td align="center"><strong>How It Works</strong></td>
  </tr>
  <tr>
    <td><img src="showcase/07-health.png" alt="System Health" width="400"/></td>
    <td><img src="showcase/08-tx-explorer.png" alt="Transaction Explorer" width="400"/></td>
  </tr>
  <tr>
    <td align="center"><strong>Network Status</strong></td>
    <td align="center"><strong>Transaction Explorer</strong></td>
  </tr>
</table>

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, Tailwind CSS, shadcn/ui, Framer Motion, Recharts |
| **Blockchain** | Solidity 0.8.24, Hardhat, OpenZeppelin (AccessControl, ReentrancyGuard) |
| **Web3** | wagmi v2, viem, MetaMask, WalletConnect v2, Coinbase Wallet |
| **Storage** | IPFS (Kubo/Pinata), SQLite/PostgreSQL (Prisma ORM) |
| **Testing** | Playwright (300+ E2E tests), Hardhat contract tests |
| **Design** | Void Monolith dark editorial theme (Epilogue + Inter + Space Grotesk) |
| **Deployment** | Docker, GCP Cloud Run ready, Sepolia testnet config |

---

## Features

### Core Blockchain
- **Campaign Creation** — Deploy transparent donation campaigns on-chain
- **Donation Tracking** — Every ETH donation recorded immutably with events
- **Expense Recording** — Record expenses with IPFS proof documents
- **Campaign Milestones** — Set fundraising goals with auto-triggered milestone events

### Multi-Wallet Support
- MetaMask (browser extension)
- WalletConnect v2 (QR code scanning)
- Coinbase Wallet (mobile & extension)

### Transparency & Analytics
- **Transparency Report** — Full campaign audit with anomaly detection, charts, 100% confidence score
- **Analytics Dashboard** — KPI cards, donation volume, top campaigns, expense breakdown, size distribution
- **Expense Proof Verification** — IPFS CID integrity check with visual ProofBadge
- **Donor Leaderboard** — Top donors per campaign, ranked by total amount

### Sharing & Export
- **OG Image API** — Dynamic Open Graph images for social media
- **Embeddable Widget** — Compact iframe embed for external sites
- **Share Button** — Copy link + Twitter sharing
- **CSV Export** — Download campaign data

### Infrastructure
- **Real-Time Notifications** — Polls blockchain every 15s, toast on new donations
- **Campaign Categories** — 7 categories with filter chips (Education, Health, etc.)
- **System Health Monitor** — Service status, latency tracking, contract deployment info
- **Transaction Explorer** — View tx details, gas info, event logs

---

## Smart Contract — CampaignLedger.sol

```solidity
// Core Functions
createCampaign(address treasury) → uint256 campaignId
donate(uint256 campaignId) payable
recordExpense(campaignId, amount, category, cid, note)
setCampaignGoal(campaignId, goalWei)
setMilestone(campaignId, percentage, description)

// Events
CampaignCreated, DonationReceived, ExpenseRecorded
MilestoneReached, CampaignGoalSet, CampaignStatusChanged
```

- **Security:** OpenZeppelin AccessControl + ReentrancyGuard
- **Roles:** Admin, Operator, Campaign Owner
- **Milestones:** Auto-detected on donation when goal percentage is reached

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Homepage | Hero, stats, Flow Dynamics chart, campaign grid with category filters |
| `/campaign/[id]` | Campaign Detail | Stats, donations table, QR payment, donor leaderboard, embed widget |
| `/campaign/[id]/report` | Transparency Report | Audit with anomaly detection, charts, expense/donation ledgers |
| `/analytics` | Analytics Dashboard | KPI cards, donation volume, top campaigns, expense breakdown |
| `/admin` | Command Center | Create campaign, record expense with IPFS upload |
| `/how-it-works` | Architecture | 3-layer architecture, trust framework, lifecycle, contract info |
| `/health` | Network Status | Service health, latency, contract deployment |
| `/explorer/tx/[hash]` | Transaction Explorer | Tx details, gas info, event logs |
| `/embed/[id]` | Embed Widget | Compact standalone widget for iframes |
| `/api/og` | OG Image API | Dynamic social media image generation |

---

## Architecture

### Three-Layer Data Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│                     Next.js 14 (App Router)                     │
│         Tailwind CSS · shadcn/ui · Framer Motion · Recharts     │
└────────────┬───────────────────┬───────────────────┬────────────┘
             │                   │                   │
             ▼                   ▼                   ▼
┌────────────────────┐ ┌─────────────────┐ ┌──────────────────────┐
│   LAYER 1: ON-CHAIN│ │ LAYER 2: IPFS   │ │ LAYER 3: OFF-CHAIN   │
│   (Source of Truth) │ │ (Proof Storage) │ │ (Metadata Cache)     │
│                    │ │                 │ │                      │
│ • Campaign Events  │ │ • Expense       │ │ • Campaign Titles    │
│ • Donation Logs    │ │   Receipts      │ │ • Descriptions       │
│ • Expense Records  │ │ • Content-      │ │ • Categories         │
│ • Milestones       │ │   Addressed     │ │ • File Metadata      │
│ • Timestamps       │ │   (CID)         │ │                      │
│ • Tx Hashes        │ │ • Immutable     │ │ SQLite / PostgreSQL  │
│                    │ │   Files         │ │ (Prisma ORM)         │
│ Ethereum (Hardhat/ │ │                 │ │                      │
│ Sepolia)           │ │ Kubo / Pinata   │ │                      │
└────────────────────┘ └─────────────────┘ └──────────────────────┘
```

### Donation Flow

```
Donor                  Smart Contract              Treasury          IPFS
  │                         │                         │                │
  │  1. donate(campaignId)  │                         │                │
  │  ──────────────────────>│                         │                │
  │        {value: X ETH}   │                         │                │
  │                         │  2. Forward ETH         │                │
  │                         │  ───────────────────────>│                │
  │                         │                         │                │
  │                         │  3. Emit DonationReceived                │
  │                         │  ◄──────────────────────                 │
  │                         │                         │                │
  │                         │  4. Check Milestones    │                │
  │                         │  (auto if goal set)     │                │
  │                         │                         │                │
  │  5. Toast notification  │                         │                │
  │  ◄──────────────────────│                         │                │
  │  (via 15s polling)      │                         │                │
```

### Expense Recording Flow

```
Admin                  Smart Contract              IPFS            Database
  │                         │                       │                 │
  │  1. Upload proof doc    │                       │                 │
  │  ──────────────────────────────────────────────>│                 │
  │                         │                       │                 │
  │  2. Receive CID         │                       │                 │
  │  ◄──────────────────────────────────────────────│                 │
  │                         │                       │                 │
  │  3. recordExpense(      │                       │                 │
  │     campaignId,         │                       │                 │
  │     amount, category,   │                       │                 │
  │     CID, note)          │                       │                 │
  │  ──────────────────────>│                       │                 │
  │                         │                       │                 │
  │                         │  4. Emit ExpenseRecorded                │
  │                         │  ◄──────────────────────                │
  │                         │                       │                 │
  │  5. Save file metadata  │                       │                 │
  │  ────────────────────────────────────────────────────────────────>│
```

### Milestone Auto-Detection Flow

```
Donation Received
       │
       ▼
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ campaignGoal │────>│  currentAmount  │────>│ Check all         │
│ set? (>0)    │ yes │  / goalWei      │     │ milestones        │
└──────┬───────┘     │  = percentage   │     │ for this campaign │
       │ no          └─────────────────┘     └────────┬─────────┘
       ▼                                              │
  (skip check)                                        ▼
                                          ┌───────────────────────┐
                                          │ For each milestone:   │
                                          │ if % >= target AND    │
                                          │    reachedAt == 0     │
                                          │ → Set reachedAt       │
                                          │ → Emit MilestoneReached│
                                          └───────────────────────┘
```

### Service Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Docker Compose                            │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  IPFS Kubo       │  │  PostgreSQL 16  │                   │
│  │  Port: 5001/8080 │  │  Port: 5432     │                   │
│  │  (API / Gateway) │  │  gotongledger   │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
└───────────┼────────────────────┼─────────────────────────────┘
            │                    │
            ▼                    ▼
┌───────────────────────────────────────────────────────────────┐
│                   Next.js 14 (Port: 3939)                     │
│                                                               │
│  App Router          API Routes           Prisma ORM          │
│  ┌────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │ 10 Pages   │     │ /api/campaigns│     │ SQLite (dev) │   │
│  │ + Layouts  │     │ /api/ipfs/*  │     │ PostgreSQL   │   │
│  │            │     │ /api/og      │     │ (production) │   │
│  └────────────┘     │ /api/health  │     └──────────────┘   │
│                     │ /api/chain   │                         │
│  wagmi + viem       └──────────────┘                         │
│  ┌─────────────────────────────┐                             │
│  │ MetaMask · WalletConnect    │                             │
│  │ Coinbase Wallet             │                             │
│  └──────────────┬──────────────┘                             │
│                 │                                             │
└─────────────────┼─────────────────────────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────────────────────────┐
│              Hardhat Node (Port: 8545)                         │
│              Chain ID: 31337                                  │
│                                                               │
│  CampaignLedger.sol                                           │
│  ├── createCampaign()        ├── setCampaignGoal()            │
│  ├── donate()                ├── setMilestone()               │
│  ├── recordExpense()         ├── setCampaignActive()          │
│  └── Events: CampaignCreated, DonationReceived,               │
│       ExpenseRecorded, MilestoneReached                       │
└───────────────────────────────────────────────────────────────┘
```

### Transparency Report Pipeline

```
Campaign Data Request
       │
       ▼
┌──────────────────┐
│ Fetch on-chain:  │
│ • Donations      │
│ • Expenses       │
│ • Campaign info  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌────────────────────────┐
│ Anomaly Detection│────>│ Check for:             │
│                  │     │ • Missing IPFS proofs  │
│                  │     │ • High expense ratio   │
│                  │     │   (>50% of donations)  │
└────────┬─────────┘     └────────────────────────┘
         │
         ▼
┌──────────────────┐
│ Generate Report: │
│ • Summary cards  │
│ • Donut chart    │
│ • Bar chart      │
│ • Category table │
│ • Expense ledger │
│ • Donation ledger│
│ • Confidence %   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Export Options:   │
│ • CSV download   │
│ • Print report   │
│ • Share link     │
└──────────────────┘
```

---

## Design System — Void Monolith

```
Base:      #131314 (Deep Void)
Primary:   #FFB3AE / #FF5555 (Coral Red)
Secondary: #AED18D (Soft Lime)
Fonts:     Epilogue (headlines) · Inter (body) · Space Grotesk (data)
```

**Design Rules:**
- Dark-only editorial theme — no light mode
- Ghost borders: `1px solid outline-variant at 15% opacity` — no standard borders
- Tonal layering via background color shifts — no drop shadows
- 4px sharp corners (`rounded-sm`) — no rounded bubbles
- Glassmorphism: `backdrop-blur(20px)` at 12% opacity for floating elements
- Neon glow: `box-shadow 15px blur primary at 20% opacity` on hover
- Labels: `font-label uppercase tracking-widest 10px` — technical terminal style
- 90% neutrals — coral red & lime green only for critical actions/signals

**Surface Hierarchy:**
```
#131314  →  Base (surface)
#1C1B1C  →  Cards (surface-container-low)
#201F20  →  Sections (surface-container)
#2A2A2B  →  Elevated (surface-container-high)
#353436  →  Inputs (surface-container-highest)
#3A393A  →  Hover (surface-bright)
#0E0E0F  →  Recessed / Footer (tonal-shift)
```

---

## Security

### Smart Contract Security
- **OpenZeppelin AccessControl** — Role-based permissions (Admin, Operator, Owner)
- **ReentrancyGuard** — Protection against reentrancy attacks on `donate()`
- **Input validation** — Custom errors for invalid treasury, empty CID, empty category
- **Treasury forwarding** — Donations forwarded directly to treasury address, not held in contract

### API Security
- **Input validation** — All API routes validate request body/params
- **Ethereum address regex** — `^0x[0-9a-fA-F]{40}$` format check
- **CID format validation** — `^[a-zA-Z0-9]+$` to prevent path traversal
- **Filename sanitization** — Strip non-alphanumeric characters on IPFS upload
- **File type whitelist** — Only PDF, JPG, PNG allowed for proof documents
- **File size limit** — 10MB maximum upload
- **Input truncation** — OG image API truncates inputs to prevent abuse

### Frontend Security
- **No secrets in client code** — All sensitive values via environment variables
- **CSP-safe** — No inline scripts or eval
- **XSS prevention** — React's built-in escaping + no `dangerouslySetInnerHTML`

---

## Accessibility

- `aria-label` on all interactive elements (buttons, links, inputs)
- `aria-expanded` on mobile menu toggle
- `aria-current="page"` on active breadcrumb
- `aria-hidden="true"` on decorative icons
- `aria-label="Breadcrumb"` on navigation
- `aria-label="Main navigation"` on navbar
- `aria-label="Site footer"` on footer
- Keyboard navigable throughout
- Focus rings on all interactive elements

---

## Demo Data

The seed script (`contracts/scripts/seed-full-demo.ts`) creates:

| # | Campaign | Category | Goal | Raised | Spent | Donors | Expenses |
|---|----------|----------|------|--------|-------|--------|----------|
| 1 | Clean Water Initiative Jakarta | Health | 10 ETH | 4.00 ETH | 2.00 ETH | 3 | 2 |
| 2 | Solar Grid Initiative #4 | Environment | 5 ETH | 4.50 ETH | 2.50 ETH | 2 | 2 |
| 3 | Education for All | Education | 3 ETH | 1.25 ETH | 0.90 ETH | 2 | 2 |
| 4 | Rural Health Clinic Sumatra | Health | 15 ETH | 8.75 ETH | 6.50 ETH | 5 | 3 |
| 5 | Urban Farming Collective | Community | 8 ETH | 5.35 ETH | 3.00 ETH | 4 | 3 |
| 6 | Disaster Relief Bridge Sulawesi | Infrastructure | 20 ETH | 12.00 ETH | 9.50 ETH | 5 | 3 |
| **Total** | | **5 categories** | **61 ETH** | **35.85 ETH** | **24.40 ETH** | **9 unique** | **15** |

**Expense categories used:** Equipment, Logistics, Personnel, Medical, Shelter, Education, Food

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Docker (for IPFS + PostgreSQL)

### Quick Start

```bash
# Clone
git clone https://github.com/ABCDullahh/GotongLedger.git
cd GotongLedger

# Install dependencies
pnpm install

# Start Docker services (IPFS + PostgreSQL)
docker compose up -d

# Start Hardhat local blockchain
cd contracts
npx hardhat node &

# Deploy smart contract
npx hardhat run scripts/deploy.ts --network localhost

# Seed demo data (6 campaigns, 21 donations, 15 expenses)
npx hardhat run scripts/seed-full-demo.ts --network localhost

# Start frontend
cd ../web
npx prisma generate
npx next dev -p 3939
```

Open [http://localhost:3939](http://localhost:3939)

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://gotong:gotong123@localhost:5432/gotongledger"

# Chain: "localhost" or "sepolia"
NEXT_PUBLIC_CHAIN_ENV="localhost"

# WalletConnect (get from cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"

# IPFS
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY_URL="http://127.0.0.1:8080"
```

---

## Project Structure

```
GotongLedger/
├── contracts/                  # Solidity smart contracts (Hardhat)
│   ├── contracts/
│   │   └── CampaignLedger.sol  # Main contract with milestones
│   ├── scripts/
│   │   ├── deploy.ts           # Deploy with ABI export
│   │   └── seed-full-demo.ts   # Demo data seeder
│   └── hardhat.config.ts       # Hardhat + Sepolia config
│
├── web/                        # Next.js 14 frontend
│   ├── src/
│   │   ├── app/                # App Router pages (10 routes)
│   │   ├── components/         # UI components + shadcn/ui
│   │   └── lib/                # Blockchain, wagmi, utils
│   ├── prisma/                 # Database schema
│   ├── public/                 # Static assets + favicon
│   ├── Dockerfile              # Production Docker image
│   └── next.config.mjs         # Standalone output for Cloud Run
│
├── showcase/                   # 10 full-page screenshots
├── docker-compose.yml          # IPFS + PostgreSQL
└── README.md
```

---

## Build

```
Route                        Size      Type
/                            6.69 kB   Static
/analytics                   7.71 kB   Static
/admin                       34.3 kB   Static
/campaign/[id]               22.4 kB   Dynamic
/campaign/[id]/report        15.3 kB   Dynamic
/health                      4.5 kB    Static
/how-it-works                4.37 kB   Static

Build: 0 errors, 0 warnings, 0 lint issues
```

---

## License

MIT
