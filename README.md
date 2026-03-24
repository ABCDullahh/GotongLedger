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

```mermaid
graph TB
    UI["<b>User Interface</b><br/>Next.js 14 · Tailwind · shadcn/ui<br/>Framer Motion · Recharts"]

    subgraph Layer1["Layer 1: On-Chain (Source of Truth)"]
        L1A[Campaign Events]
        L1B[Donation Logs]
        L1C[Expense Records]
        L1D[Milestones & Goals]
        L1E[Timestamps & Tx Hashes]
    end

    subgraph Layer2["Layer 2: IPFS (Proof Storage)"]
        L2A[Expense Receipts]
        L2B[Content-Addressed CID]
        L2C[Immutable Files]
    end

    subgraph Layer3["Layer 3: Off-Chain (Metadata Cache)"]
        L3A[Campaign Titles]
        L3B[Descriptions & Categories]
        L3C[File Metadata]
    end

    UI --> Layer1
    UI --> Layer2
    UI --> Layer3

    style Layer1 fill:#1a0a0a,stroke:#FF5555,color:#FFB3AE
    style Layer2 fill:#0a1a0a,stroke:#AED18D,color:#AED18D
    style Layer3 fill:#0a0a1a,stroke:#AA8986,color:#E5E2E3
    style UI fill:#131314,stroke:#FFB3AE,color:#E5E2E3
```

### Donation Flow

```mermaid
sequenceDiagram
    participant D as Donor
    participant SC as Smart Contract
    participant T as Treasury
    participant FE as Frontend (15s poll)

    D->>SC: donate(campaignId) {value: X ETH}
    SC->>T: Forward ETH to treasury
    SC-->>SC: Emit DonationReceived event
    SC-->>SC: Check milestones (if goal set)
    alt Milestone reached
        SC-->>SC: Emit MilestoneReached event
    end
    FE-->>FE: Poll detects new donation
    FE-->>D: Toast notification
```

### Expense Recording Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant IPFS as IPFS Storage
    participant SC as Smart Contract
    participant DB as Database

    A->>IPFS: Upload proof document (PDF/JPG)
    IPFS-->>A: Return CID (content hash)
    A->>SC: recordExpense(campaignId, amount, category, CID, note)
    SC-->>SC: Validate auth & inputs
    SC-->>SC: Emit ExpenseRecorded event
    A->>DB: Save file metadata (CID, filename, size)
```

### Milestone Auto-Detection

```mermaid
flowchart TD
    A[Donation Received] --> B{Campaign goal set?}
    B -->|No| C[Skip milestone check]
    B -->|Yes| D[Calculate: currentAmount / goalWei × 100]
    D --> E{For each milestone}
    E --> F{percentage >= target<br/>AND reachedAt == 0?}
    F -->|Yes| G[Set reachedAt = now<br/>Emit MilestoneReached]
    F -->|No| H[Skip]
    G --> E
    H --> E

    style A fill:#FF5555,color:#fff
    style G fill:#AED18D,color:#000
```

### Service Architecture

```mermaid
graph TB
    subgraph Docker["Docker Compose"]
        IPFS["IPFS Kubo<br/>:5001 (API) · :8080 (Gateway)"]
        PG["PostgreSQL 16<br/>:5432"]
    end

    subgraph NextJS["Next.js 14 (:3939)"]
        Pages["10 Pages<br/>(App Router)"]
        API["API Routes<br/>/api/campaigns<br/>/api/ipfs/*<br/>/api/og · /api/health"]
        Prisma["Prisma ORM<br/>SQLite / PostgreSQL"]
        Wagmi["wagmi + viem<br/>MetaMask · WalletConnect<br/>Coinbase Wallet"]
    end

    subgraph Hardhat["Hardhat Node (:8545)"]
        Contract["CampaignLedger.sol<br/>createCampaign · donate<br/>recordExpense · setMilestone"]
    end

    IPFS --> API
    PG --> Prisma
    Wagmi --> Contract
    Pages --> API
    API --> Prisma

    style Docker fill:#1C1B1C,stroke:#AA8986,color:#E5E2E3
    style NextJS fill:#131314,stroke:#FFB3AE,color:#E5E2E3
    style Hardhat fill:#1C1B1C,stroke:#FF5555,color:#E5E2E3
```

### Transparency Report Pipeline

```mermaid
flowchart TD
    A[Campaign Data Request] --> B[Fetch on-chain data<br/>Donations · Expenses · Campaign info]
    B --> C[Anomaly Detection]
    C --> D{Issues found?}
    D -->|Missing IPFS proofs| E["⚠️ Flag anomaly"]
    D -->|High expense ratio >50%| E
    D -->|All clear| F["✅ No anomalies"]
    E --> G[Generate Report]
    F --> G
    G --> H[Summary Cards<br/>Raised · Spent · Balance · Utilization %]
    G --> I[Charts<br/>Donut · Bar · Category breakdown]
    G --> J[Ledger Tables<br/>Expenses · Donations]
    G --> K[Confidence Score<br/>0-100%]
    H --> L[Export: CSV · Print · Share]
    I --> L
    J --> L
    K --> L

    style A fill:#FF5555,color:#fff
    style F fill:#AED18D,color:#000
    style E fill:#FFB4AB,color:#000
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
