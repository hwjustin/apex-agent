import { NextResponse } from "next/server";
import { createPublicClient, http, fromHex } from "viem";
import { baseSepolia } from "viem/chains";
import {
  CAMPAIGN_REGISTRY_ADDRESS,
  CAMPAIGN_REGISTRY_ABI,
  Campaign,
  CampaignSpec,
  SerializedCampaign,
} from "@/lib/contracts/campaignRegistry";

export const runtime = "nodejs";

// In-memory cache
let cachedCampaigns: SerializedCampaign[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

// Create public client for Base Sepolia (no wallet needed)
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.RPC_URL || "https://sepolia.base.org"),
});

function getCampaignStatus(campaign: Campaign): "active" | "scheduled" | "ended" {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (campaign.startTime > now) return "scheduled";
  if (campaign.expiryTime <= now) return "ended";
  return "active";
}

function decodeSpec(specHex: `0x${string}`): CampaignSpec | null {
  try {
    if (specHex === "0x" || specHex.length <= 2) {
      return null;
    }
    const specStr = fromHex(specHex, "string");
    return JSON.parse(specStr) as CampaignSpec;
  } catch {
    return null;
  }
}

function serializeCampaign(campaign: Campaign): SerializedCampaign {
  return {
    campaignId: campaign.campaignId.toString(),
    advertiserId: campaign.advertiserId.toString(),
    budget: {
      amount: campaign.budget.amount.toString(),
      tokenAddress: campaign.budget.tokenAddress,
    },
    startTime: campaign.startTime.toString(),
    expiryTime: campaign.expiryTime.toString(),
    spec: decodeSpec(campaign.spec),
    status: getCampaignStatus(campaign),
  };
}

async function fetchCampaignsFromChain(): Promise<SerializedCampaign[]> {
  // Get campaign count
  const count = await publicClient.readContract({
    address: CAMPAIGN_REGISTRY_ADDRESS,
    abi: CAMPAIGN_REGISTRY_ABI,
    functionName: "getCampaignCount",
  });

  if (count === 0n) {
    return [];
  }

  // Fetch all campaigns (IDs are 1-indexed based on typical Solidity patterns)
  const campaigns: SerializedCampaign[] = [];

  for (let i = 1n; i <= count; i++) {
    try {
      const campaign = await publicClient.readContract({
        address: CAMPAIGN_REGISTRY_ADDRESS,
        abi: CAMPAIGN_REGISTRY_ABI,
        functionName: "getCampaign",
        args: [i],
      }) as Campaign;

      const serialized = serializeCampaign(campaign);

      // Only include active campaigns
      if (serialized.status === "active") {
        campaigns.push(serialized);
      }
    } catch (err) {
      console.error(`Failed to fetch campaign ${i}:`, err);
      // Continue to next campaign on error
    }
  }

  return campaigns;
}

export async function GET() {
  try {
    const now = Date.now();

    // Check cache
    if (cachedCampaigns && now - cacheTimestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        campaigns: cachedCampaigns,
        cached: true,
        timestamp: cacheTimestamp,
      });
    }

    // Fetch fresh data
    const campaigns = await fetchCampaignsFromChain();

    // Update cache
    cachedCampaigns = campaigns;
    cacheTimestamp = now;

    return NextResponse.json({
      campaigns,
      cached: false,
      timestamp: now,
    });
  } catch (err) {
    console.error("API /api/campaigns error:", err);
    return NextResponse.json(
      { error: "Failed to fetch campaigns", campaigns: [] },
      { status: 500 }
    );
  }
}
