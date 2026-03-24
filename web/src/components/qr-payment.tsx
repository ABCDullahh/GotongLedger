"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, ExternalLink, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { parseEther } from "viem";

interface QRPaymentProps {
  address: string;
  chainId?: number;
  campaignTitle?: string;
  suggestedAmounts?: number[];
  className?: string;
}

export function QRPayment({
  address,
  chainId = 31337,
  campaignTitle,
  suggestedAmounts = [0.01, 0.05, 0.1, 0.5],
  className,
}: QRPaymentProps) {
  const [amount, setAmount] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Generate EIP-681 payment URI
  // Format: ethereum:<address>[@chainId]?value=<wei>
  const generatePaymentURI = (amountEth?: string): string => {
    let uri = `ethereum:${address}`;

    // Add chain ID if not mainnet
    if (chainId && chainId !== 1) {
      uri += `@${chainId}`;
    }

    // Add value if specified
    if (amountEth && parseFloat(amountEth) > 0) {
      try {
        const valueWei = parseEther(amountEth);
        uri += `?value=${valueWei.toString()}`;
      } catch {
        // Invalid amount, skip value parameter
      }
    }

    return uri;
  };

  const paymentURI = generatePaymentURI(amount);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy address");
    }
  };

  const copyPaymentLink = async () => {
    try {
      await navigator.clipboard.writeText(paymentURI);
      toast.success("Payment link copied!");
    } catch {
      toast.error("Failed to copy payment link");
    }
  };

  const openInWallet = () => {
    // Try to open in wallet app (works on mobile)
    window.location.href = paymentURI;
  };

  const getNetworkName = (id: number): string => {
    const networks: Record<number, string> = {
      1: "Ethereum Mainnet",
      5: "Goerli Testnet",
      11155111: "Sepolia Testnet",
      137: "Polygon",
      80001: "Mumbai Testnet",
      31337: "Localhost (Hardhat)",
      1337: "Localhost",
    };
    return networks[id] || `Chain ${id}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Direct Payment
        </CardTitle>
        <CardDescription>
          Send ETH directly to {campaignTitle ? `"${campaignTitle}"` : "this campaign"} without connecting a wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-sm">
            <QRCodeSVG
              value={paymentURI}
              size={180}
              level="M"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
        </div>

        {/* Network Info */}
        <div className="text-center text-sm text-outline">
          Network: <span className="font-medium">{getNetworkName(chainId)}</span>
        </div>

        {/* Address Display */}
        <div className="space-y-2">
          <Label>Campaign Address</Label>
          <div className="flex gap-2">
            <code className="flex-1 px-4 py-3 bg-surface-container-highest rounded-sm text-xs font-label break-all text-on-surface">
              {address}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={copyAddress}
              className="shrink-0"
              aria-label={copied ? "Address copied" : "Copy campaign address"}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label>Amount (ETH) - Optional</Label>
          <Input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0"
          />
          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2">
            {suggestedAmounts.map((amt) => (
              <Button
                key={amt}
                variant={amount === amt.toString() ? "default" : "outline"}
                size="sm"
                onClick={() => setAmount(amt.toString())}
              >
                {amt} ETH
              </Button>
            ))}
            {amount && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAmount("")}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button onClick={openInWallet} className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Wallet App
          </Button>
          <Button variant="outline" onClick={copyPaymentLink} className="w-full">
            <Copy className="h-4 w-4 mr-2" />
            Copy Payment Link
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-outline space-y-1 border-t border-outline-variant/20 pt-4">
          <p className="font-medium">How to pay:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Scan QR code with your wallet app (MetaMask, Trust Wallet, etc.)</li>
            <li>Or copy the address and send ETH manually</li>
            <li>Or click &quot;Open in Wallet App&quot; on mobile</li>
          </ol>
          <p className="mt-2 text-primary">
            Make sure you&apos;re on the correct network: {getNetworkName(chainId)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for embedding in other components
export function QRPaymentCompact({
  address,
  chainId = 31337,
  size = 120,
}: {
  address: string;
  chainId?: number;
  size?: number;
}) {
  const [copied, setCopied] = useState(false);

  const paymentURI = `ethereum:${address}${chainId !== 1 ? `@${chainId}` : ""}`;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-2 rounded-sm">
        <QRCodeSVG
          value={paymentURI}
          size={size}
          level="M"
          includeMargin={false}
        />
      </div>
      <Button variant="outline" size="sm" onClick={copyAddress} aria-label={copied ? "Address copied" : "Copy address"}>
        {copied ? (
          <>
            <Check className="h-3 w-3 mr-1" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-3 w-3 mr-1" />
            Copy Address
          </>
        )}
      </Button>
    </div>
  );
}
