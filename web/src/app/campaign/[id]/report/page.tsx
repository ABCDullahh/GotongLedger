"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  RefreshCw,
  Printer,
  Share2,
  Check,
  ExternalLink,
  ArrowLeft,
  Wallet,
  ShieldCheck,
  ShieldAlert,
  ScanSearch,
} from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProofBadge } from "@/components/proof-badge";
import {
  getDonationLogs,
  getExpenseLogs,
  getCampaignCreatedLogs,
  type DonationReceivedEvent,
  type ExpenseRecordedEvent,
  type CampaignCreatedEvent,
} from "@/lib/blockchain";
import { formatAddress, formatEther, formatTimestamp } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";

interface PageProps {
  params: { id: string };
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

interface Anomaly {
  type: "missing_proof" | "high_expense" | "suspicious_timing";
  description: string;
  severity: "low" | "medium" | "high";
  expense?: ExpenseRecordedEvent;
}

const CHART_COLORS = [
  "#FFB3AE",
  "#AED18D",
  "#FF5555",
  "#AA8986",
  "#E3BEBB",
  "#8884d8",
  "#ffc658",
  "#82ca9d",
];

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container-high border border-outline-variant/20 rounded-sm px-4 py-3 font-label text-xs">
        {label && <p className="text-on-surface-variant mb-1">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-on-surface font-medium">
            {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(4) : entry.value} ETH
          </p>
        ))}
      </div>
    );
  }
  return null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function CampaignReportPage({ params }: PageProps) {
  const { id } = params;
  const campaignId = BigInt(id);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [campaign, setCampaign] = useState<CampaignCreatedEvent | null>(null);
  const [metadata, setMetadata] = useState<{ title: string; description: string } | null>(null);
  const [donations, setDonations] = useState<DonationReceivedEvent[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecordedEvent[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchData = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);

      const [campaignLogs, donationLogs, expenseLogs] = await Promise.all([
        getCampaignCreatedLogs(),
        getDonationLogs(campaignId),
        getExpenseLogs(campaignId),
      ]);

      const campaignData = campaignLogs.find((c) => c.campaignId === campaignId);
      setCampaign(campaignData || null);
      setDonations(donationLogs.sort((a, b) => Number(b.timestamp - a.timestamp)));
      setExpenses(expenseLogs.sort((a, b) => Number(b.timestamp - a.timestamp)));

      // Fetch metadata
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      if (data.success) {
        const meta = data.campaigns.find(
          (c: { campaignId: number }) => c.campaignId === Number(campaignId)
        );
        setMetadata(meta || null);
      }

      // Calculate category breakdown
      const categoryMap = new Map<string, { amount: bigint; count: number }>();
      expenseLogs.forEach((e) => {
        const existing = categoryMap.get(e.category) || { amount: 0n, count: 0 };
        categoryMap.set(e.category, {
          amount: existing.amount + e.amountWei,
          count: existing.count + 1,
        });
      });

      const totalExpensesWei = expenseLogs.reduce((sum, e) => sum + e.amountWei, 0n);
      const breakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
        .map(([category, { amount, count }]) => ({
          category,
          amount: Number(amount) / 1e18,
          count,
          percentage: totalExpensesWei > 0n ? (Number(amount) / Number(totalExpensesWei)) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      setCategoryBreakdown(breakdown);

      // Detect anomalies
      const detectedAnomalies: Anomaly[] = [];

      // Check for expenses without proof (empty CID)
      expenseLogs.forEach((e) => {
        if (!e.cid || e.cid.trim() === "") {
          detectedAnomalies.push({
            type: "missing_proof",
            description: `Expense of ${formatEther(e.amountWei)} ETH in ${e.category} has no proof document`,
            severity: "high",
            expense: e,
          });
        }
      });

      // Check for unusually high expenses (> 50% of total donations in single expense)
      const totalDonationsWei = donationLogs.reduce((sum, d) => sum + d.amountWei, 0n);
      expenseLogs.forEach((e) => {
        if (totalDonationsWei > 0n && Number(e.amountWei) > Number(totalDonationsWei) * 0.5) {
          detectedAnomalies.push({
            type: "high_expense",
            description: `Single expense of ${formatEther(e.amountWei)} ETH is over 50% of total donations`,
            severity: "medium",
            expense: e,
          });
        }
      });

      setAnomalies(detectedAnomalies);

      if (showToast) toast.success("Report data refreshed");
    } catch (error) {
      console.error("Failed to fetch data:", error);
      if (showToast) toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const handleExport = (type: "all" | "donations" | "expenses") => {
    const url = `/api/campaigns/${id}/export?type=${type}`;
    window.open(url, "_blank");
    toast.success(`Downloading ${type === "all" ? "full report" : type}...`);
  };

  const handlePrint = () => {
    window.print();
  };

  const copyReportLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success("Report link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const totalDonations = donations.reduce((sum, d) => sum + d.amountWei, 0n);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amountWei, 0n);
  const balance = totalDonations - totalExpenses;
  const utilization = totalDonations > 0n ? (Number(totalExpenses) / Number(totalDonations)) * 100 : 0;

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Skeleton breadcrumbs */}
          <div className="flex items-center gap-2 mb-10">
            <div className="h-3 w-12 bg-surface-container-low rounded-sm animate-pulse" />
            <div className="h-3 w-3 bg-surface-container-low rounded-sm animate-pulse" />
            <div className="h-3 w-20 bg-surface-container-low rounded-sm animate-pulse" />
            <div className="h-3 w-3 bg-surface-container-low rounded-sm animate-pulse" />
            <div className="h-3 w-28 bg-surface-container-low rounded-sm animate-pulse" />
          </div>
          {/* Skeleton title */}
          <div className="h-12 w-80 bg-surface-container-low rounded-sm animate-pulse mb-4" />
          <div className="h-5 w-64 bg-surface-container-low rounded-sm animate-pulse mb-10" />
          {/* Skeleton summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 bg-surface-container-low rounded-sm ghost-border animate-pulse" />
            ))}
          </div>
          {/* Skeleton charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-surface-container-low rounded-sm ghost-border animate-pulse" />
            <div className="h-80 bg-surface-container-low rounded-sm ghost-border animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ── Not Found ──
  if (!campaign) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="bg-surface-container-low ghost-border rounded-sm p-12 text-center max-w-md">
          <div className="w-16 h-16 rounded-sm bg-surface-container-high flex items-center justify-center mx-auto mb-6">
            <FileText className="h-8 w-8 text-outline" />
          </div>
          <h2 className="font-headline text-2xl font-bold text-on-surface mb-3">
            Campaign Not Found
          </h2>
          <p className="text-outline text-sm font-body mb-8">
            This campaign does not exist or has not been created yet.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-5 py-2.5 rounded-sm font-label text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const campaignTitle = metadata?.title || `Campaign #${id}`;
  const hasAnomalies = anomalies.length > 0;

  return (
    <div className="min-h-screen bg-surface print:bg-white">
      {/* ═══════════════════════════════════════════════════════════════
          1. HEADER
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative bg-surface-container-lowest py-8 print:hidden">
        {/* Subtle top-left radial glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.04]"
            style={{ background: "radial-gradient(circle, #FF5555, transparent 70%)" }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Campaigns", href: "/" },
              { label: campaignTitle, href: `/campaign/${id}` },
              { label: "Audit Report" },
            ]}
          />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
              {/* Title block */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {hasAnomalies ? (
                    <span className="inline-flex items-center gap-1.5 bg-error-container text-error px-3 py-1 rounded-sm font-label text-[10px] uppercase tracking-widest">
                      <ShieldAlert className="h-3 w-3" />
                      {anomalies.length} Anomal{anomalies.length === 1 ? "y" : "ies"} Detected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-secondary-container text-secondary px-3 py-1 rounded-sm font-label text-[10px] uppercase tracking-widest">
                      <ShieldCheck className="h-3 w-3" />
                      Clean Ledger
                    </span>
                  )}
                </div>
                <h1 className="font-headline text-4xl md:text-6xl font-extrabold uppercase tracking-tighter text-on-surface leading-[0.9]">
                  Campaign<br />Audit
                </h1>
                <p className="mt-3 text-outline font-body text-sm max-w-md">
                  Complete on-chain audit trail and financial transparency report for{" "}
                  <span className="text-on-surface-variant">{campaignTitle}</span>
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => fetchData(true)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 ghost-border px-4 py-2.5 rounded-sm font-label text-[10px] uppercase tracking-widest text-outline hover:text-on-surface hover:border-primary/40 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 ghost-border px-4 py-2.5 rounded-sm font-label text-[10px] uppercase tracking-widest text-outline hover:text-on-surface hover:border-primary/40 transition-all"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </button>
                <button
                  onClick={() => handleExport("all")}
                  className="inline-flex items-center gap-2 ghost-border px-4 py-2.5 rounded-sm font-label text-[10px] uppercase tracking-widest text-outline hover:text-on-surface hover:border-primary/40 transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
                <button
                  onClick={copyReportLink}
                  className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-5 py-2.5 rounded-sm font-label text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  {copiedLink ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Share2 className="h-3.5 w-3.5" />
                  )}
                  Share Report
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Print Header */}
      <div className="hidden print:block p-8 border-b">
        <h1 className="text-3xl font-bold">{campaignTitle}</h1>
        <p className="text-gray-600">Transparency Audit Report</p>
        <p className="text-sm text-gray-500 mt-2">
          Generated: {new Date().toLocaleString()}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back link */}
        <Link
          href={`/campaign/${id}`}
          className="inline-flex items-center gap-2 font-label text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors mb-8 print:hidden"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Campaign
        </Link>

        {/* ═══════════════════════════════════════════════════════════════
            2. ANOMALY DETECTION ALERT
        ═══════════════════════════════════════════════════════════════ */}
        {hasAnomalies && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 print:border-red-500"
          >
            <div className="bg-error-container/20 border border-error/30 rounded-sm p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-sm bg-error-container/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="h-5 w-5 text-error" />
                  </div>
                  <div>
                    <h3 className="font-headline text-lg font-bold text-error mb-1">
                      {anomalies.length} Anomal{anomalies.length === 1 ? "y" : "ies"} Detected
                    </h3>
                    <ul className="space-y-1.5 mt-3">
                      {anomalies.map((anomaly, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm font-body text-on-surface-variant">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-sm font-label text-[9px] uppercase tracking-widest flex-shrink-0 mt-0.5 ${
                              anomaly.severity === "high"
                                ? "bg-error-container text-error"
                                : anomaly.severity === "medium"
                                ? "bg-surface-container-high text-primary"
                                : "bg-surface-container-high text-outline"
                            }`}
                          >
                            {anomaly.severity}
                          </span>
                          {anomaly.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => fetchData(true)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 border border-error/40 text-error px-4 py-2.5 rounded-sm font-label text-[10px] uppercase tracking-widest hover:bg-error-container/30 transition-colors flex-shrink-0 disabled:opacity-50"
                >
                  <ScanSearch className="h-3.5 w-3.5" />
                  Re-Scan Ledger
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {!hasAnomalies && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="bg-secondary-container/10 border border-secondary/20 rounded-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-sm bg-secondary-container/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-headline text-base font-bold text-secondary">
                    All Clear
                  </h3>
                  <p className="text-sm font-body text-outline mt-0.5">
                    No anomalies detected. All expenses have valid proof documents anchored on-chain.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            3. SUMMARY CARDS
        ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {/* Total Raised */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="bg-surface-container-low rounded-sm ghost-border p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <span className="font-label text-[10px] uppercase tracking-widest text-outline">
                  Total Raised
                </span>
                <TrendingUp className="h-4 w-4 text-secondary" />
              </div>
              <p className="font-headline text-3xl font-bold text-secondary tracking-tight">
                {formatEther(totalDonations)}
              </p>
              <span className="font-label text-xs text-outline mt-1 block">
                ETH &middot; {donations.length} donation{donations.length !== 1 ? "s" : ""}
              </span>
            </div>
          </motion.div>

          {/* Total Spent */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-surface-container-low rounded-sm ghost-border p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <span className="font-label text-[10px] uppercase tracking-widest text-outline">
                  Total Spent
                </span>
                <TrendingDown className="h-4 w-4 text-primary" />
              </div>
              <p className="font-headline text-3xl font-bold text-primary tracking-tight">
                {formatEther(totalExpenses)}
              </p>
              <span className="font-label text-xs text-outline mt-1 block">
                ETH &middot; {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
              </span>
            </div>
          </motion.div>

          {/* Net Balance */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="bg-surface-container-low rounded-sm ghost-border p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <span className="font-label text-[10px] uppercase tracking-widest text-outline">
                  Net Balance
                </span>
                <Wallet className="h-4 w-4 text-outline" />
              </div>
              <p className={`font-headline text-3xl font-bold tracking-tight ${
                balance >= 0n ? "text-secondary" : "text-error"
              }`}>
                {formatEther(balance)}
              </p>
              <span className="font-label text-xs text-outline mt-1 block">
                ETH &middot; Remaining funds
              </span>
            </div>
          </motion.div>

          {/* Utilization % */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-surface-container-low rounded-sm ghost-border p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <span className="font-label text-[10px] uppercase tracking-widest text-outline">
                  Utilization
                </span>
              </div>
              <p className="font-headline text-3xl font-bold text-on-surface tracking-tight">
                {utilization.toFixed(1)}%
              </p>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 w-full bg-surface-container-high rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-500"
                  style={{
                    width: `${Math.min(utilization, 100)}%`,
                    background: utilization > 90
                      ? "#FFB4AB"
                      : utilization > 60
                      ? "#FFB3AE"
                      : "#AED18D",
                  }}
                />
              </div>
              <span className="font-label text-xs text-outline mt-2 block">
                Fund deployment rate
              </span>
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            CAMPAIGN INFO (compact)
        ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-10"
        >
          <div className="bg-surface-container-low rounded-sm ghost-border p-6">
            <span className="font-label text-[10px] uppercase tracking-widest text-outline block mb-4">
              Campaign Metadata
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <span className="font-label text-[10px] uppercase tracking-widest text-outline flex items-center gap-1.5">
                  <User className="h-3 w-3" /> Owner
                </span>
                <code className="text-xs font-label text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-sm block">
                  {formatAddress(campaign.owner)}
                </code>
              </div>
              <div className="space-y-1">
                <span className="font-label text-[10px] uppercase tracking-widest text-outline flex items-center gap-1.5">
                  <Wallet className="h-3 w-3" /> Treasury
                </span>
                <code className="text-xs font-label text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-sm block">
                  {formatAddress(campaign.treasury)}
                </code>
              </div>
              <div className="space-y-1">
                <span className="font-label text-[10px] uppercase tracking-widest text-outline flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Created
                </span>
                <p className="text-sm font-body text-on-surface">
                  {formatTimestamp(Number(campaign.createdAt))}
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-label text-[10px] uppercase tracking-widest text-outline flex items-center gap-1.5">
                  <FileText className="h-3 w-3" /> Campaign ID
                </span>
                <code className="text-xs font-label text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-sm block">
                  #{id}
                </code>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            4. CHARTS ROW
        ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Expense Breakdown Donut */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-surface-container-low rounded-sm ghost-border p-6 h-full">
              <span className="font-label text-[10px] uppercase tracking-widest text-outline block mb-1">
                Expense Breakdown
              </span>
              <p className="text-sm font-body text-outline mb-6">
                Distribution of expenses across categories
              </p>
              {categoryBreakdown.length === 0 ? (
                <div className="py-16 text-center text-outline font-label text-xs uppercase tracking-widest">
                  No expenses recorded yet
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        strokeWidth={2}
                        stroke="#131314"
                        label={({ category, percentage }) =>
                          `${category} (${percentage.toFixed(1)}%)`
                        }
                        labelLine={false}
                      >
                        {categoryBreakdown.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{
                          fontFamily: "'Space Grotesk', monospace",
                          fontSize: "11px",
                          color: "#AA8986",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.div>

          {/* Category Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <div className="bg-surface-container-low rounded-sm ghost-border p-6 h-full">
              <span className="font-label text-[10px] uppercase tracking-widest text-outline block mb-1">
                Spending Velocity
              </span>
              <p className="text-sm font-body text-outline mb-6">
                Comparison of spending amounts by category
              </p>
              {categoryBreakdown.length === 0 ? (
                <div className="py-16 text-center text-outline font-label text-xs uppercase tracking-widest">
                  No expenses recorded yet
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryBreakdown} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#2A2A2B"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: "#AA8986", fontFamily: "'Space Grotesk', monospace", fontSize: 10 }}
                        axisLine={{ stroke: "#2A2A2B" }}
                        tickLine={{ stroke: "#2A2A2B" }}
                      />
                      <YAxis
                        dataKey="category"
                        type="category"
                        width={80}
                        tick={{ fill: "#AA8986", fontFamily: "'Space Grotesk', monospace", fontSize: 10 }}
                        axisLine={{ stroke: "#2A2A2B" }}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="amount"
                        name="Amount"
                        fill="#FFB3AE"
                        radius={[0, 2, 2, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            5. CATEGORY SUMMARY TABLE
        ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-10"
        >
          <div className="bg-surface-container-low rounded-sm ghost-border overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
              <div>
                <span className="font-label text-[10px] uppercase tracking-widest text-outline block mb-1">
                  Category Summary
                </span>
                <p className="text-sm font-body text-outline">
                  Breakdown of expenses by category
                </p>
              </div>
              <button
                onClick={() => handleExport("expenses")}
                className="inline-flex items-center gap-2 ghost-border px-3 py-2 rounded-sm font-label text-[10px] uppercase tracking-widest text-outline hover:text-on-surface hover:border-primary/40 transition-all print:hidden"
              >
                <Download className="h-3 w-3" />
                Export
              </button>
            </div>

            {categoryBreakdown.length === 0 ? (
              <div className="py-16 text-center text-outline font-label text-xs uppercase tracking-widest">
                No expenses recorded yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant/10">
                      <th className="text-left px-6 py-3 font-label text-[10px] uppercase tracking-widest text-outline font-normal">
                        Category
                      </th>
                      <th className="text-right px-6 py-3 font-label text-[10px] uppercase tracking-widest text-outline font-normal">
                        Amount (ETH)
                      </th>
                      <th className="text-right px-6 py-3 font-label text-[10px] uppercase tracking-widest text-outline font-normal">
                        Count
                      </th>
                      <th className="text-right px-6 py-3 font-label text-[10px] uppercase tracking-widest text-outline font-normal w-48">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryBreakdown.map((cat, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-outline-variant/5 transition-colors hover:bg-surface-container-high/30 ${
                          idx % 2 === 0 ? "bg-surface-container-low/40" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                              style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                            />
                            <span className="text-sm font-body text-on-surface">{cat.category}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-label text-sm text-on-surface">
                          {cat.amount.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-body text-outline">
                          {cat.count}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="w-24 h-1.5 bg-surface-container-high rounded-sm overflow-hidden">
                              <div
                                className="h-full rounded-sm"
                                style={{
                                  width: `${cat.percentage}%`,
                                  backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                                }}
                              />
                            </div>
                            <span className="font-label text-xs text-outline w-12 text-right">
                              {cat.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-surface-container-high/20 border-t border-outline-variant/15">
                      <td className="px-6 py-4 font-headline font-bold text-sm text-on-surface">
                        Total
                      </td>
                      <td className="px-6 py-4 text-right font-label text-sm font-bold text-on-surface">
                        {formatEther(totalExpenses)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-body font-bold text-on-surface">
                        {expenses.length}
                      </td>
                      <td className="px-6 py-4 text-right font-label text-xs font-bold text-on-surface">
                        100%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            6. DETAILED LEDGER - EXPENSE TRANSACTIONS
        ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mb-10"
        >
          <div className="bg-surface-container-low rounded-sm ghost-border overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
              <div>
                <span className="font-label text-[10px] uppercase tracking-widest text-outline block mb-1">
                  Expense Ledger
                </span>
                <p className="text-sm font-body text-outline">
                  All recorded expenses with proof documents
                </p>
              </div>
            </div>

            {expenses.length === 0 ? (
              <div className="py-16 text-center text-outline font-label text-xs uppercase tracking-widest">
                No expenses recorded yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant/10">
                      <th className="text-left px-6 py-3 font-label text-[10px] uppercase tracking-widest text-outline font-normal">
                        Date
                      </th>
                      <th className="text-left px-6 py-3 font-label text-[10px] uppercase tracking-widest text-outline font-normal">
                        Category
                      </th>
                      <th className="text-left px-6 py-3 font-label text-[10px] uppercase tracking-widest text-outline font-normal">
                        Note
                      </th>
                      <th className="text-right px-6 py-3 font-label text-[10px] uppercase tracking-widest text-outline font-normal">
                        Amount
                      </th>
                      <th className="text-center px-6 py-3 font-label text-[10px] uppercase tracking-widest text-outline font-normal">
                        Proof
                      </th>
                      <th className="text-center px-6 py-3 font-label text-[10px] uppercase tracking-widest text-outline font-normal">
                        Tx
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e, idx) => {
                      const hasProof = e.cid && e.cid.trim() !== "";
                      return (
                        <tr
                          key={idx}
                          className={`border-b border-outline-variant/5 transition-colors hover:bg-surface-container-high/30 ${
                            idx % 2 === 0 ? "bg-surface-container-low/40" : ""
                          }`}
                        >
                          <td className="px-6 py-4 text-sm font-body text-outline whitespace-nowrap">
                            {formatTimestamp(Number(e.timestamp))}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 bg-surface-container-high rounded-sm font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                              {e.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-[180px] truncate text-sm font-body text-outline">
                            {e.note || "—"}
                          </td>
                          <td className="px-6 py-4 text-right font-label text-sm font-semibold text-on-surface whitespace-nowrap">
                            {formatEther(e.amountWei)} ETH
                          </td>
                          <td className="px-6 py-4 text-center">
                            {hasProof ? (
                              <a
                                href={`http://127.0.0.1:8080/ipfs/${e.cid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                              >
                                <ProofBadge cid={e.cid} />
                              </a>
                            ) : (
                              <ProofBadge cid="" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Link
                              href={`/explorer/tx/${e.transactionHash}`}
                              className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            DONATION LEDGER
        ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-10"
        >
          <div className="bg-surface-container-low rounded-sm ghost-border overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
              <div>
                <span className="font-label text-[10px] uppercase tracking-widest text-outline block mb-1">
                  Donation Ledger
                </span>
                <p className="text-sm font-body text-outline">
                  All donations received on-chain
                </p>
              </div>
              <button
                onClick={() => handleExport("donations")}
                className="inline-flex items-center gap-2 ghost-border px-3 py-2 rounded-sm font-label text-[10px] uppercase tracking-widest text-outline hover:text-on-surface hover:border-primary/40 transition-all print:hidden"
              >
                <Download className="h-3 w-3" />
                Export
              </button>
            </div>

            {donations.length === 0 ? (
              <div className="py-16 text-center text-outline font-label text-xs uppercase tracking-widest">
                No donations received yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant/10">
                      <th className="text-left px-6 py-3 font-label text-[10px] uppercase tracking-widest text-outline font-normal">
                        Date
                      </th>
                      <th className="text-left px-6 py-3 font-label text-[10px] uppercase tracking-widest text-outline font-normal">
                        Donor
                      </th>
                      <th className="text-right px-6 py-3 font-label text-[10px] uppercase tracking-widest text-outline font-normal">
                        Amount
                      </th>
                      <th className="text-center px-6 py-3 font-label text-[10px] uppercase tracking-widest text-outline font-normal">
                        Transaction
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((d, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-outline-variant/5 transition-colors hover:bg-surface-container-high/30 ${
                          idx % 2 === 0 ? "bg-surface-container-low/40" : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-body text-outline whitespace-nowrap">
                          {formatTimestamp(Number(d.timestamp))}
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs font-label text-on-surface-variant">
                            {formatAddress(d.from)}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-right font-label text-sm font-semibold text-secondary whitespace-nowrap">
                          {formatEther(d.amountWei)} ETH
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link
                            href={`/explorer/tx/${d.transactionHash}`}
                            className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors font-label text-xs"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">View</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            7. PROOF ANCHOR CONSENSUS BANNER
        ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <div className="bg-surface-container-lowest rounded-sm ghost-border p-8 md:p-12 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-[0.03]">
              <div
                className="w-full h-full"
                style={{ background: "radial-gradient(circle at top right, #AED18D, transparent 70%)" }}
              />
            </div>

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-xl">
                <span className="font-label text-[10px] uppercase tracking-widest text-outline block mb-3">
                  Proof Anchor Consensus
                </span>
                <h2 className="font-headline text-2xl md:text-3xl font-extrabold uppercase tracking-tighter text-on-surface leading-tight mb-3">
                  Cryptographically<br />Verified Ledger
                </h2>
                <p className="text-sm font-body text-outline leading-relaxed">
                  Every transaction in this report is anchored to the blockchain. Expense proofs are
                  pinned via IPFS content hashes, ensuring immutable verification. This report can
                  be independently audited by anyone with access to the contract address.
                </p>
              </div>

              <div className="flex-shrink-0 text-center">
                <div className="inline-flex flex-col items-center gap-2 bg-surface-container-low rounded-sm ghost-border p-6">
                  <span className="font-label text-[10px] uppercase tracking-widest text-outline">
                    Confidence Score
                  </span>
                  <span className={`font-headline text-4xl font-extrabold tracking-tighter ${
                    hasAnomalies ? "text-error" : "text-secondary"
                  }`}>
                    {hasAnomalies
                      ? `${Math.max(0, 100 - anomalies.length * 15)}%`
                      : "100%"}
                  </span>
                  <span className="font-label text-[10px] uppercase tracking-widest text-outline">
                    {hasAnomalies ? "Needs Review" : "Fully Verified"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block p-8 border-t text-center text-sm text-gray-500">
        <p>
          This report was generated from GotongLedger &mdash; Transparent Donation Tracking
        </p>
        <p>All data is sourced from on-chain events and is publicly verifiable.</p>
      </div>
    </div>
  );
}
