"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Activity,
} from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { getTransactionReceipt } from "@/lib/blockchain";
import { formatAddress } from "@/lib/utils";
import type { TransactionReceipt, Transaction } from "viem";

interface PageProps {
  params: { hash: string };
}

export default function ExplorerPage({ params }: PageProps) {
  const { hash } = params;

  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);
  const [tx, setTx] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const fetchTx = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!hash || !hash.startsWith("0x") || hash.length !== 66) {
          setError("Invalid transaction hash format");
          return;
        }

        const result = await getTransactionReceipt(hash as `0x${string}`);

        if (!result) {
          setError("Transaction not found or still pending");
          return;
        }

        setReceipt(result.receipt);
        setTx(result.tx);
      } catch (err) {
        console.error("Failed to fetch transaction:", err);
        setError("Failed to fetch transaction. Is the blockchain running?");
      } finally {
        setLoading(false);
      }
    };

    fetchTx();
  }, [hash]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ text, label }: { text: string; label: string }) => (
    <button
      onClick={() => copyToClipboard(text, label)}
      className="shrink-0 rounded-sm p-1.5 transition-colors hover:bg-[#2A2A2B]"
      aria-label={copied === label ? `${label} copied` : `Copy ${label}`}
    >
      {copied === label ? (
        <Check className="h-3.5 w-3.5 text-[#AED18D]" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-[#AA8986]" />
      )}
    </button>
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#131314]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 h-4 w-48 animate-pulse rounded-sm bg-[#2A2A2B]" />
          <div className="mb-4 h-12 w-80 animate-pulse rounded-sm bg-[#2A2A2B]" />
          <div className="space-y-4">
            <div className="h-32 animate-pulse rounded-sm bg-[#1C1B1C]" />
            <div className="h-48 animate-pulse rounded-sm bg-[#1C1B1C]" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#131314]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Explorer", href: "/" },
              { label: "Transaction" },
            ]}
          />

          <div className="ghost-border mt-8 rounded-sm bg-[#1C1B1C] py-16 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-[#FFB4AB]" />
            <h2 className="font-headline text-2xl font-bold text-[#E5E2E3]">
              Transaction Not Found
            </h2>
            <p className="mt-2 font-body text-sm text-[#E3BEBB]">{error}</p>
            <code className="mx-auto mt-4 block max-w-lg break-all rounded-sm bg-[#0E0E0F] p-3 font-label text-xs text-[#AA8986]">
              {hash}
            </code>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-sm bg-[#FF5555] px-5 py-2.5 font-headline text-sm font-bold uppercase tracking-widest text-[#131314] transition-colors hover:bg-[#FFB3AE]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = receipt?.status === "success";
  const gasUsed = receipt?.gasUsed || 0n;
  const gasPrice = tx?.gasPrice || 0n;
  const gasCost = gasUsed * gasPrice;
  const gasLimit = tx?.gas || 0n;
  const gasUsedPercent = gasLimit > 0n ? Number((gasUsed * 100n) / gasLimit) : 0;

  return (
    <div className="min-h-screen bg-[#131314]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumbs + Badge */}
        <div className="mb-6 flex items-center gap-3">
          <Breadcrumbs
            items={[
              { label: "Explorer", href: "/" },
              { label: `Tx ${formatAddress(hash)}` },
            ]}
          />
        </div>

        {/* Title Row */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-3">
            <span className="ghost-border inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-label text-[10px] uppercase tracking-[0.2em] text-[#E3BEBB]">
              <Activity className="h-3 w-3 text-[#FFB3AE]" />
              Network Protocol
            </span>
          </div>

          <h1 className="font-headline text-4xl font-extrabold uppercase tracking-tighter text-[#E5E2E3] md:text-5xl">
            TRANSACTION DETAILS
          </h1>

          {/* Timestamp */}
          <div className="text-right">
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
              Block #{receipt?.blockNumber?.toString() || "Pending"}
            </span>
          </div>
        </div>

        {/* 12-col Grid: Sidebar + Main */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT SIDEBAR (3 cols) */}
          <div className="lg:col-span-3">
            <div className="ghost-border rounded-sm bg-[#1C1B1C] p-5">
              <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                Status
              </span>
              <div className="mt-2 flex items-center gap-2">
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-[#AED18D]" />
                    <span className="font-headline text-sm font-bold text-[#AED18D]">
                      Success
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-[#FFB4AB]" />
                    <span className="font-headline text-sm font-bold text-[#FFB4AB]">
                      Failed
                    </span>
                  </>
                )}
              </div>

              <div className="my-4 border-t border-[hsl(3_24%_30%/0.15)]" />

              <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                Block Number
              </span>
              <p className="mt-1 font-headline text-2xl font-extrabold text-[#FFB3AE]">
                {receipt?.blockNumber?.toString() || "Pending"}
              </p>

              <div className="my-4 border-t border-[hsl(3_24%_30%/0.15)]" />

              <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                Network Load
              </span>
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-label text-xs text-[#E3BEBB]">
                    Gas Usage
                  </span>
                  <span className="font-label text-xs text-[#E5E2E3]">
                    {gasUsedPercent}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#0E0E0F]">
                  <div
                    className="h-1.5 rounded-full bg-[#FFB3AE] transition-all"
                    style={{ width: `${Math.min(100, gasUsedPercent)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT (9 cols) */}
          <div className="space-y-4 lg:col-span-9">
            {/* Transaction Hash */}
            <div className="ghost-border rounded-sm bg-[#1C1B1C] p-6">
              <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                Transaction Hash
              </span>
              <div className="mt-2 flex items-center gap-3">
                <code className="flex-1 break-all font-label text-lg text-[#E5E2E3]">
                  {hash}
                </code>
                <CopyBtn text={hash} label="hash" />
              </div>
            </div>

            {/* From / To */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
              {/* From */}
              <div className="ghost-border rounded-sm bg-[#1C1B1C] p-6">
                <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                  From
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 break-all font-label text-sm text-[#FFB3AE]">
                    {tx?.from}
                  </code>
                  <CopyBtn text={tx?.from || ""} label="from" />
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <div className="ghost-border flex h-10 w-10 items-center justify-center rounded-full bg-[#0E0E0F]">
                  <ArrowRight className="h-4 w-4 text-[#AA8986]" />
                </div>
              </div>

              {/* To */}
              <div className="ghost-border rounded-sm bg-[#1C1B1C] p-6">
                <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                  To
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 break-all font-label text-sm text-[#AED18D]">
                    {tx?.to || "Contract Creation"}
                  </code>
                  {tx?.to && <CopyBtn text={tx.to} label="to" />}
                </div>
              </div>
            </div>

            {/* Gas Info - 3-column Bento Grid */}
            <div className="grid grid-cols-1 gap-4 rounded-sm bg-[#0E0E0F] p-4 md:grid-cols-3">
              {/* Gas Used */}
              <div className="rounded-sm bg-[#1C1B1C] p-5">
                <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                  Gas Used
                </span>
                <p className="mt-2 font-headline text-xl font-bold text-[#E5E2E3]">
                  {gasUsed.toLocaleString()}
                </p>
                {/* Gas used progress bar */}
                <div className="mt-3">
                  <div className="h-1 w-full rounded-full bg-[#0E0E0F]">
                    <div
                      className="h-1 rounded-full bg-[#FFB3AE] transition-all"
                      style={{ width: `${Math.min(100, gasUsedPercent)}%` }}
                    />
                  </div>
                  <p className="mt-1 font-label text-[10px] text-[#AA8986]">
                    {gasUsedPercent}% of limit
                  </p>
                </div>
              </div>

              {/* Gas Price */}
              <div className="rounded-sm bg-[#1C1B1C] p-5">
                <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                  Gas Price
                </span>
                <p className="mt-2 font-headline text-xl font-bold text-[#E5E2E3]">
                  {(Number(gasPrice) / 1e9).toFixed(2)}
                </p>
                <p className="mt-1 font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                  Gwei
                </p>
              </div>

              {/* Total Cost */}
              <div className="rounded-sm bg-[#1C1B1C] p-5">
                <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                  Total Cost
                </span>
                <p className="mt-2 font-headline text-xl font-bold text-[#FFB3AE]">
                  {(Number(gasCost) / 1e18).toFixed(6)}
                </p>
                <p className="mt-1 font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                  ETH
                </p>
              </div>
            </div>

            {/* Event Logs */}
            {receipt?.logs && receipt.logs.length > 0 && (
              <div className="ghost-border rounded-sm bg-[#1C1B1C] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#FFB3AE]" />
                    <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-[#E5E2E3]">
                      Event Logs
                    </h3>
                  </div>
                  <span className="ghost-border rounded-sm px-2.5 py-1 font-label text-[10px] uppercase tracking-[0.2em] text-[#E3BEBB]">
                    {receipt.logs.length} {receipt.logs.length === 1 ? "Event" : "Events"}
                  </span>
                </div>

                <div className="space-y-4">
                  {receipt.logs.map((log, index) => (
                    <div
                      key={index}
                      className="rounded-sm bg-[#0E0E0F] p-4"
                    >
                      {/* Log header */}
                      <div className="mb-3 flex items-center gap-3">
                        <span className="ghost-border inline-flex items-center justify-center rounded-sm px-2 py-0.5 font-label text-[10px] uppercase tracking-[0.2em] text-[#FFB3AE]">
                          Log #{index}
                        </span>
                        <code className="font-label text-xs text-[#AA8986]">
                          {formatAddress(log.address)}
                        </code>
                      </div>

                      {/* Topics */}
                      {log.topics && log.topics.length > 0 && (
                        <div className="mb-3">
                          <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                            Topics
                          </span>
                          <div className="mt-1.5 space-y-1">
                            {log.topics.map((topic, tIndex) => (
                              <div
                                key={tIndex}
                                className="rounded-sm bg-[#353436] px-3 py-1.5"
                              >
                                <code className="break-all font-label text-xs text-[#E3BEBB]">
                                  <span className="text-[#AA8986]">[{tIndex}]</span>{" "}
                                  {topic}
                                </code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Data */}
                      {log.data && log.data !== "0x" && (
                        <div>
                          <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986]">
                            Data
                          </span>
                          <div className="mt-1.5 max-h-24 overflow-auto rounded-sm bg-[#353436] px-3 py-2">
                            <code className="break-all font-label text-xs text-[#E3BEBB]">
                              {log.data}
                            </code>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="flex justify-center pt-4">
              <Link
                href="/"
                className="ghost-border inline-flex items-center gap-2 rounded-sm px-6 py-3 font-headline text-sm font-bold uppercase tracking-widest text-[#E5E2E3] transition-colors hover:bg-[#3A393A]"
              >
                Back to Campaigns
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
