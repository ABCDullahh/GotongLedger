"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";
import {
  getAllStats,
  type CampaignCreatedEvent,
  type DonationReceivedEvent,
  type ExpenseRecordedEvent,
} from "@/lib/blockchain";
import { formatEther } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { NoCampaignsState } from "@/components/empty-state";

interface CampaignWithMetadata extends CampaignCreatedEvent {
  title?: string;
  description?: string;
  category?: string;
  donations: bigint;
  expenses: bigint;
}

type SortOption = "newest" | "oldest" | "most-raised" | "least-raised";

const CAMPAIGN_CATEGORIES = [
  "All",
  "Education",
  "Health",
  "Disaster Relief",
  "Environment",
  "Community",
  "Infrastructure",
  "Other",
] as const;

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [minDonation, setMinDonation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [campaigns, setCampaigns] = useState<CampaignWithMetadata[]>([]);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalDonations: 0n,
    totalExpenses: 0n,
  });
  const [chartData, setChartData] = useState<
    { name: string; donations: number; expenses: number }[]
  >([]);

  const fetchData = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);

      const data = await getAllStats();

      // Fetch metadata from API
      const metaRes = await fetch("/api/campaigns");
      const metaData = await metaRes.json();
      const metaMap = new Map<number, { title: string; description: string; category: string }>();

      if (metaData.success && metaData.campaigns) {
        metaData.campaigns.forEach(
          (m: { campaignId: number; title: string; description: string; category?: string }) => {
            metaMap.set(m.campaignId, { title: m.title, description: m.description, category: m.category || "Other" });
          }
        );
      }

      // Calculate per-campaign donations and expenses
      const donationsByCampaign = new Map<number, bigint>();
      const expensesByCampaign = new Map<number, bigint>();

      data.donations.forEach((d: DonationReceivedEvent) => {
        const id = Number(d.campaignId);
        donationsByCampaign.set(
          id,
          (donationsByCampaign.get(id) || 0n) + d.amountWei
        );
      });

      data.expenses.forEach((e: ExpenseRecordedEvent) => {
        const id = Number(e.campaignId);
        expensesByCampaign.set(
          id,
          (expensesByCampaign.get(id) || 0n) + e.amountWei
        );
      });

      // Merge with metadata
      const campaignsWithMeta = data.campaigns.map((c: CampaignCreatedEvent) => {
        const id = Number(c.campaignId);
        const meta = metaMap.get(id);
        return {
          ...c,
          title: meta?.title || `Campaign #${id}`,
          description: meta?.description || "",
          category: meta?.category || "Other",
          donations: donationsByCampaign.get(id) || 0n,
          expenses: expensesByCampaign.get(id) || 0n,
        };
      });

      setCampaigns(campaignsWithMeta);
      setStats({
        totalCampaigns: data.totalCampaigns,
        totalDonations: data.totalDonations,
        totalExpenses: data.totalExpenses,
      });

      // Prepare chart data
      const chartData = campaignsWithMeta.slice(0, 10).map((c) => ({
        name: c.title?.substring(0, 15) || `#${c.campaignId}`,
        donations: Number(c.donations) / 1e18,
        expenses: Number(c.expenses) / 1e18,
      }));
      setChartData(chartData);

      if (showToast) {
        toast.success("Data refreshed successfully");
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      if (showToast) {
        toast.error("Failed to refresh data. Is the blockchain running?");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and sort campaigns
  const filteredCampaigns = campaigns
    .filter((c) => {
      // Text search
      const matchesSearch =
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Min donation filter
      const minDonationWei = minDonation ? parseFloat(minDonation) * 1e18 : 0;
      const matchesMinDonation = Number(c.donations) >= minDonationWei;

      // Category filter
      const matchesCategory =
        selectedCategory === "All" || c.category === selectedCategory;

      return matchesSearch && matchesMinDonation && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return Number(b.createdAt) - Number(a.createdAt);
        case "oldest":
          return Number(a.createdAt) - Number(b.createdAt);
        case "most-raised":
          return Number(b.donations) - Number(a.donations);
        case "least-raised":
          return Number(a.donations) - Number(b.donations);
        default:
          return 0;
      }
    });

  const activeFiltersCount =
    (minDonation ? 1 : 0) + (sortBy !== "newest" ? 1 : 0) + (selectedCategory !== "All" ? 1 : 0);

  const clearFilters = () => {
    setMinDonation("");
    setSortBy("newest");
    setSearchQuery("");
    setSelectedCategory("All");
  };

  // Custom recharts tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: Record<string, unknown> & { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-container-high p-4 ghost-border rounded-sm">
          <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant mb-2">
            {label}
          </p>
          {payload.map((entry, index: number) => (
            <p key={index} className="font-label text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(4)} ETH
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* ============================================ */}
      {/* HERO SECTION                                 */}
      {/* ============================================ */}
      <section className="relative mesh-gradient-hero min-h-[90vh] flex items-center overflow-hidden">
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,179,174,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,179,174,0.3) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        <div className="max-w-screen-2xl mx-auto px-6 md:px-10 pt-24 md:pt-32 pb-24 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Text Content */}
          <div className="col-span-1 lg:col-span-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 glass-panel ghost-border rounded-sm">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse-soft" />
                <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                  Powered by Blockchain
                </span>
              </span>
            </motion.div>

            {/* Massive Title */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-headline text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] mb-10"
            >
              <span className="text-on-surface block">RADICAL</span>
              <span className="text-on-surface block">TRANSPARENCY</span>
              <span className="text-primary block">BY DESIGN.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="font-body text-xl md:text-2xl text-on-surface-variant max-w-2xl mb-12 leading-relaxed"
            >
              A trustless ledger for community fundraising, powered by the
              Ethereum blockchain. Monitor every cent from donation to impact.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-6"
            >
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-3 bg-primary-container text-on-primary-container px-10 py-5 rounded-sm font-headline text-sm uppercase tracking-widest font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,85,85,0.3)] hover:brightness-110"
              >
                View Campaigns
              </Link>
              <a
                href="#campaigns"
                className="inline-flex items-center justify-center gap-3 glass-panel ghost-border px-10 py-5 rounded-sm font-headline text-sm uppercase tracking-widest text-on-surface transition-all duration-300 hover:border-primary/40 hover:bg-surface-bright"
              >
                Explore Ledger
              </a>
            </motion.div>
          </div>

          {/* Right: Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="col-span-1 lg:col-span-4 hidden lg:flex items-end justify-end"
          >
            <div className="relative w-full aspect-square max-w-md">
              <Image
                className="w-full h-full object-contain grayscale hover:grayscale-0 transition-all duration-700"
                src="/images/hero-crystal.png"
                alt="Abstract 3D crystal visualization"
                width={400}
                height={400}
                priority
              />
            </div>
          </motion.div>
        </div>

      </section>

      {/* ============================================ */}
      {/* STATS SECTION                                */}
      {/* ============================================ */}
      <section className="bg-surface-container-lowest border-y border-outline-variant/20 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Total Campaigns */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <span className="font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant">
                Total Campaigns
              </span>
              {loading ? (
                <div className="h-16 bg-surface-container-high/50 animate-pulse rounded-sm" />
              ) : (
                <div className="font-label text-5xl md:text-6xl font-bold tracking-tighter text-on-surface">
                  {stats.totalCampaigns}
                </div>
              )}
              <div className="h-1 bg-surface-container-high rounded-sm overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                  className="h-full bg-primary rounded-sm"
                />
              </div>
            </motion.div>

            {/* Total Donated */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <span className="font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant">
                Total Donated
              </span>
              {loading ? (
                <div className="h-16 bg-surface-container-high/50 animate-pulse rounded-sm" />
              ) : (
                <div className="font-label text-5xl md:text-6xl font-bold tracking-tighter text-secondary">
                  {formatEther(stats.totalDonations)}
                  <span className="text-2xl md:text-3xl text-on-surface-variant ml-2">ETH</span>
                </div>
              )}
              <div className="h-1 bg-surface-container-high rounded-sm overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "75%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                  className="h-full bg-secondary rounded-sm"
                />
              </div>
            </motion.div>

            {/* Total Expenses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <span className="font-label text-xs uppercase tracking-[0.15em] text-on-surface-variant">
                Total Expenses
              </span>
              {loading ? (
                <div className="h-16 bg-surface-container-high/50 animate-pulse rounded-sm" />
              ) : (
                <div className="font-label text-5xl md:text-6xl font-bold tracking-tighter text-error">
                  {formatEther(stats.totalExpenses)}
                  <span className="text-2xl md:text-3xl text-on-surface-variant ml-2">ETH</span>
                </div>
              )}
              <div className="h-1 bg-surface-container-high rounded-sm overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "45%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  className="h-full bg-error rounded-sm"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FLOW DYNAMICS CHART                          */}
      {/* ============================================ */}
      {chartData.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            {/* Editorial section title */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <h2 className="font-headline text-4xl md:text-5xl font-black uppercase tracking-tighter italic border-l-4 border-primary pl-6">
                Flow Dynamics
              </h2>
              <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant mt-4 pl-6 border-l-4 border-transparent">
                Donations vs Expenses per Campaign
              </p>
            </motion.div>

            {/* Chart container */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-surface-container-low p-6 md:p-8 ghost-border rounded-sm"
            >
              <div className="h-[350px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={4} barSize={20}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(90, 64, 62, 0.15)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#E3BEBB", fontSize: 10, fontFamily: "Space Grotesk" }}
                      axisLine={{ stroke: "rgba(90, 64, 62, 0.15)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#E3BEBB", fontSize: 10, fontFamily: "Space Grotesk" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255, 179, 174, 0.05)" }} />
                    <Legend
                      iconType="square"
                      wrapperStyle={{
                        fontFamily: "Space Grotesk",
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                      }}
                    />
                    <Bar
                      dataKey="donations"
                      name="Donations (ETH)"
                      fill="#AED18D"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="expenses"
                      name="Expenses (ETH)"
                      fill="#FF5555"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ============================================ */}
      {/* ACTIVE LEDGER GRID (Campaigns)               */}
      {/* ============================================ */}
      <section id="campaigns" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {/* Editorial section title */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
              <div>
                <h2 className="font-headline text-4xl md:text-5xl font-black uppercase tracking-tighter italic border-l-4 border-primary pl-6">
                  Active Ledger
                </h2>
                <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant mt-4 pl-6 border-l-4 border-transparent">
                  Browse and donate to transparent campaigns
                </p>
              </div>
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 ghost-border rounded-sm font-label text-[10px] uppercase tracking-widest text-on-surface-variant transition-all duration-300 hover:border-primary/40 hover:text-primary disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 mb-10">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
                <input
                  type="text"
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-container-highest pl-11 pr-4 py-3 ghost-border rounded-sm font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none w-full sm:w-[200px] bg-surface-container-highest px-4 py-3 pr-10 ghost-border rounded-sm font-label text-[11px] uppercase tracking-widest text-on-surface focus:outline-none focus:border-primary/40 transition-colors cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="most-raised">Most Raised</option>
                  <option value="least-raised">Least Raised</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50 pointer-events-none" />
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`relative inline-flex items-center justify-center w-12 h-12 ghost-border rounded-sm transition-all duration-300 ${
                  showFilters
                    ? "bg-primary-container/20 border-primary/40 text-primary"
                    : "text-on-surface-variant hover:border-primary/40 hover:text-primary"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-sm bg-primary-container text-on-primary-container text-[9px] font-label font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-6 bg-surface-container-low ghost-border rounded-sm"
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="space-y-2 flex-1">
                    <label
                      htmlFor="min-donation"
                      className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant"
                    >
                      Minimum Raised (ETH)
                    </label>
                    <input
                      id="min-donation"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g., 0.1"
                      value={minDonation}
                      onChange={(e) => setMinDonation(e.target.value)}
                      className="w-full sm:w-[180px] bg-surface-container-highest px-4 py-3 ghost-border rounded-sm font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/40 transition-colors"
                    />
                  </div>

                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center gap-2 px-4 py-3 font-label text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear all filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-2">
              {CAMPAIGN_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-sm px-3 py-1.5 font-label text-[10px] uppercase tracking-widest transition-all duration-200 ${
                    selectedCategory === cat
                      ? "bg-primary-container/20 text-primary border border-primary/30"
                      : "text-on-surface-variant border border-outline-variant/20 hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Results count */}
            <div className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant">
              Showing {filteredCampaigns.length} of {campaigns.length} campaigns
              {activeFiltersCount > 0 && " (filtered)"}
            </div>
          </div>

          {/* Campaign Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface-container-low p-8 ghost-border rounded-sm animate-pulse">
                  <div className="h-6 w-3/4 bg-surface-container-high rounded-sm mb-4" />
                  <div className="h-4 w-full bg-surface-container-high rounded-sm mb-2" />
                  <div className="h-4 w-2/3 bg-surface-container-high rounded-sm mb-6" />
                  <div className="h-2 w-full bg-surface-container-high rounded-sm mb-3" />
                  <div className="h-2 w-full bg-surface-container-high rounded-sm" />
                </div>
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="bg-surface-container-low p-8 ghost-border rounded-sm">
              <NoCampaignsState filtered={searchQuery !== "" || activeFiltersCount > 0} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign, index) => {
                const donationNum = Number(campaign.donations) / 1e18;
                const expenseNum = Number(campaign.expenses) / 1e18;
                const utilization =
                  donationNum > 0 ? (expenseNum / donationNum) * 100 : 0;

                return (
                  <motion.div
                    key={Number(campaign.campaignId)}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/campaign/${campaign.campaignId}`}>
                      <div className="group bg-surface-container-low p-8 ghost-border rounded-sm transition-all duration-300 hover:bg-surface-container hover:border-primary/40 hover:shadow-[0_0_20px_rgba(255,85,85,0.15)] h-full cursor-pointer">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-headline text-2xl font-bold text-on-surface group-hover:text-primary transition-colors leading-tight">
                            {campaign.title}
                          </h3>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-3">
                            <span className="px-2 py-1 bg-secondary-container text-secondary font-label text-[10px] uppercase tracking-widest rounded-sm">
                              Active
                            </span>
                            {campaign.category && campaign.category !== "Other" && (
                              <span className="px-2 py-1 bg-primary-container/20 text-primary border border-primary/30 font-label text-[10px] uppercase tracking-widest rounded-sm">
                                {campaign.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="font-body text-sm text-on-surface-variant/70 line-clamp-2 mb-6 leading-relaxed">
                          {campaign.description || "No description provided"}
                        </p>

                        {/* Stats */}
                        <div className="space-y-5">
                          {/* Raised */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                                Raised
                              </span>
                              <span className="font-label text-sm font-bold text-secondary">
                                {formatEther(campaign.donations)} ETH
                              </span>
                            </div>
                            <div className="h-1.5 bg-surface-container-high rounded-sm overflow-hidden">
                              <div
                                className="h-full gradient-raised rounded-sm transition-all duration-700"
                                style={{ width: `${Math.min(100, donationNum > 0 ? 100 : 0)}%` }}
                              />
                            </div>
                          </div>

                          {/* Spent */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                                Spent
                              </span>
                              <span className="font-label text-sm font-bold text-on-surface">
                                {formatEther(campaign.expenses)} ETH
                              </span>
                            </div>
                            <div className="h-1.5 bg-surface-container-high rounded-sm overflow-hidden">
                              <div
                                className="h-full gradient-spent rounded-sm transition-all duration-700"
                                style={{ width: `${Math.min(utilization, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Utilization */}
                          <div className="flex justify-between items-center pt-3 border-t border-outline-variant/10">
                            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                              Fund Utilization
                            </span>
                            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                              {utilization.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {/* View arrow */}
                        <div className="mt-6 flex items-center gap-2 font-label text-[10px] uppercase tracking-widest text-on-surface-variant/50 group-hover:text-primary transition-colors">
                          <span>View Details</span>
                          <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
