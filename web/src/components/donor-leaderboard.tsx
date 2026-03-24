"use client";

import { useMemo } from "react";
import { Trophy } from "lucide-react";
import { formatAddress, formatEther } from "@/lib/utils";
import type { DonationReceivedEvent } from "@/lib/blockchain";

interface DonorLeaderboardProps {
  donations: DonationReceivedEvent[];
  limit?: number;
}

interface AggregatedDonor {
  address: `0x${string}`;
  totalWei: bigint;
  count: number;
}

export function DonorLeaderboard({ donations, limit = 10 }: DonorLeaderboardProps) {
  const { topDonors, uniqueCount } = useMemo(() => {
    const donorMap = new Map<string, AggregatedDonor>();

    for (const donation of donations) {
      const key = donation.from.toLowerCase();
      const existing = donorMap.get(key);

      if (existing) {
        donorMap.set(key, {
          ...existing,
          totalWei: existing.totalWei + donation.amountWei,
          count: existing.count + 1,
        });
      } else {
        donorMap.set(key, {
          address: donation.from,
          totalWei: donation.amountWei,
          count: 1,
        });
      }
    }

    const sorted = Array.from(donorMap.values()).sort((a, b) => {
      if (a.totalWei > b.totalWei) return -1;
      if (a.totalWei < b.totalWei) return 1;
      return 0;
    });

    return {
      topDonors: sorted.slice(0, limit),
      uniqueCount: sorted.length,
    };
  }, [donations, limit]);

  if (donations.length === 0) {
    return (
      <div className="bg-surface-container-low ghost-border rounded-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-4 w-4 text-outline" />
          <h3 className="font-headline font-bold uppercase tracking-widest text-sm text-on-surface">
            Top Donors
          </h3>
        </div>
        <p className="font-label text-sm text-outline text-center py-8">
          No donations yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low ghost-border rounded-sm p-8">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-4 w-4 text-outline" />
        <h3 className="font-headline font-bold uppercase tracking-widest text-sm text-on-surface">
          Top Donors
        </h3>
      </div>

      <div className="space-y-0">
        {topDonors.map((donor, index) => {
          const rank = index + 1;

          return (
            <div
              key={donor.address}
              className="flex items-center gap-4 py-4 border-b border-outline-variant/10 last:border-b-0"
            >
              {/* Rank */}
              <span
                className={`font-headline text-lg font-bold w-8 shrink-0 ${
                  rank === 1
                    ? "text-primary"
                    : rank <= 3
                    ? "text-on-surface"
                    : "text-outline"
                }`}
              >
                #{rank}
              </span>

              {/* Address */}
              <span className="font-label text-sm text-on-surface">
                {formatAddress(donor.address)}
              </span>

              {/* Amount */}
              <span className="font-label text-sm font-bold text-secondary ml-auto">
                {formatEther(donor.totalWei)} ETH
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer: total unique donors */}
      <div className="mt-6 pt-4 border-t border-outline-variant/10">
        <p className="font-label text-[10px] uppercase tracking-[0.2em] text-[#AA8986] text-center">
          {uniqueCount} unique donor{uniqueCount !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
