"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wallet, LogOut, ChevronDown, Menu, X } from "lucide-react";
import { formatAddress } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Explore" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/health", label: "Reports" },
  { href: "/analytics", label: "Analytics" },
  { href: "/admin", label: "Admin" },
];

// Wallet connector display names & icons
function getConnectorLabel(id: string): string {
  if (id === "injected" || id === "io.metamask") return "MetaMask";
  if (id === "walletConnect") return "WalletConnect";
  if (id === "coinbaseWalletSDK") return "Coinbase Wallet";
  return id;
}

export function Navbar() {
  const { address, isConnected, chain, connector } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const pathname = usePathname();

  const expectedChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ENV === "sepolia" ? 11155111 : 31337);
  const isWrongNetwork = isConnected && chain?.id !== expectedChainId;

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav aria-label="Main navigation" className="fixed top-0 w-full z-50 bg-[#131314]/80 backdrop-blur-xl border-b border-[#2A2A2B]/50 shadow-2xl shadow-black/20">
      <div className="flex justify-between items-center w-full px-6 md:px-10 h-20 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-black tracking-tighter text-primary font-headline"
        >
          GotongLedger
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "font-headline tracking-tight text-sm uppercase transition-colors",
                isActiveLink(link.href)
                  ? "text-primary border-b-2 border-primary-container pb-1"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {isWrongNetwork && (
            <Badge className="bg-destructive-container text-destructive font-label text-[10px] uppercase tracking-widest hidden sm:flex">
              Wrong Network
            </Badge>
          )}

          {isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 ghost-border px-4 py-2 rounded-sm font-label text-sm text-on-surface-variant hover:bg-surface-bright transition-all">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="hidden sm:inline">
                    {formatAddress(address || "")}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-surface-container-high border-outline-variant/20"
              >
                <DropdownMenuItem className="font-label text-[10px] text-outline uppercase tracking-widest">
                  {connector ? getConnectorLabel(connector.id) : "Wallet"}
                </DropdownMenuItem>
                <DropdownMenuItem className="font-label text-xs text-on-surface break-all">
                  {address}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-outline-variant/20" />
                <DropdownMenuItem
                  onClick={() => disconnect()}
                  className="text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu open={walletMenuOpen} onOpenChange={setWalletMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={isPending}
                  className="bg-primary-container text-on-primary-container px-6 py-2 rounded-sm font-headline text-xs uppercase tracking-widest font-bold hover:brightness-110 active:scale-95 transition-all duration-300 disabled:opacity-50"
                >
                  {isPending ? "Connecting..." : "Connect Wallet"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 bg-surface-container-high border-outline-variant/20 p-2"
              >
                <p className="px-2 py-1.5 font-label text-[10px] uppercase tracking-[0.2em] text-outline">
                  Select Wallet
                </p>
                {connectors.map((c) => (
                  <DropdownMenuItem
                    key={c.uid}
                    onClick={() => {
                      connect({ connector: c });
                      setWalletMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-surface-bright rounded-sm"
                  >
                    <div className="w-8 h-8 rounded-sm bg-surface-container-highest flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-headline text-sm font-bold text-on-surface">
                        {getConnectorLabel(c.id)}
                      </p>
                      <p className="font-label text-[10px] text-outline">
                        {c.id === "injected" || c.id === "io.metamask"
                          ? "Browser Extension"
                          : c.id === "walletConnect"
                          ? "Scan QR Code"
                          : "Mobile & Extension"}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-slate-400 hover:text-white p-2 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-[#2A2A2B]/50 bg-[#131314]/95 backdrop-blur-xl"
          >
            <div className="flex flex-col gap-1 py-4 px-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-3 font-headline text-sm uppercase tracking-widest rounded-sm transition-colors",
                    isActiveLink(link.href)
                      ? "text-primary bg-surface-container-high"
                      : "text-slate-400 hover:text-white hover:bg-surface-container-high/50"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
