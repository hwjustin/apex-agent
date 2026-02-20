// In-memory financial ledger for tracking compute costs vs ad revenue.
// Revenue is tracked from confirmed on-chain ActionProcessed events only.
// Data resets on server restart — fine for demo purposes.

import { createPublicClient, http, parseAbiItem } from "viem";
import { base } from "viem/chains";
import { CAMPAIGN_REGISTRY_ADDRESS } from "@/lib/contracts/campaignRegistry";

// --- Gemini Flash pricing (paid tier, per token) ---
// Input:  $0.50 per 1M tokens
// Output: $3.00 per 1M tokens
const INPUT_COST_PER_TOKEN = 0.50 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 3.00 / 1_000_000;

// Our publisher ID on Base Mainnet
const PUBLISHER_ID = BigInt(17863);

// --- Types ---

export interface CostEvent {
  timestamp: number;
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  costUsd: number;
}

export interface RevenueEvent {
  timestamp: number;
  campaignId: string;
  cpaAmountUsd: number;
  txHash: string;
}

export interface FinancialSummary {
  totalCostUsd: number;
  totalRevenueUsd: number;
  netProfitUsd: number;
  profitMarginPercent: number;
  apiCallCount: number;
  adsServedCount: number;
  costEvents: CostEvent[];
  revenueEvents: RevenueEvent[];
}

// --- In-memory storage ---

const costEvents: CostEvent[] = [];
const revenueEvents: RevenueEvent[] = [];
const seenTxHashes = new Set<string>();

// --- Cost tracking ---

export function recordApiCost(
  promptTokens: number,
  candidatesTokens: number,
  totalTokens: number
): void {
  const costUsd =
    promptTokens * INPUT_COST_PER_TOKEN +
    candidatesTokens * OUTPUT_COST_PER_TOKEN;

  costEvents.push({
    timestamp: Date.now(),
    promptTokens,
    candidatesTokens,
    totalTokens,
    costUsd,
  });

  console.log(
    `[Financials] API cost: $${costUsd.toFixed(6)} (${promptTokens} in / ${candidatesTokens} out)`
  );
}

// --- Revenue tracking (from on-chain events) ---

const actionProcessedEvent = parseAbiItem(
  "event ActionProcessed(uint256 indexed campaignId, uint256 indexed publisherId, uint256 validatorId, uint256 paymentAmount, bytes32 actionHash)"
);

let lastPolledBlock: bigint | null = null;
let pollerStarted = false;

async function pollActionProcessedEvents() {
  const rpcUrl = process.env.RPC_URL || "https://mainnet.base.org";
  const client = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });

  try {
    const currentBlock = await client.getBlockNumber();

    // On first poll, only look back ~50 blocks (~100 seconds) to avoid scanning too far
    if (lastPolledBlock === null) {
      lastPolledBlock = currentBlock - BigInt(50);
    }

    if (currentBlock <= lastPolledBlock) return;

    const fromBlock = lastPolledBlock + BigInt(1);

    const logs = await client.getLogs({
      address: CAMPAIGN_REGISTRY_ADDRESS,
      event: actionProcessedEvent,
      args: {
        publisherId: PUBLISHER_ID,
      },
      fromBlock,
      toBlock: currentBlock,
    });

    for (const log of logs) {
      const txHash = log.transactionHash;
      if (!txHash || seenTxHashes.has(txHash)) continue;
      seenTxHashes.add(txHash);

      const campaignId = log.args.campaignId?.toString() ?? "unknown";
      // paymentAmount is USDC with 6 decimals (e.g. 100000 = $0.10)
      const paymentAmount = log.args.paymentAmount ?? BigInt(0);
      const cpaAmountUsd = Number(paymentAmount) / 1_000_000;

      revenueEvents.push({
        timestamp: Date.now(),
        campaignId,
        cpaAmountUsd,
        txHash,
      });

      console.log(
        `[Financials] Confirmed revenue: $${cpaAmountUsd.toFixed(2)} (campaign ${campaignId}, tx ${txHash.slice(0, 10)}...)`
      );
    }

    lastPolledBlock = currentBlock;
  } catch (err) {
    console.error("[Financials] Error polling ActionProcessed events:", err);
  }
}

function startPoller() {
  if (pollerStarted) return;
  pollerStarted = true;

  // Poll every 10 seconds
  pollActionProcessedEvents();
  setInterval(pollActionProcessedEvents, 10_000);

  console.log("[Financials] Started ActionProcessed event poller");
}

// --- Summary ---

export function getFinancialSummary(): FinancialSummary {
  // Ensure the poller is running (lazy start on first summary request)
  startPoller();

  const totalCostUsd = costEvents.reduce((sum, e) => sum + e.costUsd, 0);
  const totalRevenueUsd = revenueEvents.reduce(
    (sum, e) => sum + e.cpaAmountUsd,
    0
  );
  const netProfitUsd = totalRevenueUsd - totalCostUsd;
  const profitMarginPercent =
    totalRevenueUsd > 0
      ? ((netProfitUsd / totalRevenueUsd) * 100)
      : 0;

  return {
    totalCostUsd,
    totalRevenueUsd,
    netProfitUsd,
    profitMarginPercent,
    apiCallCount: costEvents.length,
    adsServedCount: revenueEvents.length,
    costEvents: [...costEvents],
    revenueEvents: [...revenueEvents],
  };
}
