"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Loader2, FileWarning } from "lucide-react";

interface ProofBadgeProps {
  cid: string;
  compact?: boolean;
}

type VerifyStatus = "loading" | "verified" | "unverified" | "no-cid";

export function ProofBadge({ cid, compact = false }: ProofBadgeProps) {
  const [status, setStatus] = useState<VerifyStatus>(
    !cid || cid.trim() === "" ? "no-cid" : "loading"
  );

  useEffect(() => {
    if (!cid || cid.trim() === "") {
      setStatus("no-cid");
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        const res = await fetch(`/api/ipfs/verify?cid=${encodeURIComponent(cid)}`);
        const data = await res.json();

        if (!cancelled) {
          setStatus(data.verified ? "verified" : "unverified");
        }
      } catch {
        if (!cancelled) {
          setStatus("unverified");
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [cid]);

  const config: Record<
    VerifyStatus,
    {
      icon: React.ReactNode;
      label: string;
      className: string;
    }
  > = {
    loading: {
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
      label: "Checking",
      className: "text-outline",
    },
    verified: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: "Verified",
      className: "text-secondary",
    },
    unverified: {
      icon: <FileWarning className="h-3.5 w-3.5" />,
      label: "Unverified",
      className: "text-destructive",
    },
    "no-cid": {
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      label: "No Proof",
      className: "text-outline",
    },
  };

  const { icon, label, className } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-label text-[10px] uppercase tracking-widest ${className}`}
      title={status === "verified" ? `CID: ${cid}` : label}
    >
      {icon}
      {!compact && <span className="hidden sm:inline">{label}</span>}
    </span>
  );
}
