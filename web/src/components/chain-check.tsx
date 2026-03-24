"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export function ChainCheck() {
  const [chainReset, setChainReset] = useState(false);

  useEffect(() => {
    const checkChain = async () => {
      try {
        // Dynamic import to handle the case when contracts.ts doesn't exist
        let contractAddress = "";
        let chainId = 31337;
        let genesisHash = "";

        try {
          const contracts = await import("@/lib/contracts");
          contractAddress = contracts.CAMPAIGN_LEDGER_ADDRESS;
          chainId = contracts.CHAIN_ID;
          genesisHash = contracts.GENESIS_HASH;
        } catch {
          // Contracts not deployed yet
          return;
        }

        if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
          return;
        }

        const res = await fetch("/api/chain-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contractAddress, chainId, genesisHash }),
        });

        const data = await res.json();

        if (data.wasReset) {
          setChainReset(true);
          toast.warning("Local chain was reset - cached data has been cleared", {
            duration: 5000,
          });

          // Clear after showing
          setTimeout(() => setChainReset(false), 5000);
        }
      } catch (error) {
        console.error("Chain check failed:", error);
      }
    };

    checkChain();
  }, []);

  if (!chainReset) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Chain Reset Detected</AlertTitle>
        <AlertDescription>
          The local blockchain was reset. Cached campaign data has been cleared.
          Please refresh to see the latest state.
        </AlertDescription>
      </Alert>
    </div>
  );
}
