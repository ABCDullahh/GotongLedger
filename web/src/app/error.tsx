"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-container-low ghost-border rounded-sm p-8">
        <div className="text-center mb-6">
          <div className="mx-auto mb-6 h-16 w-16 rounded-sm bg-destructive-container/20 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-headline font-bold text-on-surface">
            Something went wrong
          </h2>
        </div>

        <div className="space-y-4">
          <p className="text-center text-sm font-body text-outline">
            An error occurred while loading this page. This might be due to a
            network issue or the blockchain not being available.
          </p>

          <div className="bg-surface-container-highest p-4 rounded-sm">
            <p className="text-sm font-label text-on-surface-variant break-all">
              {error.message || "Unknown error"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="bg-primary-container text-on-primary-container px-6 py-3 rounded-sm font-headline text-xs uppercase tracking-widest font-bold hover:brightness-110 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            <Link
              href="/"
              className="ghost-border bg-transparent text-on-surface px-6 py-3 rounded-sm font-headline text-xs uppercase tracking-widest font-bold hover:bg-surface-bright transition-all inline-flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </div>

          <p className="text-[10px] text-center font-label tracking-widest uppercase text-outline">
            Make sure pnpm dev is running and all services are up
          </p>
        </div>
      </div>
    </div>
  );
}
