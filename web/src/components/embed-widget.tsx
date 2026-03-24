"use client";

import { useState } from "react";
import { Copy, Check, Code2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface EmbedWidgetProps {
  campaignId: number;
  campaignTitle: string;
}

export function EmbedWidget({ campaignId, campaignTitle }: EmbedWidgetProps) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const getEmbedUrl = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/embed/${campaignId}`;
  };

  const getEmbedCode = () => {
    const url = getEmbedUrl();
    return `<iframe
  src="${url}"
  width="400"
  height="220"
  frameborder="0"
  style="border: none; border-radius: 4px; overflow: hidden;"
  title="${campaignTitle} - GotongLedger"
  allow="clipboard-write"
></iframe>`;
  };

  const handleCopy = async () => {
    const code = getEmbedCode();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Embed code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      toast.success("Embed code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-surface-container-low ghost-border rounded-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Code2 className="h-4 w-4 text-primary" />
          <h3 className="font-headline font-bold text-sm uppercase tracking-widest text-on-surface">
            Embed Widget
          </h3>
        </div>
        <a
          href={getEmbedUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-label text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors"
        >
          Preview
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Description */}
      <p className="font-body text-sm text-on-surface-variant/70 leading-relaxed">
        Embed this campaign widget on your website or blog. Visitors can view
        progress and donate directly.
      </p>

      {/* Code block */}
      <div className="relative">
        <pre className="bg-surface-container-highest p-4 rounded-sm overflow-x-auto no-scrollbar">
          <code className="font-label text-xs text-on-surface-variant leading-relaxed whitespace-pre">
            {getEmbedCode()}
          </code>
        </pre>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high ghost-border rounded-sm font-label text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-secondary" />
              <span className="text-secondary">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Preview toggle */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="w-full ghost-border rounded-sm px-4 py-2.5 font-label text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all text-center"
      >
        {showPreview ? "Hide Preview" : "Show Preview"}
      </button>

      {/* Inline Preview */}
      {showPreview && (
        <div className="space-y-3">
          <p className="font-label text-[10px] uppercase tracking-[0.15em] text-outline">
            Widget Preview
          </p>
          <div className="bg-surface-container-highest rounded-sm p-4 flex items-center justify-center">
            <iframe
              src={getEmbedUrl()}
              width="400"
              height="220"
              style={{
                border: "none",
                borderRadius: "4px",
                overflow: "hidden",
                maxWidth: "100%",
              }}
              title={`${campaignTitle} - GotongLedger Widget Preview`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
