"use client";

import { useEffect, useRef } from "react";
import { getDonationLogs, type DonationReceivedEvent } from "@/lib/blockchain";
import { formatAddress, formatEther } from "@/lib/utils";
import { toast } from "sonner";

const POLL_INTERVAL = 15_000; // 15 seconds

interface DonationNotifierProps {
  campaignId?: number;
  enabled?: boolean;
}

export function DonationNotifier({
  campaignId,
  enabled = true,
}: DonationNotifierProps) {
  const seenTxHashes = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!enabled) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    async function poll() {
      if (cancelled) return;

      try {
        const donations = await getDonationLogs(
          campaignId !== undefined ? BigInt(campaignId) : undefined
        );

        if (isFirstLoad.current) {
          // First load: seed the set with existing donations, don't notify
          for (const donation of donations) {
            seenTxHashes.current.add(donation.transactionHash);
          }
          isFirstLoad.current = false;
        } else {
          // Subsequent polls: notify for new donations
          for (const donation of donations) {
            if (!seenTxHashes.current.has(donation.transactionHash)) {
              seenTxHashes.current.add(donation.transactionHash);
              notifyDonation(donation);
            }
          }
        }
      } catch (error) {
        // Silently ignore errors — blockchain may be unavailable
        console.error("[DonationNotifier] Poll failed:", error);
      }

      if (!cancelled) {
        timeoutId = setTimeout(poll, POLL_INTERVAL);
      }
    }

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [campaignId, enabled]);

  return null;
}

function notifyDonation(donation: DonationReceivedEvent) {
  const donor = formatAddress(donation.from);
  const amount = formatEther(donation.amountWei);
  const campaign = Number(donation.campaignId);

  toast(`New Donation! ${donor} donated ${amount} ETH to Campaign #${campaign}`, {
    className:
      "bg-surface-container-high text-on-surface ghost-border",
    duration: 6000,
  });
}
