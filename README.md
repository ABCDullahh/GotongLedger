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

## Design System — Void Monolith

```
Base:      #131314 (Deep Void)
Primary:   #FFB3AE / #FF5555 (Coral Red)
Secondary: #AED18D (Soft Lime)
Fonts:     Epilogue (headlines) · Inter (body) · Space Grotesk (data)
```

- Dark-only editorial theme
- Ghost borders (1px at 15% opacity)
- Tonal layering (no shadows)
- 4px sharp corners
- Glassmorphism for floating elements
- Neon glow on hover

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
