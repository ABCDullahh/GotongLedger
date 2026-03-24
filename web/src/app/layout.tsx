import type { Metadata } from "next";
import { Inter, Epilogue, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChainCheck } from "@/components/chain-check";
import { DonationNotifier } from "@/components/donation-notifier";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const epilogue = Epilogue({
  subsets: ["latin"],
  variable: "--font-epilogue",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GotongLedger - Radical Transparency by Design",
  description:
    "A trustless ledger for community fundraising, powered by the Ethereum blockchain. Monitor every cent from donation to impact.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${epilogue.variable} ${spaceGrotesk.variable} font-body bg-[#131314] text-[#E5E2E3] antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col selection:bg-primary-container/30 selection:text-primary">
            <Navbar />
            <main className="flex-1 pt-20">{children}</main>
            <Footer />
          </div>
          <ChainCheck />
          <DonationNotifier />
        </Providers>
      </body>
    </html>
  );
}
