"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Link2, Check, X as XIcon } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
  campaignId: number;
  title: string;
  raised?: string;
  donors?: number;
}

export function ShareButton({ campaignId, title, raised, donors }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const getCampaignUrl = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/campaign/${campaignId}`;
  };

  const handleCopyLink = async () => {
    const url = getCampaignUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Campaign link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      toast.success("Campaign link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareTwitter = () => {
    const url = getCampaignUrl();
    const raisedText = raised ? ` | ${raised} ETH raised` : "";
    const donorsText = donors ? ` from ${donors} donor${donors !== 1 ? "s" : ""}` : "";
    const text = `Check out "${title}" on GotongLedger${raisedText}${donorsText}. Every cent tracked on-chain.`;

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer,width=550,height=420");
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 ghost-border px-4 py-2.5 rounded-sm font-label text-xs uppercase tracking-[0.2em] text-on-surface hover:bg-surface-container-high transition-colors"
        aria-label="Share campaign"
        aria-expanded={isOpen}
      >
        <Share2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Share</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 z-50 bg-surface-container-high border border-outline-variant/20 rounded-sm shadow-2xl shadow-black/40 overflow-hidden animate-in">
          {/* Header */}
          <div className="px-4 py-3 border-b border-outline-variant/15">
            <p className="font-label text-[10px] uppercase tracking-[0.2em] text-outline">
              Share Campaign
            </p>
          </div>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-bright transition-colors group"
          >
            <div className="w-8 h-8 rounded-sm bg-surface-container-highest flex items-center justify-center flex-shrink-0">
              {copied ? (
                <Check className="h-4 w-4 text-secondary" />
              ) : (
                <Link2 className="h-4 w-4 text-primary group-hover:text-primary" />
              )}
            </div>
            <div>
              <p className="font-headline text-sm font-bold text-on-surface">
                {copied ? "Copied!" : "Copy Link"}
              </p>
              <p className="font-label text-[10px] text-outline">
                Share via URL
              </p>
            </div>
          </button>

          {/* Separator */}
          <div className="h-px bg-outline-variant/15" />

          {/* Twitter/X */}
          <button
            onClick={handleShareTwitter}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-bright transition-colors group"
          >
            <div className="w-8 h-8 rounded-sm bg-surface-container-highest flex items-center justify-center flex-shrink-0">
              <XIcon className="h-4 w-4 text-on-surface-variant group-hover:text-primary" />
            </div>
            <div>
              <p className="font-headline text-sm font-bold text-on-surface">
                Share on X
              </p>
              <p className="font-label text-[10px] text-outline">
                Post to Twitter/X
              </p>
            </div>
          </button>

          {/* OG Preview hint */}
          <div className="px-4 py-3 border-t border-outline-variant/15 bg-surface-container-lowest/50">
            <p className="font-label text-[10px] text-outline leading-relaxed">
              Shared links will display a rich preview card with campaign stats.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
