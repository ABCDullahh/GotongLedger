"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer aria-label="Site footer" className="w-full py-16 px-6 md:px-10 border-t border-[#2A2A2B]/50 tonal-shift mt-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-screen-2xl mx-auto">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="text-lg font-black text-white font-headline mb-4 uppercase">
            GotongLedger
          </div>
          <p className="font-body text-xs text-slate-500 leading-relaxed max-w-[250px] mb-6">
            Built for Radical Transparency. Tracking the heartbeat of the
            decentralized oracle network in real-time.
          </p>
          <p className="font-label text-xs tracking-widest uppercase text-slate-500">
            &copy; {new Date().getFullYear()} GotongLedger.
          </p>
        </div>

        {/* Navigation */}
        <div className="md:col-span-1">
          <h4 className="font-headline text-xs font-bold uppercase tracking-widest text-white mb-6">
            Platform
          </h4>
          <ul className="space-y-4">
            <li>
              <Link
                href="/"
                className="font-label text-xs tracking-widest uppercase text-slate-500 hover:text-primary transition-colors"
              >
                Campaigns
              </Link>
            </li>
            <li>
              <Link
                href="/how-it-works"
                className="font-label text-xs tracking-widest uppercase text-slate-500 hover:text-primary transition-colors"
              >
                How It Works
              </Link>
            </li>
            <li>
              <Link
                href="/analytics"
                className="font-label text-xs tracking-widest uppercase text-slate-500 hover:text-primary transition-colors"
              >
                Analytics
              </Link>
            </li>
            <li>
              <Link
                href="/health"
                className="font-label text-xs tracking-widest uppercase text-slate-500 hover:text-primary transition-colors"
              >
                System Health
              </Link>
            </li>
          </ul>
        </div>

        {/* Developer */}
        <div className="md:col-span-1">
          <h4 className="font-headline text-xs font-bold uppercase tracking-widest text-white mb-6">
            Developer
          </h4>
          <ul className="space-y-4">
            <li>
              <a
                href="http://127.0.0.1:8080/ipfs/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-label text-xs tracking-widest uppercase text-slate-500 hover:text-primary transition-colors"
              >
                IPFS Gateway
              </a>
            </li>
            <li>
              <Link
                href="/admin"
                className="font-label text-xs tracking-widest uppercase text-slate-500 hover:text-primary transition-colors"
              >
                Admin Panel
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
