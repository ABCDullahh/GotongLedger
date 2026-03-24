"use client";

import { useEffect, useState, useMemo } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  getAllStats,
  type CampaignCreatedEvent,
  type DonationReceivedEvent,
  type ExpenseRecordedEvent,
} from "@/lib/blockchain";
import { formatEther } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

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
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm bg-[#2A2A2B] px-3 py-2 ghost-border font-label text-xs">
      <p className="mb-1 text-[#AA8986]">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(4) : entry.value} ETH
        </p>
      ))}
    </div>
  );
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm bg-[#2A2A2B] px-3 py-2 ghost-border font-label text-xs">
      <p className="mb-1 text-[#AA8986]">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color || entry.fill }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface StatsData {
  totalCampaigns: number;
  totalDonations: bigint;
  totalExpenses: bigint;
  campaigns: CampaignCreatedEvent[];
  donations: DonationReceivedEvent[];
  expenses: ExpenseRecordedEvent[];
}

// --- Donation Volume over time ---
function buildDonationVolume(donations: DonationReceivedEvent[]) {
  if (donations.length === 0) return [];

  const byDate = new Map<string, number>();

  for (const d of donations) {
    const ts = Number(d.timestamp) * 1000;
    const dateKey = new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const prev = byDate.get(dateKey) || 0;
    byDate.set(dateKey, prev + Number(d.amountWei) / 1e18);
  }

  // Convert to cumulative
  const entries = Array.from(byDate.entries());
  let cumulative = 0;
  return entries.map(([date, amount]) => {
    cumulative += amount;
    return { date, amount: parseFloat(amount.toFixed(4)), cumulative: parseFloat(cumulative.toFixed(4)) };
  });
}

// --- Top Campaigns by total raised ---
function buildTopCampaigns(
  campaigns: CampaignCreatedEvent[],
  donations: DonationReceivedEvent[]
) {
  const raised = new Map<string, number>();
  for (const d of donations) {
    const id = d.campaignId.toString();
    const prev = raised.get(id) || 0;
    raised.set(id, prev + Number(d.amountWei) / 1e18);
  }

  const result = campaigns
    .map((c) => {
      const id = c.campaignId.toString();
      const totalRaised = raised.get(id) || 0;
      return {
        campaignId: id,
        label: `Campaign #${id}`,
        totalRaised,
      };
    })
    .sort((a, b) => b.totalRaised - a.totalRaised)
    .slice(0, 10);

  const maxRaised = result.length > 0 ? Math.max(...result.map((r) => r.totalRaised)) : 1;

  return result.map((r) => ({
    ...r,
    percentage: maxRaised > 0 ? (r.totalRaised / maxRaised) * 100 : 0,
  }));
}

// --- Expense Category Breakdown ---
function buildExpenseCategories(expenses: ExpenseRecordedEvent[]) {
  const byCategory = new Map<string, { amount: number; count: number }>();

  for (const e of expenses) {
    const cat = e.category || "Uncategorized";
    const prev = byCategory.get(cat) || { amount: 0, count: 0 };
    byCategory.set(cat, {
      amount: prev.amount + Number(e.amountWei) / 1e18,
      count: prev.count + 1,
    });
  }

  const entries = Array.from(byCategory.entries());
  const totalAmount = entries.reduce((sum, [, v]) => sum + v.amount, 0);

  return entries
    .map(([category, data]) => ({
      category,
      amount: parseFloat(data.amount.toFixed(4)),
      count: data.count,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

// --- Donation Size Distribution ---
function buildDonationDistribution(donations: DonationReceivedEvent[]) {
  const buckets = [
    { label: "<0.01", min: 0, max: 0.01, count: 0 },
    { label: "0.01-0.1", min: 0.01, max: 0.1, count: 0 },
    { label: "0.1-1", min: 0.1, max: 1, count: 0 },
    { label: "1-10", min: 1, max: 10, count: 0 },
    { label: "10+", min: 10, max: Infinity, count: 0 },
  ];

  for (const d of donations) {
    const eth = Number(d.amountWei) / 1e18;
    for (const bucket of buckets) {
      if (eth >= bucket.min && eth < bucket.max) {
        bucket.count++;
        break;
      }
    }
  }

  return buckets.map((b) => ({ name: b.label, count: b.count }));
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAllStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch analytics data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const donationVolume = useMemo(
    () => (stats ? buildDonationVolume(stats.donations) : []),
    [stats]
  );

  const topCampaigns = useMemo(
    () => (stats ? buildTopCampaigns(stats.campaigns, stats.donations) : []),
    [stats]
  );

  const expenseCategories = useMemo(
    () => (stats ? buildExpenseCategories(stats.expenses) : []),
    [stats]
  );

  const donationDistribution = useMemo(
    () => (stats ? buildDonationDistribution(stats.donations) : []),
    [stats]
  );

  const avgDonation = useMemo(() => {
    if (!stats || stats.donations.length === 0) return "0.0000";
    const total = Number(stats.totalDonations) / 1e18;
    return (total / stats.donations.length).toFixed(4);
  }, [stats]);

  // --- Loading skeleton ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#131314]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 h-4 w-48 animate-pulse rounded-sm bg-[#2A2A2B]" />
          <div className="mb-4 h-16 w-96 animate-pulse rounded-sm bg-[#2A2A2B]" />
          <div className="mb-10 h-4 w-72 animate-pulse rounded-sm bg-[#1C1B1C]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-sm bg-[#1C1B1C]" />
            ))}
          </div>
          <div className="mt-8 h-72 animate-pulse rounded-sm bg-[#1C1B1C]" />
        </div>
      </div>
    );
  }

  const totalRaisedEth = stats ? formatEther(stats.totalDonations) : "0.0000";
  const totalSpentEth = stats ? formatEther(stats.totalExpenses) : "0.0000";

  return (
    <div className="min-h-screen bg-[#131314]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: "Analytics" }]} />

        {/* Header */}
        <div className="mb-10">
          <h1 className="font-headline text-5xl font-extrabold uppercase tracking-tighter text-[#E5E2E3] md:text-7xl">
            ANALYTICS
          </h1>
          <p className="mt-3 font-body text-sm text-[#AA8986]">
            On-chain metrics across all campaigns, donations, and expenses.
          </p>
        </div>

        {/* ===== KPI Cards ===== */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Campaigns */}
          <div className="ghost-border rounded-sm bg-[#1C1B1C] p-6">
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
              Total Campaigns
            </span>
            <p className="mt-2 font-headline text-3xl font-bold text-[#E5E2E3]">
              {stats?.totalCampaigns ?? 0}
            </p>
          </div>

          {/* Total Raised */}
          <div className="ghost-border rounded-sm bg-[#1C1B1C] p-6">
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
              Total Raised
            </span>
            <p className="mt-2 font-headline text-3xl font-bold text-[#AED18D]">
              {totalRaisedEth}
              <span className="ml-1 text-base font-normal text-[#AA8986]">ETH</span>
            </p>
          </div>

          {/* Total Spent */}
          <div className="ghost-border rounded-sm bg-[#1C1B1C] p-6">
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
              Total Spent
            </span>
            <p className="mt-2 font-headline text-3xl font-bold text-[#FFB3AE]">
              {totalSpentEth}
              <span className="ml-1 text-base font-normal text-[#AA8986]">ETH</span>
            </p>
          </div>

          {/* Avg Donation */}
          <div className="ghost-border rounded-sm bg-[#1C1B1C] p-6">
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
              Avg Donation
            </span>
            <p className="mt-2 font-headline text-3xl font-bold text-[#E5E2E3]">
              {avgDonation}
              <span className="ml-1 text-base font-normal text-[#AA8986]">ETH</span>
            </p>
          </div>
        </div>

        {/* ===== Donation Volume Chart ===== */}
        <div className="ghost-border mb-10 rounded-sm bg-[#1C1B1C] p-6 md:p-8">
          <h2 className="mb-6 font-headline text-lg font-bold uppercase tracking-widest text-[#E5E2E3]">
            Donation Volume
          </h2>
          {donationVolume.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={donationVolume}>
                  <defs>
                    <linearGradient id="donationGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF5555" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF5555" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2B" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#AA8986", fontSize: 11, fontFamily: "Space Grotesk" }}
                    axisLine={{ stroke: "#2A2A2B" }}
                    tickLine={{ stroke: "#2A2A2B" }}
                  />
                  <YAxis
                    tick={{ fill: "#AA8986", fontSize: 11, fontFamily: "Space Grotesk" }}
                    axisLine={{ stroke: "#2A2A2B" }}
                    tickLine={{ stroke: "#2A2A2B" }}
                    width={60}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    name="Cumulative"
                    stroke="#FF5555"
                    strokeWidth={2}
                    fill="url(#donationGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    name="Daily"
                    stroke="#FFB3AE"
                    strokeWidth={1.5}
                    fill="none"
                    strokeDasharray="4 4"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center">
              <p className="font-body text-sm text-[#AA8986]">No donation data available yet.</p>
            </div>
          )}
        </div>

        {/* ===== Two-column: Top Campaigns + Expense Breakdown ===== */}
        <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Campaigns */}
          <div className="ghost-border rounded-sm bg-[#1C1B1C] p-6 md:p-8">
            <h2 className="mb-6 font-headline text-lg font-bold uppercase tracking-widest text-[#E5E2E3]">
              Top Campaigns
            </h2>
            {topCampaigns.length > 0 ? (
              <div className="space-y-4">
                {topCampaigns.map((campaign, idx) => (
                  <div key={campaign.campaignId} className="flex items-center gap-4">
                    {/* Position */}
                    <span className="w-6 shrink-0 font-headline text-lg font-extrabold text-[#AA8986]">
                      {idx + 1}
                    </span>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="truncate font-headline text-sm font-bold text-[#E5E2E3]">
                          {campaign.label}
                        </span>
                        <span className="shrink-0 font-label text-xs text-[#AED18D]">
                          {campaign.totalRaised.toFixed(4)} ETH
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 w-full rounded-full bg-[#0E0E0F]">
                        <div
                          className="h-1.5 rounded-full bg-[#FF5555] transition-all"
                          style={{ width: `${campaign.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center">
                <p className="font-body text-sm text-[#AA8986]">No campaigns found.</p>
              </div>
            )}
          </div>

          {/* Expense Category Breakdown */}
          <div className="ghost-border rounded-sm bg-[#1C1B1C] p-6 md:p-8">
            <h2 className="mb-6 font-headline text-lg font-bold uppercase tracking-widest text-[#E5E2E3]">
              Expense Breakdown
            </h2>
            {expenseCategories.length > 0 ? (
              <div className="space-y-4">
                {expenseCategories.map((cat, idx) => (
                  <div key={cat.category}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                        />
                        <span className="font-label text-xs uppercase tracking-wider text-[#E5E2E3]">
                          {cat.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-label text-[10px] text-[#AA8986]">
                          {cat.count} txn{cat.count !== 1 ? "s" : ""}
                        </span>
                        <span className="font-label text-xs text-[#FFB3AE]">
                          {cat.amount.toFixed(4)} ETH
                        </span>
                      </div>
                    </div>

                    {/* Horizontal bar */}
                    <div className="h-2 w-full rounded-full bg-[#0E0E0F]">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center">
                <p className="font-body text-sm text-[#AA8986]">No expenses recorded yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* ===== Donation Size Distribution ===== */}
        <div className="ghost-border mb-10 rounded-sm bg-[#1C1B1C] p-6 md:p-8">
          <h2 className="mb-6 font-headline text-lg font-bold uppercase tracking-widest text-[#E5E2E3]">
            Donation Size Distribution
          </h2>
          {stats && stats.donations.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={donationDistribution} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2B" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#AA8986", fontSize: 11, fontFamily: "Space Grotesk" }}
                    axisLine={{ stroke: "#2A2A2B" }}
                    tickLine={{ stroke: "#2A2A2B" }}
                    label={{
                      value: "ETH Range",
                      position: "insideBottom",
                      offset: -5,
                      fill: "#AA8986",
                      fontSize: 10,
                      fontFamily: "Space Grotesk",
                    }}
                  />
                  <YAxis
                    tick={{ fill: "#AA8986", fontSize: 11, fontFamily: "Space Grotesk" }}
                    axisLine={{ stroke: "#2A2A2B" }}
                    tickLine={{ stroke: "#2A2A2B" }}
                    allowDecimals={false}
                    label={{
                      value: "Count",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#AA8986",
                      fontSize: 10,
                      fontFamily: "Space Grotesk",
                    }}
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="count" name="Donations" radius={[2, 2, 0, 0]}>
                    {donationDistribution.map((_, index) => (
                      <Cell
                        key={index}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center">
              <p className="font-body text-sm text-[#AA8986]">No donation data available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
