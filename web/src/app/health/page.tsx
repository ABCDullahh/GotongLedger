"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Server,
  Database,
  Globe,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Bug,
} from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { toast } from "sonner";

interface HealthStatus {
  service: string;
  status: "healthy" | "unhealthy" | "unknown";
  latency?: number;
  message?: string;
  url?: string;
}

interface HealthResponse {
  overall: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: HealthStatus[];
  contract: {
    address: string;
    chainId: number;
    deployed: boolean;
  };
}

const serviceIcons: Record<string, React.ElementType> = {
  "Hardhat RPC": Database,
  "IPFS API": Server,
  "IPFS Gateway": Globe,
};

const troubleshootingTips: Record<string, string[]> = {
  "Hardhat RPC": [
    "Run 'pnpm dev' to start all services",
    "Check if port 8545 is in use: netstat -ano | findstr :8545",
    "Make sure Hardhat node is running",
  ],
  "IPFS API": [
    "Run 'pnpm ipfs:up' to start IPFS container",
    "Check Docker is running",
    "View logs: pnpm ipfs:logs",
  ],
  "IPFS Gateway": [
    "IPFS Gateway depends on IPFS API",
    "Check if port 8080 is available",
    "Restart IPFS: pnpm ipfs:down && pnpm ipfs:up",
  ],
};

export default function HealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async (showToast = false) => {
    try {
      if (showToast) setChecking(true);

      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
      setLastChecked(new Date());

      if (showToast) {
        if (data.overall === "healthy") {
          toast.success("All systems operational!");
        } else if (data.overall === "degraded") {
          toast.warning("Some services are having issues");
        } else {
          toast.error("System health check failed");
        }
      }
    } catch (error) {
      console.error("Health check failed:", error);
      if (showToast) {
        toast.error("Failed to check health status");
      }
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(() => checkHealth(), 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const copyAddress = () => {
    if (health?.contract.address) {
      navigator.clipboard.writeText(health.contract.address);
      setCopiedAddress(true);
      toast.success("Contract address copied!");
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131314]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 h-4 w-48 animate-pulse rounded-sm bg-[#2A2A2B]" />
          <div className="mb-4 h-12 w-80 animate-pulse rounded-sm bg-[#2A2A2B]" />
          <div className="mb-8 h-4 w-64 animate-pulse rounded-sm bg-[#1C1B1C]" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-sm bg-[#1C1B1C]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isHealthy = health?.overall === "healthy";
  const isDegraded = health?.overall === "degraded";

  return (
    <div className="min-h-screen bg-[#131314]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "System Health" }]} />

        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-headline text-5xl font-extrabold uppercase tracking-tighter text-[#E5E2E3] md:text-7xl">
              NETWORK<br />STATUS
            </h1>

            {/* Status Badge */}
            <div className="mt-4 flex items-center gap-3">
              <div
                className={`inline-flex items-center gap-2 rounded-sm px-3 py-1.5 font-label text-xs uppercase tracking-widest ${
                  isHealthy
                    ? "bg-[#34511B] text-[#AED18D]"
                    : isDegraded
                    ? "bg-[hsl(0_100%_29%/0.5)] text-[#FFB4AB]"
                    : "bg-[hsl(0_100%_29%/0.8)] text-[#FFB4AB]"
                }`}
              >
                {isHealthy ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                {isHealthy ? "HEALTHY" : isDegraded ? "DEGRADED" : "UNHEALTHY"}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* Recheck Button */}
            <button
              onClick={() => checkHealth(true)}
              disabled={checking}
              className="ghost-border inline-flex items-center gap-2 rounded-sm px-4 py-2.5 font-headline text-sm font-bold uppercase tracking-widest text-[#E5E2E3] transition-colors hover:bg-[#3A393A] disabled:opacity-40"
            >
              <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
              Recheck Infrastructure
            </button>

            {/* Last Check */}
            {lastChecked && (
              <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                Last checked: {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* 3-Column Service Cards */}
        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {health?.services.map((service) => {
            const ServiceIcon = serviceIcons[service.service] || Server;
            const serviceHealthy = service.status === "healthy";

            return (
              <div
                key={service.service}
                className="ghost-border rounded-sm bg-[#1C1B1C] p-6"
              >
                {/* Service Header */}
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ServiceIcon className="h-5 w-5 text-[#E5E2E3]" />
                    <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-[#E5E2E3]">
                      {service.service}
                    </h3>
                  </div>
                  {serviceHealthy ? (
                    <CheckCircle2 className="h-5 w-5 text-[#AED18D]" />
                  ) : (
                    <XCircle className="h-5 w-5 text-[#FFB4AB]" />
                  )}
                </div>

                {/* Latency */}
                {service.latency !== undefined && (
                  <div className="mb-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                        Latency
                      </span>
                      <span className="font-label text-xs text-[#E5E2E3]">
                        {service.latency}ms
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#0E0E0F]">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (service.latency / 500) * 100)}%`,
                          backgroundColor: service.latency < 100 ? "#AED18D" : service.latency < 300 ? "#FFB3AE" : "#FFB4AB",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="mb-4 flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      serviceHealthy ? "bg-[#AED18D]" : "bg-[#FFB4AB]"
                    }`}
                  />
                  <span className="font-body text-sm text-[#E3BEBB]">
                    {serviceHealthy ? "Operational" : "Unreachable"}
                  </span>
                </div>

                {/* Endpoint URL */}
                {service.url && (
                  <code className="block font-label text-xs text-[#FFB3AE] truncate overflow-hidden" title={service.url}>
                    {service.url}
                  </code>
                )}

                {/* Error Message */}
                {service.message && !serviceHealthy && (
                  <div className="mt-3 rounded-sm bg-[hsl(0_100%_29%/0.3)] px-3 py-2">
                    <p className="font-body text-xs text-[#FFB4AB]">
                      {service.message}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contract Deployment */}
        <div className="ghost-border mb-10 rounded-sm bg-[#1C1B1C] p-6 md:p-8">
          <h2 className="mb-6 font-headline text-lg font-bold uppercase tracking-widest text-[#E5E2E3]">
            Contract Deployment
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Registry Address */}
            <div>
              <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                Registry Address
              </span>
              <div className="mt-1 flex items-center gap-2">
                <code className="break-all font-label text-sm text-[#FFB3AE]">
                  {health?.contract.address}
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

            {/* Chain ID */}
            <div className="text-center">
              <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                Chain ID
              </span>
              <p className="mt-1 font-headline text-4xl font-extrabold text-[#E5E2E3]">
                {health?.contract.chainId}
              </p>
              <p className="mt-0.5 font-body text-xs text-[#AA8986]">
                Hardhat Localhost
              </p>
            </div>

            {/* Deployment Status */}
            <div className="text-right">
              <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                Status
              </span>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-sm px-3 py-1.5 font-label text-xs uppercase tracking-widest ${
                    health?.contract.deployed
                      ? "bg-[#34511B] text-[#AED18D]"
                      : "bg-[hsl(0_100%_29%/0.8)] text-[#FFB4AB]"
                  }`}
                >
                  {health?.contract.deployed ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {health?.contract.deployed ? "Deployed" : "Not Deployed"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting (shown when unhealthy) */}
        {health && health.overall !== "healthy" && (
          <div className="mb-10">
            <h2 className="mb-6 font-headline text-lg font-bold uppercase tracking-widest text-[#E5E2E3]">
              Troubleshooting
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {health.services
                .filter((s) => s.status !== "healthy")
                .map((service) => (
                  <div
                    key={service.service}
                    className="ghost-border rounded-sm bg-[#1C1B1C] p-6"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-[#FFB4AB]" />
                      <h3 className="font-headline text-sm font-bold text-[#E5E2E3]">
                        {service.service}
                      </h3>
                    </div>
                    <p className="mb-4 font-body text-xs text-[#AA8986]">
                      {service.message}
                    </p>
                    <div className="space-y-2 border-t border-[hsl(3_24%_30%/0.15)] pt-3">
                      <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                        Try these fixes
                      </span>
                      <ul className="space-y-1.5">
                        {troubleshootingTips[service.service]?.map((tip, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 font-body text-xs text-[#E3BEBB]"
                          >
                            <span className="mt-0.5 text-[#FFB3AE]">-</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-6 ghost-border flex items-start gap-3 rounded-sm bg-[#1C1B1C] px-5 py-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FFB3AE]" />
              <div>
                <p className="font-headline text-sm font-bold text-[#E5E2E3]">Need Help?</p>
                <p className="mt-1 font-body text-xs text-[#E3BEBB]">
                  If services still don&apos;t work after trying the above steps, try
                  running{" "}
                  <code className="rounded-sm bg-[#0E0E0F] px-1.5 py-0.5 font-label text-xs text-[#FFB3AE]">
                    pnpm reset
                  </code>{" "}
                  to reset and redeploy everything.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Documentation Links */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a
            href={process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || "http://127.0.0.1:8080"}
            target="_blank"
            rel="noopener noreferrer"
            className="ghost-border group rounded-sm bg-[#1C1B1C] p-6 transition-colors hover:bg-[#201F20]"
          >
            <FileText className="mb-3 h-5 w-5 text-[#FFB3AE]" />
            <h3 className="font-headline text-sm font-bold text-[#E5E2E3]">
              API Docs
            </h3>
            <p className="mt-1 font-body text-xs text-[#AA8986]">
              IPFS Gateway & API reference
            </p>
            <ExternalLink className="mt-3 h-3.5 w-3.5 text-[#5A403E] transition-colors group-hover:text-[#FFB3AE]" />
          </a>

          <Link
            href="/how-it-works"
            className="ghost-border group rounded-sm bg-[#1C1B1C] p-6 transition-colors hover:bg-[#201F20]"
          >
            <Globe className="mb-3 h-5 w-5 text-[#AED18D]" />
            <h3 className="font-headline text-sm font-bold text-[#E5E2E3]">
              Explorer
            </h3>
            <p className="mt-1 font-body text-xs text-[#AA8986]">
              Architecture & how it works
            </p>
            <ExternalLink className="mt-3 h-3.5 w-3.5 text-[#5A403E] transition-colors group-hover:text-[#AED18D]" />
          </Link>

          <Link
            href="/"
            className="ghost-border group rounded-sm bg-[#1C1B1C] p-6 transition-colors hover:bg-[#201F20]"
          >
            <Bug className="mb-3 h-5 w-5 text-[#E3BEBB]" />
            <h3 className="font-headline text-sm font-bold text-[#E5E2E3]">
              Report Issue
            </h3>
            <p className="mt-1 font-body text-xs text-[#AA8986]">
              Submit a bug or request feature
            </p>
            <ExternalLink className="mt-3 h-3.5 w-3.5 text-[#5A403E] transition-colors group-hover:text-[#E3BEBB]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
