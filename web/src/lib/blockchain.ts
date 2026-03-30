import { createPublicClient, http, parseAbiItem, type Log } from "viem";
import { hardhat } from "viem/chains";
import {
  CAMPAIGN_LEDGER_ADDRESS as CONTRACT_ADDRESS,
  CAMPAIGN_LEDGER_ABI as CONTRACT_ABI,
  CHAIN_ID as DEPLOYED_CHAIN_ID,
  GENESIS_HASH as DEPLOYED_GENESIS_HASH,
} from "./contracts";

// Re-export contract constants
export const CAMPAIGN_LEDGER_ADDRESS = CONTRACT_ADDRESS;
export const CAMPAIGN_LEDGER_ABI = CONTRACT_ABI;
export const CHAIN_ID = DEPLOYED_CHAIN_ID;
export const GENESIS_HASH = DEPLOYED_GENESIS_HASH;

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";

const localhost = {
  ...hardhat,
  id: 31337,
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
  },
} as const;

export const publicClient = createPublicClient({
  chain: localhost,
  transport: http(RPC_URL),
});

// Event types
export interface CampaignCreatedEvent {
  campaignId: bigint;
  owner: `0x${string}`;
  treasury: `0x${string}`;
  createdAt: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
}

export interface DonationReceivedEvent {
  campaignId: bigint;
  from: `0x${string}`;
  amountWei: bigint;
  timestamp: bigint;
  txHashRef: `0x${string}`;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
}

export interface ExpenseRecordedEvent {
  campaignId: bigint;
  spender: `0x${string}`;
  amountWei: bigint;
  category: string;
  cid: string;
  note: string;
  timestamp: bigint;
  txHashRef: `0x${string}`;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
}

// Parse event logs
function parseCampaignCreatedLog(log: Log): CampaignCreatedEvent {
  const args = log as unknown as {
    args: {
      campaignId: bigint;
      owner: `0x${string}`;
      treasury: `0x${string}`;
      createdAt: bigint;
    };
  };
  return {
    campaignId: args.args.campaignId,
    owner: args.args.owner,
    treasury: args.args.treasury,
    createdAt: args.args.createdAt,
    transactionHash: log.transactionHash!,
    blockNumber: log.blockNumber!,
  };
}

function parseDonationLog(log: Log): DonationReceivedEvent {
  const args = log as unknown as {
    args: {
      campaignId: bigint;
      from: `0x${string}`;
      amountWei: bigint;
      timestamp: bigint;
      txHashRef: `0x${string}`;
    };
  };
  return {
    campaignId: args.args.campaignId,
    from: args.args.from,
    amountWei: args.args.amountWei,
    timestamp: args.args.timestamp,
    txHashRef: args.args.txHashRef,
    transactionHash: log.transactionHash!,
    blockNumber: log.blockNumber!,
  };
}

function parseExpenseLog(log: Log): ExpenseRecordedEvent {
  const args = log as unknown as {
    args: {
      campaignId: bigint;
      spender: `0x${string}`;
      amountWei: bigint;
      category: string;
      cid: string;
      note: string;
      timestamp: bigint;
      txHashRef: `0x${string}`;
    };
  };
  return {
    campaignId: args.args.campaignId,
    spender: args.args.spender,
    amountWei: args.args.amountWei,
    category: args.args.category,
    cid: args.args.cid,
    note: args.args.note,
    timestamp: args.args.timestamp,
    txHashRef: args.args.txHashRef,
    transactionHash: log.transactionHash!,
    blockNumber: log.blockNumber!,
  };
}

// Fetch functions
export async function getCampaignCreatedLogs(): Promise<CampaignCreatedEvent[]> {
  try {
    if ((CAMPAIGN_LEDGER_ADDRESS as string) === "0x0000000000000000000000000000000000000000") {
      return [];
    }

    const logs = await publicClient.getLogs({
      address: CAMPAIGN_LEDGER_ADDRESS,
      event: parseAbiItem(
        "event CampaignCreated(uint256 indexed campaignId, address indexed owner, address treasury, uint64 createdAt)"
      ),
      fromBlock: 0n,
      toBlock: "latest",
    });

    return logs.map(parseCampaignCreatedLog);
  } catch (error) {
    console.error("Failed to get campaign created logs:", error);
    return [];
  }
}

export async function getDonationLogs(
  campaignId?: bigint
): Promise<DonationReceivedEvent[]> {
  try {
    if ((CAMPAIGN_LEDGER_ADDRESS as string) === "0x0000000000000000000000000000000000000000") {
      return [];
    }

    const logs = await publicClient.getLogs({
      address: CAMPAIGN_LEDGER_ADDRESS,
      event: parseAbiItem(
        "event DonationReceived(uint256 indexed campaignId, address indexed from, uint256 amountWei, uint256 timestamp, bytes32 txHashRef)"
      ),
      args: campaignId ? { campaignId } : undefined,
      fromBlock: 0n,
      toBlock: "latest",
    });

    return logs.map(parseDonationLog);
  } catch (error) {
    console.error("Failed to get donation logs:", error);
    return [];
  }
}

export async function getExpenseLogs(
  campaignId?: bigint
): Promise<ExpenseRecordedEvent[]> {
  try {
    if ((CAMPAIGN_LEDGER_ADDRESS as string) === "0x0000000000000000000000000000000000000000") {
      return [];
    }

    const logs = await publicClient.getLogs({
      address: CAMPAIGN_LEDGER_ADDRESS,
      event: parseAbiItem(
        "event ExpenseRecorded(uint256 indexed campaignId, address indexed spender, uint256 amountWei, string category, string cid, string note, uint256 timestamp, bytes32 txHashRef)"
      ),
      args: campaignId ? { campaignId } : undefined,
      fromBlock: 0n,
      toBlock: "latest",
    });

    return logs.map(parseExpenseLog);
  } catch (error) {
    console.error("Failed to get expense logs:", error);
    return [];
  }
}

export async function getTransactionReceipt(hash: `0x${string}`) {
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash });
    const tx = await publicClient.getTransaction({ hash });
    return { receipt, tx };
  } catch (error) {
    console.error("Failed to get transaction:", error);
    return null;
  }
}

export async function getAllStats() {
  const [campaignLogs, donationLogs, expenseLogs] = await Promise.all([
    getCampaignCreatedLogs(),
    getDonationLogs(),
    getExpenseLogs(),
  ]);

  const totalDonations = donationLogs.reduce(
    (sum, log) => sum + log.amountWei,
    0n
  );
  const totalExpenses = expenseLogs.reduce(
    (sum, log) => sum + log.amountWei,
    0n
  );

  return {
    totalCampaigns: campaignLogs.length,
    totalDonations,
    totalExpenses,
    campaigns: campaignLogs,
    donations: donationLogs,
    expenses: expenseLogs,
  };
}

// Direct transfer tracking
export interface DirectTransfer {
  from: `0x${string}`;
  to: `0x${string}`;
  value: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp?: bigint;
}

/**
 * Get direct ETH transfers to a treasury address
 * This tracks donations sent directly (not through the smart contract)
 */
export async function getDirectTransfers(
  treasuryAddress: `0x${string}`
): Promise<DirectTransfer[]> {
  try {
    // Get latest block number
    const latestBlock = await publicClient.getBlockNumber();

    // Fetch blocks in chunks (Hardhat local node supports this)
    const transfers: DirectTransfer[] = [];

    // For demo, scan last 1000 blocks (adjust as needed)
    const fromBlock = latestBlock > 1000n ? latestBlock - 1000n : 0n;

    // Get all blocks with transactions
    for (let blockNum = fromBlock; blockNum <= latestBlock; blockNum++) {
      try {
        const block = await publicClient.getBlock({
          blockNumber: blockNum,
          includeTransactions: true,
        });

        // Filter transactions to the treasury address
        for (const tx of block.transactions) {
          if (typeof tx === "object" && tx.to?.toLowerCase() === treasuryAddress.toLowerCase()) {
            // Check if this is NOT a contract call (simple ETH transfer)
            // Contract calls have input data, simple transfers have "0x" or empty
            if (!tx.input || tx.input === "0x") {
              transfers.push({
                from: tx.from,
                to: tx.to,
                value: tx.value,
                transactionHash: tx.hash,
                blockNumber: block.number!,
                timestamp: block.timestamp,
              });
            }
          }
        }
      } catch {
        // Skip blocks that fail to fetch
        continue;
      }
    }

    return transfers;
  } catch (error) {
    console.error("Failed to get direct transfers:", error);
    return [];
  }
}

/**
 * Get all donations for a campaign (both via contract and direct transfers)
 */
export async function getAllDonations(
  campaignId: bigint,
  treasuryAddress: `0x${string}`
): Promise<{
  contractDonations: DonationReceivedEvent[];
  directTransfers: DirectTransfer[];
  totalContractDonations: bigint;
  totalDirectTransfers: bigint;
  grandTotal: bigint;
}> {
  const [contractDonations, directTransfers] = await Promise.all([
    getDonationLogs(campaignId),
    getDirectTransfers(treasuryAddress),
  ]);

  const totalContractDonations = contractDonations.reduce(
    (sum, d) => sum + d.amountWei,
    0n
  );
  const totalDirectTransfers = directTransfers.reduce(
    (sum, t) => sum + t.value,
    0n
  );

  return {
    contractDonations,
    directTransfers,
    totalContractDonations,
    totalDirectTransfers,
    grandTotal: totalContractDonations + totalDirectTransfers,
  };
}
