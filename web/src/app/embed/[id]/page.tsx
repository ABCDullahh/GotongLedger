"use client";

import { useEffect, useState } from "react";
import {
  getDonationLogs,
  getCampaignCreatedLogs,
  type DonationReceivedEvent,
  type CampaignCreatedEvent,
} from "@/lib/blockchain";
import { formatEther } from "@/lib/utils";

interface PageProps {
  params: { id: string };
}

export default function EmbedPage({ params }: PageProps) {
  const { id } = params;
  const campaignId = BigInt(id);

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<CampaignCreatedEvent | null>(null);
  const [metadata, setMetadata] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [totalRaised, setTotalRaised] = useState(0n);
  const [donorCount, setDonorCount] = useState(0);
  const [goalEth] = useState(10);

  // Hide the root layout's navbar and footer when this page mounts
  useEffect(() => {
    const navbar = document.querySelector("nav");
    const footer = document.querySelector("footer");
    const mainWrapper = document.querySelector("main");

    if (navbar) (navbar as HTMLElement).style.display = "none";
    if (footer) (footer as HTMLElement).style.display = "none";
    if (mainWrapper) (mainWrapper as HTMLElement).style.paddingTop = "0";

    // Also hide the chain-check overlay if present
    const chainCheck = document.getElementById("chain-check");
    if (chainCheck) chainCheck.style.display = "none";

    return () => {
      if (navbar) (navbar as HTMLElement).style.display = "";
      if (footer) (footer as HTMLElement).style.display = "";
      if (mainWrapper) (mainWrapper as HTMLElement).style.paddingTop = "";
      if (chainCheck) chainCheck.style.display = "";
    };
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [campaignLogs, donationLogs] = await Promise.all([
          getCampaignCreatedLogs(),
          getDonationLogs(campaignId),
        ]);

        const campaignData = campaignLogs.find(
          (c) => c.campaignId === campaignId
        );
        setCampaign(campaignData || null);

        const total = donationLogs.reduce(
          (sum: bigint, d: DonationReceivedEvent) => sum + d.amountWei,
          0n
        );
        setTotalRaised(total);

        const uniqueDonors = new Set(donationLogs.map((d) => d.from));
        setDonorCount(uniqueDonors.size);

        const res = await fetch("/api/campaigns");
        const data = await res.json();
        if (data.success) {
          const meta = data.campaigns.find(
            (c: { campaignId: number }) => c.campaignId === Number(campaignId)
          );
          setMetadata(meta || null);
        }
      } catch (error) {
        console.error("Failed to fetch embed data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const raisedEth = Number(totalRaised) / 1e18;
  const progress = Math.min((raisedEth / goalEth) * 100, 100);
  const campaignUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/campaign/${id}`
      : `/campaign/${id}`;

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <span style={styles.loadingText}>Loading campaign...</span>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={styles.loadingContainer}>
        <span style={{ ...styles.loadingText, color: "#FFB4AB" }}>
          Campaign not found
        </span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Left accent bar */}
      <div style={styles.accentBar} />

      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>
          {metadata?.title || `Campaign #${id}`}
        </span>
        <span style={styles.badge}>Active</span>
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Raised</span>
          <div>
            <span style={styles.statValueRaised}>
              {formatEther(totalRaised)}
            </span>
            <span style={styles.statUnit}>ETH</span>
          </div>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Donors</span>
          <span style={styles.statValueDonors}>{donorCount}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={styles.progressContainer}>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={styles.embedFooter}>
        <a
          href={campaignUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.brand}
        >
          <span style={styles.brandDot} />
          GotongLedger
        </a>
        <a
          href={campaignUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.donateBtn}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          Donate
        </a>
      </div>
    </div>
  );
}

// All styles inline so the embed works in any context (including iframes)
const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "220px",
    gap: "12px",
    backgroundColor: "#131314",
    borderRadius: "4px",
  },
  spinner: {
    width: "24px",
    height: "24px",
    border: "2px solid rgba(90, 64, 62, 0.3)",
    borderTopColor: "#FFB3AE",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    fontSize: "10px",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#AA8986",
    fontFamily: "system-ui, sans-serif",
  },
  container: {
    width: "100%",
    maxWidth: "400px",
    height: "220px",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    backgroundColor: "#131314",
    color: "#E5E2E3",
    borderRadius: "4px",
    border: "1px solid rgba(90, 64, 62, 0.15)",
    position: "relative",
    overflow: "hidden",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    boxSizing: "border-box",
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "3px",
    height: "100%",
    background: "linear-gradient(to bottom, #FF5555, #FFB3AE)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  title: {
    fontSize: "16px",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: "1.2",
    color: "#E5E2E3",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "240px",
  },
  badge: {
    fontSize: "9px",
    fontWeight: 600,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#AED18D",
    backgroundColor: "rgba(174, 209, 141, 0.1)",
    padding: "3px 8px",
    borderRadius: "2px",
    flexShrink: 0,
  },
  stats: {
    display: "flex",
    gap: "24px",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  statLabel: {
    fontSize: "9px",
    fontWeight: 600,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#AA8986",
  },
  statValueRaised: {
    fontSize: "20px",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: "1",
    color: "#AED18D",
  },
  statValueDonors: {
    fontSize: "20px",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: "1",
    color: "#E5E2E3",
  },
  statUnit: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#AA8986",
    marginLeft: "4px",
  },
  progressContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  progressTrack: {
    width: "100%",
    height: "6px",
    backgroundColor: "#2A2A2B",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(to right, #FF5555, #FFB3AE)",
    borderRadius: "3px",
    transition: "width 1s ease-out",
  },
  embedFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "#FFB3AE",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  brandDot: {
    width: "6px",
    height: "6px",
    borderRadius: "1px",
    background: "linear-gradient(135deg, #FF5555, #FFB3AE)",
    display: "inline-block",
  },
  donateBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#FF5555",
    color: "#131314",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    padding: "6px 16px",
    borderRadius: "2px",
    border: "none",
    textDecoration: "none",
    cursor: "pointer",
  },
};
