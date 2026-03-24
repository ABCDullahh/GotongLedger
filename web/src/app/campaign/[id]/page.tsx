"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { toast } from "sonner";
import {
  Heart,
  Wallet,
  ExternalLink,
  RefreshCw,
  FileText,
  Clock,
  User,
  TrendingUp,
  FileBarChart,
} from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  getDonationLogs,
  getExpenseLogs,
  getCampaignCreatedLogs,
  CAMPAIGN_LEDGER_ADDRESS,
  CAMPAIGN_LEDGER_ABI,
  type DonationReceivedEvent,
  type ExpenseRecordedEvent,
  type CampaignCreatedEvent,
} from "@/lib/blockchain";
import { formatAddress, formatEther, formatTimestamp } from "@/lib/utils";
import { NoDonationsState, NoExpensesState, NoDataState } from "@/components/empty-state";
import { DirectPayment } from "@/components/direct-payment";
import { DonorLeaderboard } from "@/components/donor-leaderboard";
import { ShareButton } from "@/components/share-button";
import { EmbedWidget } from "@/components/embed-widget";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PageProps {
  params: { id: string };
}

export default function CampaignDetailPage({ params }: PageProps) {
  const { id } = params;
  const campaignId = BigInt(id);

  const { isConnected } = useAccount();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [donateAmount, setDonateAmount] = useState("");
  const [campaign, setCampaign] = useState<CampaignCreatedEvent | null>(null);
  const [metadata, setMetadata] = useState<{ title: string; description: string } | null>(null);
  const [donations, setDonations] = useState<DonationReceivedEvent[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecordedEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"donations" | "expenses" | "chart">("donations");

  const { data: hash, isPending, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const fetchData = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);

      const [campaignLogs, donationLogs, expenseLogs] = await Promise.all([
        getCampaignCreatedLogs(),
        getDonationLogs(campaignId),
        getExpenseLogs(campaignId),
      ]);

      const campaignData = campaignLogs.find(
        (c) => c.campaignId === campaignId
      );
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

      if (showToast) toast.success("Data refreshed");
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

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Donation successful!");
      setDonateAmount("");
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed]);

  const handleDonate = async () => {
    if (!donateAmount || parseFloat(donateAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      writeContract({
        address: CAMPAIGN_LEDGER_ADDRESS,
        abi: CAMPAIGN_LEDGER_ABI,
        functionName: "donate",
        args: [campaignId],
        value: parseEther(donateAmount),
      });
    } catch (error) {
      console.error("Donation failed:", error);
      toast.error("Donation failed");
    }
  };

  const totalDonations = donations.reduce((sum, d) => sum + d.amountWei, 0n);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amountWei, 0n);
  const utilization =
    totalDonations > 0n
      ? (Number(totalExpenses) / Number(totalDonations)) * 100
      : 0;

  // Prepare chart data
  const chartData = expenses.slice(0, 10).map((e) => ({
    category: e.category,
    amount: Number(e.amountWei) / 1e18,
  }));

  // --- Loading State ---
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-48 bg-surface-container-low rounded-sm mb-10 animate-pulse" />
        {/* Title skeleton */}
        <div className="h-12 w-96 bg-surface-container-low rounded-sm mb-4 animate-pulse" />
        <div className="h-6 w-[32rem] bg-surface-container-low rounded-sm mb-8 animate-pulse" />
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="h-40 bg-surface-container-low rounded-sm animate-pulse" />
              <div className="h-40 bg-surface-container-low rounded-sm animate-pulse" />
            </div>
            <div className="h-24 bg-surface-container-low rounded-sm animate-pulse" />
            <div className="h-80 bg-surface-container-low rounded-sm animate-pulse" />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <div className="h-96 bg-surface-container-low rounded-sm animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // --- Not Found State ---
  if (!campaign) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-surface-container-low ghost-border rounded-sm py-20 text-center">
          <h2 className="font-headline text-2xl font-bold text-on-surface mb-3">
            Campaign Not Found
          </h2>
          <p className="text-outline mb-8 font-body">
            This campaign does not exist or has not been created yet.
          </p>
          <Link
            href="/"
            className="inline-block bg-primary-container text-white font-headline text-sm uppercase tracking-[0.2em] px-8 py-3 rounded-sm hover:opacity-90 transition-opacity"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* --- Breadcrumbs --- */}
      <Breadcrumbs
        items={[
          { label: "Campaigns", href: "/" },
          { label: metadata?.title || `Campaign #${id}` },
        ]}
      />

      {/* --- Header --- */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
          <div className="max-w-2xl">
            <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tighter leading-tight text-on-surface mb-4">
              {metadata?.title || `Campaign #${id}`}
            </h1>
            <p className="font-body text-lg text-on-surface-variant leading-relaxed mb-6">
              {metadata?.description || "No description provided"}
            </p>

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-surface-container-low ghost-border px-4 py-2 rounded-sm">
                <User className="h-3.5 w-3.5 text-outline" />
                <span className="font-label text-xs tracking-widest text-on-surface-variant">
                  {formatAddress(campaign.owner)}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-low ghost-border px-4 py-2 rounded-sm">
                <Clock className="h-3.5 w-3.5 text-outline" />
                <span className="font-label text-xs tracking-widest text-on-surface-variant">
                  {formatTimestamp(Number(campaign.createdAt))}
                </span>
              </div>
              <span className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary bg-secondary/10 px-3 py-1.5 rounded-sm">
                Active
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 shrink-0">
            <ShareButton
              campaignId={Number(campaignId)}
              title={metadata?.title || `Campaign #${id}`}
              raised={formatEther(totalDonations)}
              donors={donations.length}
            />
            <Link
              href={`/campaign/${id}/report`}
              className="flex items-center gap-2 ghost-border px-4 py-2.5 rounded-sm font-label text-xs uppercase tracking-[0.2em] text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <FileBarChart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Report</span>
            </Link>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="ghost-border p-2.5 rounded-sm text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-40"
              aria-label="Refresh campaign data"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* --- 12-Column Grid --- */}
      <div className="grid grid-cols-12 gap-8">
        {/* ===== Left Column ===== */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Total Raised */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative bg-surface-container-low p-8 ghost-border rounded-sm overflow-hidden"
            >
              <Heart className="absolute top-4 right-4 h-16 w-16 text-primary opacity-5" />
              <p className="font-label text-[10px] uppercase tracking-[0.2em] text-outline mb-3">
                Total Raised
              </p>
              <p className="font-headline text-4xl font-bold text-primary mb-1">
                {formatEther(totalDonations)} <span className="text-lg font-normal text-on-surface-variant">ETH</span>
              </p>
              <p className="font-label text-xs text-outline">
                {donations.length} donation{donations.length !== 1 ? "s" : ""}
              </p>
            </motion.div>

            {/* Total Spent */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative bg-surface-container-low p-8 ghost-border rounded-sm overflow-hidden"
            >
              <Wallet className="absolute top-4 right-4 h-16 w-16 text-secondary opacity-5" />
              <p className="font-label text-[10px] uppercase tracking-[0.2em] text-outline mb-3">
                Total Spent
              </p>
              <p className="font-headline text-4xl font-bold text-secondary mb-1">
                {formatEther(totalExpenses)} <span className="text-lg font-normal text-on-surface-variant">ETH</span>
              </p>
              <p className="font-label text-xs text-outline">
                {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
              </p>
            </motion.div>
          </div>

          {/* Fund Utilization */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-container-lowest p-8 ghost-border rounded-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-outline" />
                <h3 className="font-headline font-bold text-sm uppercase tracking-widest text-on-surface">
                  Fund Utilization
                </h3>
              </div>
              <span className="font-label text-2xl font-bold text-secondary">
                {utilization.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-3 bg-surface-container-highest rounded-sm overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(utilization, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                className="h-full bg-secondary rounded-sm"
              />
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {/* Tab Buttons */}
            <div className="flex gap-0 border-b border-outline-variant/15 mb-0">
              {[
                { key: "donations" as const, label: `Donations (${donations.length})` },
                { key: "expenses" as const, label: `Expenses (${expenses.length})` },
                { key: "chart" as const, label: "Chart" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-4 px-6 font-headline font-bold text-sm uppercase tracking-widest transition-colors relative ${
                    activeTab === tab.key
                      ? "text-primary border-b-2 border-primary"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {/* Donations Tab */}
              {activeTab === "donations" && (
                <div>
                  {donations.length === 0 ? (
                    <NoDonationsState />
                  ) : (
                    <table className="w-full border-separate border-spacing-y-2">
                      <thead>
                        <tr>
                          <th className="text-left font-label text-[10px] uppercase tracking-[0.2em] text-outline pb-3 px-4">
                            From
                          </th>
                          <th className="text-left font-label text-[10px] uppercase tracking-[0.2em] text-outline pb-3 px-4">
                            Amount
                          </th>
                          <th className="text-left font-label text-[10px] uppercase tracking-[0.2em] text-outline pb-3 px-4 hidden sm:table-cell">
                            Time
                          </th>
                          <th className="text-left font-label text-[10px] uppercase tracking-[0.2em] text-outline pb-3 px-4">
                            Tx
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {donations.map((d, i) => (
                          <tr
                            key={i}
                            className="bg-surface-container-low/40 hover:bg-surface-container-low transition-colors"
                          >
                            <td className="px-4 py-3.5 rounded-l-sm font-mono text-xs text-on-surface-variant">
                              {formatAddress(d.from)}
                            </td>
                            <td className="px-4 py-3.5 font-bold text-primary font-label">
                              {formatEther(d.amountWei)} ETH
                            </td>
                            <td className="px-4 py-3.5 text-sm text-outline hidden sm:table-cell font-body">
                              {formatTimestamp(Number(d.timestamp))}
                            </td>
                            <td className="px-4 py-3.5 rounded-r-sm">
                              <Link
                                href={`/explorer/tx/${d.transactionHash}`}
                                className="text-outline hover:text-primary transition-colors flex items-center gap-1"
                                aria-label="View transaction details"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Expenses Tab */}
              {activeTab === "expenses" && (
                <div>
                  {expenses.length === 0 ? (
                    <NoExpensesState />
                  ) : (
                    <table className="w-full border-separate border-spacing-y-2">
                      <thead>
                        <tr>
                          <th className="text-left font-label text-[10px] uppercase tracking-[0.2em] text-outline pb-3 px-4">
                            Category
                          </th>
                          <th className="text-left font-label text-[10px] uppercase tracking-[0.2em] text-outline pb-3 px-4">
                            Amount
                          </th>
                          <th className="text-left font-label text-[10px] uppercase tracking-[0.2em] text-outline pb-3 px-4 hidden md:table-cell">
                            Note
                          </th>
                          <th className="text-left font-label text-[10px] uppercase tracking-[0.2em] text-outline pb-3 px-4">
                            Proof
                          </th>
                          <th className="text-left font-label text-[10px] uppercase tracking-[0.2em] text-outline pb-3 px-4">
                            Tx
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((e, i) => (
                          <tr
                            key={i}
                            className="bg-surface-container-low/40 hover:bg-surface-container-low transition-colors"
                          >
                            <td className="px-4 py-3.5 rounded-l-sm">
                              <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant ghost-border px-2.5 py-1 rounded-sm">
                                {e.category}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-bold text-secondary font-label">
                              {formatEther(e.amountWei)} ETH
                            </td>
                            <td className="px-4 py-3.5 text-sm text-outline max-w-[150px] truncate hidden md:table-cell font-body">
                              {e.note || "-"}
                            </td>
                            <td className="px-4 py-3.5">
                              <a
                                href={`http://127.0.0.1:8080/ipfs/${e.cid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-outline hover:text-primary transition-colors flex items-center gap-1.5"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span className="text-xs hidden sm:inline">Proof</span>
                              </a>
                            </td>
                            <td className="px-4 py-3.5 rounded-r-sm">
                              <Link
                                href={`/explorer/tx/${e.transactionHash}`}
                                className="text-outline hover:text-primary transition-colors flex items-center gap-1"
                                aria-label="View expense transaction details"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Chart Tab */}
              {activeTab === "chart" && (
                <div className="bg-surface-container-low ghost-border rounded-sm p-8">
                  <h3 className="font-headline font-bold text-sm uppercase tracking-widest text-on-surface mb-6">
                    Expense Breakdown
                  </h3>
                  {chartData.length === 0 ? (
                    <NoDataState />
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical">
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(240 2% 21%)"
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            tick={{ fill: "#AA8986", fontSize: 11, fontFamily: "Space Grotesk" }}
                            axisLine={{ stroke: "hsl(3 24% 30% / 0.15)" }}
                            tickLine={false}
                          />
                          <YAxis
                            dataKey="category"
                            type="category"
                            width={100}
                            tick={{ fill: "#E5E2E3", fontSize: 11, fontFamily: "Space Grotesk" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1C1B1C",
                              border: "1px solid hsl(3 24% 30% / 0.15)",
                              borderRadius: "4px",
                              color: "#E5E2E3",
                              fontFamily: "Space Grotesk",
                              fontSize: "12px",
                            }}
                            cursor={{ fill: "hsl(240 2% 17% / 0.5)" }}
                          />
                          <Bar
                            dataKey="amount"
                            name="Amount (ETH)"
                            fill="#FFB3AE"
                            radius={[0, 2, 2, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ===== Right Column ===== */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Donate Card (when connected) */}
          {isConnected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="sticky top-28 bg-surface-container-high p-8 ghost-border rounded-sm shadow-2xl shadow-black/40"
            >
              <div className="flex items-center gap-3 mb-6">
                <Heart className="h-5 w-5 text-primary" />
                <h3 className="font-headline font-extrabold text-2xl tracking-tight text-on-surface">
                  Donate
                </h3>
              </div>

              <div className="space-y-5">
                {/* Amount Input */}
                <div>
                  <label htmlFor="donate-amount" className="font-label text-[10px] uppercase tracking-[0.2em] text-outline block mb-2">
                    Amount (ETH)
                  </label>
                  <input
                    id="donate-amount"
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="0.01"
                    value={donateAmount}
                    onChange={(e) => setDonateAmount(e.target.value)}
                    disabled={isPending || isConfirming}
                    className="w-full bg-surface-container-highest border-none rounded-sm px-4 py-3 font-label text-xl text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-40"
                  />
                </div>

                {/* Quick Amounts */}
                <div className="grid grid-cols-4 gap-2">
                  {[0.01, 0.05, 0.1, 0.5].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDonateAmount(amount.toString())}
                      disabled={isPending || isConfirming}
                      className="ghost-border rounded-sm py-2 font-label text-xs text-on-surface-variant hover:bg-primary/20 hover:text-primary hover:border-primary/30 transition-all disabled:opacity-40"
                    >
                      {amount}
                    </button>
                  ))}
                </div>

                {/* Donate Button */}
                <button
                  onClick={handleDonate}
                  disabled={isPending || isConfirming || !donateAmount}
                  className="w-full bg-primary-container text-white font-headline text-sm uppercase tracking-[0.2em] py-3.5 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPending || isConfirming ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      {isPending ? "Confirming..." : "Processing..."}
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4" />
                      Donate Now
                    </>
                  )}
                </button>

                {/* Tx Hash */}
                {hash && (
                  <p className="font-label text-[10px] text-outline text-center tracking-wider">
                    Tx: {formatAddress(hash)}
                  </p>
                )}

                {/* Fine Print */}
                <p className="text-[10px] text-outline text-center leading-relaxed">
                  Transaction will be recorded on-chain. Gas fees apply.
                </p>
              </div>
            </motion.div>
          )}

          {/* Direct Payment (QR/Transfer) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <DirectPayment
              treasuryAddress={campaign.treasury}
              campaignId={Number(campaignId)}
              campaignTitle={metadata?.title || `Campaign #${id}`}
              chainId={31337}
              isWalletConnected={isConnected}
            />
          </motion.div>

          {/* Donor Leaderboard */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <DonorLeaderboard donations={donations} />
          </motion.div>

          {/* Embed Widget */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <EmbedWidget
              campaignId={Number(campaignId)}
              campaignTitle={metadata?.title || `Campaign #${id}`}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
