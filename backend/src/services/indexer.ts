import fs from "fs";
import path from "path";
import cron from "node-cron";
import { createPublicClient, http, parseAbiItem } from "viem";
import { RPC_URL, VAULTS } from "../config.js";

const client = createPublicClient({
  transport: http(RPC_URL),
});

const CACHE_DIR = path.resolve("cache");
const CACHE_FILE = path.join(CACHE_DIR, "indexer_cache.json");

export interface TransactionRecord {
  txHash: string;
  vault: string;
  type: "deposit" | "withdraw";
  user: string;
  lpAmount: string;
  shares: string;
  timestamp: string;
}

export interface IndexerCache {
  lastScannedBlock: number;
  transactions: TransactionRecord[];
  userShares: Record<string, Record<string, string>>; // Address -> (VaultKey -> SharesBalance)
}

const DEFAULT_CACHE: IndexerCache = {
  lastScannedBlock: 0,
  transactions: [],
  userShares: {},
};

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Write default cache if it doesn't exist
if (!fs.existsSync(CACHE_FILE)) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(DEFAULT_CACHE, null, 2));
}

export function getIndexerData(): IndexerCache {
  try {
    const data = fs.readFileSync(CACHE_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return DEFAULT_CACHE;
  }
}

function writeIndexerData(data: IndexerCache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Failed to write indexer cache:", error);
  }
}

// Log definitions using parseAbiItem
const DEPOSIT_EVENT = parseAbiItem("event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)");
const WITHDRAW_EVENT = parseAbiItem("event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)");

export async function runIndexer() {
  const cache = getIndexerData();
  
  try {
    const currentBlock = Number(await client.getBlockNumber());
    let startBlock = cache.lastScannedBlock;
    
    // If scanning for first time, start from currentBlock - 5000 (avoid scanning full history)
    if (startBlock === 0) {
      startBlock = Math.max(0, currentBlock - 5000);
    }

    if (startBlock >= currentBlock) return;

    console.log(`Indexing events from block ${startBlock} to ${currentBlock}...`);

    const newTransactions: TransactionRecord[] = [];
    const updatedShares = { ...cache.userShares };

    for (const [vaultKey, vaultAddr] of Object.entries(VAULTS)) {
      // Fetch Deposit Logs
      const depositLogs = await client.getLogs({
        address: vaultAddr as `0x${string}`,
        event: DEPOSIT_EVENT,
        fromBlock: BigInt(startBlock + 1),
        toBlock: BigInt(currentBlock),
      });

      for (const log of depositLogs) {
        const { owner, assets, shares } = log.args;
        if (!owner) continue;
        const userAddr = owner.toLowerCase();
        
        newTransactions.push({
          txHash: log.transactionHash || "",
          vault: vaultKey,
          type: "deposit",
          user: userAddr,
          lpAmount: (Number(assets) / 1e18).toFixed(6),
          shares: (Number(shares) / 1e18).toFixed(6),
          timestamp: new Date().toISOString(), // Mock timestamp for simulation
        });

        if (!updatedShares[userAddr]) updatedShares[userAddr] = {};
        const currentBal = parseFloat(updatedShares[userAddr][vaultKey] || "0");
        const added = Number(shares) / 1e18;
        updatedShares[userAddr][vaultKey] = (currentBal + added).toFixed(6);
      }

      // Fetch Withdraw Logs
      const withdrawLogs = await client.getLogs({
        address: vaultAddr as `0x${string}`,
        event: WITHDRAW_EVENT,
        fromBlock: BigInt(startBlock + 1),
        toBlock: BigInt(currentBlock),
      });

      for (const log of withdrawLogs) {
        const { owner, assets, shares } = log.args;
        if (!owner) continue;
        const userAddr = owner.toLowerCase();

        newTransactions.push({
          txHash: log.transactionHash || "",
          vault: vaultKey,
          type: "withdraw",
          user: userAddr,
          lpAmount: (Number(assets) / 1e18).toFixed(6),
          shares: (Number(shares) / 1e18).toFixed(6),
          timestamp: new Date().toISOString(),
        });

        if (!updatedShares[userAddr]) updatedShares[userAddr] = {};
        const currentBal = parseFloat(updatedShares[userAddr][vaultKey] || "0");
        const removed = Number(shares) / 1e18;
        updatedShares[userAddr][vaultKey] = Math.max(0, currentBal - removed).toFixed(6);
      }
    }

    cache.transactions.push(...newTransactions);
    cache.userShares = updatedShares;
    cache.lastScannedBlock = currentBlock;

    writeIndexerData(cache);
    if (newTransactions.length > 0) {
      console.log(`Indexed ${newTransactions.length} new transaction events!`);
    }
  } catch (error) {
    // If the chain is offline or getLogs fails, we just fail silently and don't write
    // This allows backend to run fine even if local node is shut down
  }
}

export function startIndexerScheduler() {
  console.log("Initializing Transaction Event Indexer...");
  
  // Run once on startup
  runIndexer().catch(console.error);

  // Poll every 30 seconds for new blocks and events
  cron.schedule("*/30 * * * * *", async () => {
    await runIndexer();
  });
}
