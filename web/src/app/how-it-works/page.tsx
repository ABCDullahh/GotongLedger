"use client";

import Link from "next/link";
import {
  Database,
  FileCheck,
  Globe,
  Shield,
  Eye,
  Link2,
  CheckCircle2,
  HardDrive,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CAMPAIGN_LEDGER_ADDRESS, CHAIN_ID } from "@/lib/blockchain";
import { toast } from "sonner";

const architectureLayers = [
  {
    id: "onchain",
    title: "ON-CHAIN",
    subtitle: "Layer 1 Execution",
    icon: Database,
    color: "#FFB3AE",
    description: "Immutable source of truth for all financial transactions",
    items: [
      "Campaign Creation Events",
      "Donation Transactions",
      "Expense Records with CID",
      "Timestamps & Block Numbers",
      "Transaction Hashes",
    ],
  },
  {
    id: "ipfs",
    title: "IPFS",
    subtitle: "Decentralized Storage",
    icon: Globe,
    color: "#AED18D",
    description: "Content-addressed storage for expense proof documents",
    items: [
      "Expense Receipts (PDF/JPG)",
      "Content-Addressed (CID)",
      "Immutable File Integrity",
    ],
  },
  {
    id: "offchain",
    title: "OFF-CHAIN",
    subtitle: "Identity & Analytics",
    icon: HardDrive,
    color: "#E3BEBB",
    description: "Local metadata cache for UX enrichment (NOT source of truth)",
    items: [
      "Campaign Titles & Descriptions",
      "File Metadata & Labels",
      "UI State & Preferences",
    ],
  },
];

const trustFeatures = [
  {
    icon: Eye,
    title: "Full Transparency",
    description:
      "Every donation and expense is publicly visible on the blockchain. Anyone can audit the entire financial history.",
  },
  {
    icon: Shield,
    title: "Immutable Records",
    description:
      "Once recorded on-chain, transactions cannot be altered or deleted. This ensures permanent accountability.",
  },
  {
    icon: FileCheck,
    title: "Proof Documents",
    description:
      "All expenses require proof documents stored on IPFS. The CID (content hash) is recorded on-chain.",
  },
  {
    icon: Link2,
    title: "Verifiable Links",
    description:
      "Every transaction links to its proof. Users can independently verify that proofs match recorded CIDs.",
  },
];

const lifecycleSteps = [
  {
    number: "01",
    title: "CONTRIBUTION",
    description: "Donor sends ETH to a campaign smart contract. Transaction is recorded immutably on-chain.",
  },
  {
    number: "02",
    title: "VALIDATION",
    description: "Smart contract validates the campaign exists, is active, and emits a DonationReceived event.",
  },
  {
    number: "03",
    title: "DISBURSEMENT",
    description: "Funds are forwarded to the campaign treasury. Admin records expenses with IPFS proof.",
  },
  {
    number: "04",
    title: "EVIDENCE",
    description: "Expense proof CID is committed on-chain. Anyone can verify proof matches the record.",
  },
];

const coreFunctions = [
  { name: "CONTRIBUTE()", access: "Public", desc: "Donate ETH to campaign" },
  { name: "REQUESTEXPENSE()", access: "Admin", desc: "Record expense with proof" },
  { name: "CREATECAMPAIGN()", access: "Admin", desc: "Deploy new campaign" },
  { name: "SETCAMPAIGNACTIVE()", access: "Owner", desc: "Toggle campaign status" },
];

export default function HowItWorksPage() {
  const [copiedAddress, setCopiedAddress] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(CAMPAIGN_LEDGER_ADDRESS);
    setCopiedAddress(true);
    toast.success("Contract address copied!");
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#131314]">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "How It Works" }]} />

        <div className="mt-6 max-w-3xl">
          {/* Badge */}
          <div className="ghost-border mb-6 inline-flex items-center gap-2 rounded-sm bg-[#2A2A2B] px-4 py-2">
            <Shield className="h-3.5 w-3.5 text-[#FFB3AE]" />
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#E3BEBB]">
              Transparency by Design
            </span>
          </div>

          <h1 className="font-headline text-5xl font-black uppercase tracking-tighter text-[#E5E2E3] md:text-7xl">
            THE ARCHITECTURE<br />
            <span className="text-[#FFB3AE]">OF TRUST</span>
          </h1>
          <p className="mt-4 max-w-xl font-body text-lg text-[#E3BEBB]">
            Understanding our three-layer architecture and trust model. Every
            donation is traceable, every expense is verifiable.
          </p>
        </div>
      </section>

      {/* 3-Column Architecture Cards */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="font-headline text-2xl font-bold uppercase tracking-tight text-[#E5E2E3]">
            Three-Layer Architecture
          </h2>
          <p className="mt-2 font-body text-sm text-[#E3BEBB]">
            Blockchain immutability, decentralized storage, and local metadata for the best balance of security, cost, and UX.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {architectureLayers.map((layer) => (
            <div
              key={layer.id}
              className="ghost-border rounded-sm bg-[#1C1B1C] p-8"
            >
              <layer.icon
                className="mb-4 h-6 w-6"
                style={{ color: layer.color }}
              />
              <h3 className="font-headline text-lg font-bold text-[#E5E2E3]">
                {layer.title}
              </h3>
              <p
                className="mb-4 font-label text-[10px] uppercase tracking-[0.2em]"
                style={{ color: layer.color }}
              >
                {layer.subtitle}
              </p>
              <p className="mb-5 font-body text-sm text-[#E3BEBB]">
                {layer.description}
              </p>
              <ul className="space-y-2">
                {layer.items.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 font-body text-sm text-[#AA8986]"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      style={{ color: layer.color }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Framework */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <h2 className="mb-2 font-headline text-2xl font-bold uppercase tracking-tight text-[#E5E2E3]">
          Trust Framework
        </h2>
        <p className="mb-8 font-body text-sm text-[#E3BEBB]">
          Our system is designed so you don&apos;t have to trust us. Everything that matters is independently verifiable.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustFeatures.map((feature, index) => (
            <div
              key={index}
              className="ghost-border rounded-sm bg-[#1C1B1C] p-6"
            >
              <feature.icon className="mb-4 h-5 w-5 text-[#FFB3AE]" />
              <h3 className="mb-2 font-headline text-sm font-bold text-[#E5E2E3]">
                {feature.title}
              </h3>
              <p className="font-body text-xs leading-relaxed text-[#AA8986]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Lifecycle of a Donation */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="font-headline text-2xl font-bold uppercase italic tracking-tight text-[#E5E2E3]">
            Lifecycle of a Donation
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {lifecycleSteps.map((step, index) => (
            <div key={step.number} className="relative flex items-start gap-4">
              <div className="flex flex-col items-center">
                {/* Number box */}
                <div className="ghost-border flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-[#0E0E0F]">
                  <span className="font-headline text-xl font-extrabold text-[#FFB3AE]">
                    {step.number}
                  </span>
                </div>
              </div>

              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-[#E5E2E3]">
                    {step.title}
                  </h3>
                  {index < lifecycleSteps.length - 1 && (
                    <ArrowRight className="hidden h-3.5 w-3.5 text-[#5A403E] lg:block" />
                  )}
                </div>
                <p className="mt-1 font-body text-xs leading-relaxed text-[#AA8986]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contract Audit Log */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <h2 className="mb-8 font-headline text-2xl font-bold uppercase tracking-tight text-[#E5E2E3]">
          Contract Audit Log
        </h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left: Protocol Info */}
          <div className="ghost-border rounded-sm bg-[#1C1B1C] p-6 md:p-8">
            <div className="space-y-5">
              {/* Protocol Version */}
              <div>
                <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                  Protocol Version
                </span>
                <p className="mt-1 font-headline text-lg font-bold text-[#E5E2E3]">
                  CampaignLedger v1.0
                </p>
              </div>

              {/* Contract Address */}
              <div>
                <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                  Contract Address
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <code className="break-all font-label text-sm text-[#FFB3AE]">
                    {CAMPAIGN_LEDGER_ADDRESS}
                  </code>
                  <button
                    onClick={copyAddress}
                    className="shrink-0 rounded-sm p-1.5 transition-colors hover:bg-[#2A2A2B]"
                    aria-label={copiedAddress ? "Address copied" : "Copy contract address"}
                  >
                    {copiedAddress ? (
                      <Check className="h-3.5 w-3.5 text-[#AED18D]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-[#AA8986]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Network Status */}
              <div>
                <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                  Network
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#AED18D]" />
                  <span className="font-body text-sm text-[#E5E2E3]">
                    Hardhat Localhost (Chain ID: {CHAIN_ID})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Core Functions */}
          <div className="ghost-border rounded-sm bg-[#1C1B1C] p-6 md:p-8">
            <h3 className="mb-4 font-headline text-sm font-bold uppercase tracking-widest text-[#E5E2E3]">
              Core Functions
            </h3>
            <div className="space-y-3">
              {coreFunctions.map((fn) => (
                <div
                  key={fn.name}
                  className="flex items-center justify-between rounded-sm bg-[#0E0E0F] px-4 py-3"
                >
                  <div>
                    <code className="font-label text-sm text-[#FFB3AE]">
                      {fn.name}
                    </code>
                    <p className="mt-0.5 font-body text-xs text-[#AA8986]">
                      {fn.desc}
                    </p>
                  </div>
                  <span
                    className={`ghost-border rounded-sm px-2.5 py-1 font-label text-[10px] uppercase tracking-[0.2em] ${
                      fn.access === "Public"
                        ? "text-[#AED18D]"
                        : fn.access === "Admin"
                        ? "text-[#FFB3AE]"
                        : "text-[#E3BEBB]"
                    }`}
                  >
                    {fn.access}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[hsl(3_24%_30%/0.15)] bg-[#0E0E0F]">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="font-headline text-3xl font-extrabold uppercase tracking-tighter text-[#E5E2E3] md:text-4xl">
            READY TO EXPLORE?
          </h2>
          <p className="mx-auto mt-3 max-w-lg font-body text-sm text-[#E3BEBB]">
            Browse active campaigns, check system health, or create your own transparent fundraising campaign.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-sm bg-[#FF5555] px-6 py-3 font-headline text-sm font-bold uppercase tracking-widest text-[#131314] transition-colors hover:bg-[#FFB3AE]"
            >
              View Campaigns
              <ExternalLink className="h-4 w-4" />
            </Link>
            <Link
              href="/health"
              className="ghost-border inline-flex items-center gap-2 rounded-sm px-6 py-3 font-headline text-sm font-bold uppercase tracking-widest text-[#E5E2E3] transition-colors hover:bg-[#3A393A]"
            >
              Check System Health
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
