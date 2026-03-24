"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  Check,
  QrCode,
  Wallet,
  ArrowRight,
  AlertCircle,
  Smartphone,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { parseEther } from "viem";

interface DirectPaymentProps {
  treasuryAddress: string;
  campaignId: number;
  campaignTitle: string;
  chainId?: number;
  onConnectWallet?: () => void;
  isWalletConnected?: boolean;
}

export function DirectPayment({
  treasuryAddress,
  campaignId,
  campaignTitle,
  chainId = 31337,
  onConnectWallet,
  isWalletConnected = false,
}: DirectPaymentProps) {
  const [amount, setAmount] = useState<string>("0.1");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const suggestedAmounts = [0.01, 0.05, 0.1, 0.5, 1];

  // Generate EIP-681 payment URI
  const generatePaymentURI = (amountEth?: string): string => {
    let uri = `ethereum:${treasuryAddress}`;

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
      await navigator.clipboard.writeText(treasuryAddress);
      setCopiedAddress(true);
      toast.success("Address copied to clipboard!");
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch {
      toast.error("Failed to copy address");
    }
  };

  const copyPaymentLink = async () => {
    try {
      await navigator.clipboard.writeText(paymentURI);
      setCopiedLink(true);
      toast.success("Payment link copied!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy payment link");
    }
  };

  const openInWallet = () => {
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
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Donate to Campaign
            </CardTitle>
            <CardDescription className="mt-1">
              Choose your preferred payment method
            </CardDescription>
          </div>
          <Badge variant="outline">{getNetworkName(chainId)}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="qr" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="qr" className="flex items-center gap-1">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">QR Code</span>
            </TabsTrigger>
            <TabsTrigger value="direct" className="flex items-center gap-1">
              <ArrowRight className="h-4 w-4" />
              <span className="hidden sm:inline">Direct</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-1">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Wallet</span>
            </TabsTrigger>
          </TabsList>

          {/* QR Code Tab */}
          <TabsContent value="qr" className="space-y-4 mt-4">
            <div className="flex flex-col items-center">
              {/* QR Code */}
              <div className="relative p-6 bg-white/5 rounded-sm ghost-border">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-secondary/5 pointer-events-none rounded-sm"></div>
                <div className="relative bg-white p-3 rounded-sm">
                  <QRCodeSVG
                    value={paymentURI}
                    size={200}
                    level="M"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
              </div>

              <p className="font-label text-[10px] text-outline tracking-wider uppercase mt-3">
                Scan to pay directly
              </p>
            </div>

            {/* Amount Selection */}
            <div className="space-y-2">
              <Label>Amount (ETH)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  className="flex-1"
                />
              </div>
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
              </div>
            </div>

            {/* Mobile Action */}
            <div className="flex flex-col gap-2">
              <Button onClick={openInWallet} className="w-full">
                <Smartphone className="h-4 w-4 mr-2" />
                Open in Wallet App
              </Button>
              <Button variant="outline" onClick={copyPaymentLink} className="w-full">
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Payment Link
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Direct Transfer Tab */}
          <TabsContent value="direct" className="space-y-4 mt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Send ETH directly to the campaign treasury address from any wallet or exchange.
              </AlertDescription>
            </Alert>

            {/* Treasury Address */}
            <div className="space-y-2">
              <Label>Campaign Treasury Address</Label>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-3 bg-surface-container-highest rounded-sm">
                  <code className="text-sm font-label break-all text-on-surface">
                    {treasuryAddress}
                  </code>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyAddress}
                  className="shrink-0"
                  aria-label={copiedAddress ? "Address copied" : "Copy treasury address"}
                >
                  {copiedAddress ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Campaign Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-outline">Campaign</p>
                <p className="font-medium">{campaignTitle}</p>
              </div>
              <div>
                <p className="text-outline">Campaign ID</p>
                <p className="font-medium">#{campaignId}</p>
              </div>
              <div>
                <p className="text-outline">Network</p>
                <p className="font-medium">{getNetworkName(chainId)}</p>
              </div>
              <div>
                <p className="text-outline">Token</p>
                <p className="font-medium">ETH (Native)</p>
              </div>
            </div>

            <Separator />

            {/* Instructions */}
            <div className="space-y-2">
              <p className="text-sm font-medium">How to send:</p>
              <ol className="list-decimal list-inside text-sm text-outline space-y-1">
                <li>Copy the treasury address above</li>
                <li>Open your wallet (MetaMask, Trust Wallet, Coinbase, etc.)</li>
                <li>Make sure you&apos;re on {getNetworkName(chainId)}</li>
                <li>Send ETH to the copied address</li>
                <li>Your donation will appear in the campaign once confirmed</li>
              </ol>
            </div>

            <Button onClick={copyAddress} className="w-full">
              {copiedAddress ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  Address Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Treasury Address
                </>
              )}
            </Button>
          </TabsContent>

          {/* Connect Wallet Tab */}
          <TabsContent value="wallet" className="space-y-4 mt-4">
            {isWalletConnected ? (
              <Alert variant="success">
                <Check className="h-4 w-4 text-secondary" />
                <AlertDescription className="text-secondary">
                  Wallet connected! Use the donation form above to donate via smart contract.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert>
                  <Wallet className="h-4 w-4" />
                  <AlertDescription>
                    Connect your wallet to donate via smart contract with full on-chain tracking.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="text-sm space-y-2">
                    <p className="font-medium">Benefits of wallet connection:</p>
                    <ul className="list-disc list-inside text-outline space-y-1">
                      <li>Full on-chain transaction record</li>
                      <li>Automatic event logging</li>
                      <li>Donation appears in your wallet history</li>
                      <li>Verifiable proof of donation</li>
                    </ul>
                  </div>

                  {onConnectWallet && (
                    <Button onClick={onConnectWallet} className="w-full">
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect Wallet
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Quick comparison */}
            <div className="ghost-border rounded-sm p-4 space-y-3">
              <p className="text-sm font-headline font-bold">Payment Methods</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-3 bg-surface-container-highest rounded-sm">
                  <p className="font-headline font-bold text-on-surface">QR Code</p>
                  <p className="text-outline font-label text-[10px]">Mobile</p>
                </div>
                <div className="text-center p-3 bg-surface-container-highest rounded-sm">
                  <p className="font-headline font-bold text-on-surface">Direct</p>
                  <p className="text-outline font-label text-[10px]">Any wallet</p>
                </div>
                <div className="text-center p-3 bg-surface-container-highest rounded-sm">
                  <p className="font-headline font-bold text-on-surface">Wallet</p>
                  <p className="text-outline font-label text-[10px]">Full tracking</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Warning */}
        <div className="mt-4 pt-4 border-t border-outline-variant/20">
          <p className="text-[10px] text-outline text-center font-label uppercase tracking-widest">
            <AlertCircle className="h-3 w-3 inline mr-1" />
            Always verify you&apos;re on the correct network ({getNetworkName(chainId)}) before sending funds.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple QR display for sharing
export function ShareableQR({
  address,
  campaignTitle,
  chainId = 31337,
}: {
  address: string;
  campaignTitle: string;
  chainId?: number;
}) {
  const paymentURI = `ethereum:${address}${chainId !== 1 ? `@${chainId}` : ""}`;

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg max-w-xs mx-auto">
      <h3 className="font-bold text-lg text-gray-900 mb-2 text-center">
        {campaignTitle}
      </h3>
      <div className="bg-gray-50 p-3 rounded-lg mb-3">
        <QRCodeSVG
          value={paymentURI}
          size={160}
          level="M"
          includeMargin={false}
        />
      </div>
      <p className="text-xs text-gray-500 text-center break-all font-mono">
        {address}
      </p>
      <p className="text-xs text-gray-400 mt-2">
        Scan to donate ETH
      </p>
    </div>
  );
}
