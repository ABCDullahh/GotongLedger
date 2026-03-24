# GotongLedger — Feature Addition + Audit + Deployment Spec

## Overview
Enhance GotongLedger from a local dev portfolio project to a production-ready, feature-rich Web3 donation transparency platform deployed on Sepolia testnet + GCP.

## Phase 1: Foundation & Infrastructure

### 1.1 Multi-Wallet Support
- Add WalletConnect v2 + Coinbase Wallet connectors via wagmi
- Update `web/src/lib/wagmi.ts` with new connectors
- Update navbar to show wallet selection modal
- Requires: WalletConnect Project ID (env var)

### 1.2 Campaign Categories & Tags
- Add `category` field to `CampaignMetadata` Prisma model
- Predefined categories: Education, Health, Disaster Relief, Environment, Community, Infrastructure, Other
- Update admin form to include category selection
- Add category filter/chips on homepage
- Update `/api/campaigns` to accept/return category

### 1.3 SQLite → PostgreSQL Migration
- Update Prisma datasource to `postgresql`
- Add PostgreSQL to docker-compose.yml
- Migration script for existing data
- Update `.env` with DATABASE_URL

### 1.4 Codebase Audit
- Security: input validation, XSS, injection
- Error handling: graceful failures, user-facing messages
- Performance: bundle size, re-renders, lazy loading
- TypeScript: strict mode compliance
- Unused code cleanup
- Fix all lint warnings

## Phase 2: Smart Contract Upgrade

### 2.1 Campaign Milestones
- Add `setMilestone(campaignId, percentage, description)` to contract
- Emit `MilestoneReached` event
- Frontend: milestone progress indicator on campaign detail
- Auto-detect milestone crossing on donation

### 2.2 Expense Proof Verification
- IPFS pin status check via gateway/API
- Verify CID integrity (content matches hash)
- Visual indicator: verified/unverified/missing proof
- Batch verification on report page

## Phase 3: Feature Layer

### 3.1 Real-Time Donation Notifications
- Poll blockchain every 10s for new donation events
- Toast notification with donor address + amount
- Optional sound effect
- Campaign detail: live-updating donation list

### 3.2 Donor Leaderboard
- Top 10 donors per campaign + global
- ENS name resolution (mainnet lookup)
- Ranked display with position, address/ENS, total donated
- Timeframe filter: all-time, 30d, 7d

### 3.3 Analytics Dashboard
- New `/analytics` page
- Charts: donation volume over time, campaign growth
- Top campaigns by raised amount
- Expense category breakdown (aggregated)
- Key metrics: total raised, total campaigns, avg donation

### 3.4 Export & Sharing
- PDF report generation (campaign transparency report)
- Social media share cards (OG image generation)
- Embeddable donation widget (iframe snippet)
- CSV export (already exists, enhance)

## Phase 4: Deployment & Production

### 4.1 Sepolia Testnet Deployment
- Update Hardhat config for Sepolia network
- Deploy CampaignLedger to Sepolia
- Update frontend contract address + chain config
- Faucet ETH for testing

### 4.2 IPFS Migration
- Pinata SDK integration (replace local Kubo)
- Upload endpoint update
- Gateway URL update
- Pin management

### 4.3 GCP Cloud Run Deployment
- Dockerfile for Next.js production build
- Cloud Run service configuration
- Cloud SQL PostgreSQL instance
- Environment variables / Secret Manager
- Custom domain (optional)

### 4.4 Final Polish
- Update all 300+ E2E tests for new features
- Performance audit (Lighthouse)
- Accessibility review
- README update with deployment instructions
- Demo data seeding script
