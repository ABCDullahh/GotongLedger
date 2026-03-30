import { http, createConfig, createStorage } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

// WalletConnect Project ID (get from https://cloud.walletconnect.com)
const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";

// Define localhost chain
const localhost = {
  ...hardhat,
  id: 31337,
  name: "Localhost",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
  },
} as const;

// Determine active chains based on environment
const isProduction = process.env.NEXT_PUBLIC_CHAIN_ENV === "sepolia";
const activeChains = isProduction ? [sepolia] as const : [localhost] as const;
const activeTransport = isProduction
  ? { [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL) }
  : { [localhost.id]: http(RPC_URL) };

export const config = createConfig({
  chains: activeChains as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  connectors: [
    injected(),
    walletConnect({ projectId: WALLETCONNECT_PROJECT_ID }),
    coinbaseWallet({
      appName: "GotongLedger",
      appLogoUrl: "/images/hero-crystal.png",
    }),
  ],
  transports: activeTransport as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  storage: createStorage({
    storage:
      typeof window !== "undefined"
        ? window.localStorage
        : {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          },
  }),
  ssr: true,
});

export { localhost, sepolia };
