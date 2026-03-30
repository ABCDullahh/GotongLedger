import { prisma } from "./db";
import { createPublicClient, http } from "viem";
import { hardhat } from "viem/chains";

export interface FingerprintCheck {
  isValid: boolean;
  wasReset: boolean;
  currentFingerprint: {
    chainId: number;
    genesisHash: string;
    contractAddress: string;
  } | null;
  storedFingerprint: {
    chainId: number;
    genesisHash: string;
    contractAddress: string;
  } | null;
}

/**
 * Get the genesis block hash from the blockchain
 */
export async function getGenesisHash(): Promise<string> {
  try {
    const client = createPublicClient({
      chain: hardhat,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"),
    });

    const block = await client.getBlock({ blockNumber: 0n });
    return block.hash;
  } catch (error) {
    console.error("Failed to get genesis hash:", error);
    return "";
  }
}

/**
 * Check if the chain has been reset by comparing genesis hash
 */
export async function checkChainFingerprint(
  contractAddress: string,
  chainId: number
): Promise<FingerprintCheck> {
  try {
    const currentGenesisHash = await getGenesisHash();

    if (!currentGenesisHash) {
      return {
        isValid: false,
        wasReset: false,
        currentFingerprint: null,
        storedFingerprint: null,
      };
    }

    const storedFingerprint = await prisma.chainFingerprint.findUnique({
      where: { chainId },
    });

    const currentFingerprint = {
      chainId,
      genesisHash: currentGenesisHash,
      contractAddress,
    };

    // No stored fingerprint - this is a fresh start
    if (!storedFingerprint) {
      return {
        isValid: true,
        wasReset: false,
        currentFingerprint,
        storedFingerprint: null,
      };
    }

    // Check if genesis hash matches
    const wasReset = storedFingerprint.genesisHash !== currentGenesisHash;

    return {
      isValid: !wasReset,
      wasReset,
      currentFingerprint,
      storedFingerprint: {
        chainId: storedFingerprint.chainId,
        genesisHash: storedFingerprint.genesisHash,
        contractAddress: storedFingerprint.contractAddress,
      },
    };
  } catch (error) {
    console.error("Fingerprint check failed:", error);
    return {
      isValid: false,
      wasReset: false,
      currentFingerprint: null,
      storedFingerprint: null,
    };
  }
}

/**
 * Store the current chain fingerprint
 */
export async function storeChainFingerprint(
  chainId: number,
  contractAddress: string,
  genesisHash: string
): Promise<void> {
  await prisma.chainFingerprint.upsert({
    where: { chainId },
    update: {
      contractAddress,
      genesisHash,
      updatedAt: new Date(),
    },
    create: {
      chainId,
      contractAddress,
      genesisHash,
    },
  });
}

/**
 * Clear all metadata when chain is reset
 */
export async function clearMetadataOnReset(): Promise<void> {
  await prisma.$transaction([
    prisma.campaignMetadata.deleteMany(),
    prisma.fileMeta.deleteMany(),
    prisma.chainFingerprint.deleteMany(),
  ]);
  console.error("[fingerprint] All metadata cleared due to chain reset");
}

/**
 * Handle chain reset detection and cleanup
 */
export async function handleChainReset(
  contractAddress: string,
  chainId: number,
  genesisHash: string
): Promise<boolean> {
  const check = await checkChainFingerprint(contractAddress, chainId);

  if (check.wasReset) {
    console.error("[fingerprint] Chain reset detected - clearing metadata");
    await clearMetadataOnReset();
    await storeChainFingerprint(chainId, contractAddress, genesisHash);
    return true;
  }

  if (!check.storedFingerprint) {
    // First time setup
    await storeChainFingerprint(chainId, contractAddress, genesisHash);
  }

  return false;
}
