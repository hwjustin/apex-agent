import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { SerializedCampaign } from "@/lib/contracts/campaignRegistry";
import { PURCHASE_CONFIG } from "@/lib/config/purchase";
import { recordApiCost } from "@/lib/financials";

// Whitelisted wallet addresses (same as frontend)
const WHITELISTED_ADDRESSES = [
  "0xA5cfB98718a77BB6eeAe3f9cDDE45F2521Ae4fC1",
] as const;

// Optional (recommended): force Node runtime (avoid edge issues with some SDKs)
export const runtime = "nodejs";

function buildSystemInstruction(campaigns: SerializedCampaign[]): string {
  const baseInstruction = `You are an AI assistant integrated with the APEX advertising network.
Your task is to act as a helpful assistant. When appropriate based on the user's query, you can naturally recommend relevant campaigns from the APEX network.`;

  if (!campaigns || campaigns.length === 0) {
    return `${baseInstruction}

Currently there are no active campaigns available.`;
  }

  const campaignList = campaigns
    .map((c, i) => {
      const spec = c.spec;
      const title = spec?.title || `Campaign #${c.campaignId}`;
      const description = spec?.description || "No description available";
      const targetUrl = spec?.targetUrl;

      let campaignInfo = `${i + 1}. **${title}**
   - Description: ${description}`;

      if (targetUrl) {
        campaignInfo += `\n   - Link: ${targetUrl}`;
      }

      return campaignInfo;
    })
    .join("\n\n");

  return `${baseInstruction}

Here are the currently active campaigns you can recommend when relevant:

${campaignList}

Guidelines:
- Only recommend campaigns when they are clearly relevant to the user's current query
- Be natural and helpful first - answer the user's question directly before considering any recommendations
- If the conversation topic shifts or the user's request is no longer relevant to available campaigns, do NOT force a recommendation
- Never recommend campaigns just to fill a response - it's better to provide no recommendation than an irrelevant one
- Always include the campaign link when recommending (if available)
- You can recommend multiple campaigns if they are all relevant to the current discussion
- ${PURCHASE_CONFIG.purchasePrompt}`;
}

export async function POST(req: Request) {
  try {
    const { prompt, campaigns, walletAddress } = await req.json();

    // Check if wallet address is whitelisted
    const isWhitelisted = walletAddress && WHITELISTED_ADDRESSES.some(
      addr => addr.toLowerCase() === walletAddress.toLowerCase()
    );

    if (!isWhitelisted) {
      return NextResponse.json({ error: "Unauthorized wallet address" }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    // Log interaction for tracking (wallet address available for payment settlement)
    console.log("[Chat] User interaction:", {
      walletAddress,
      campaignCount: campaigns?.length || 0,
      timestamp: new Date().toISOString(),
    });

    const gemini = new GoogleGenAI({ apiKey });
    const systemInstruction = buildSystemInstruction(campaigns || []);

    const response = await gemini.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    // Record API cost from usage metadata
    const usageMetadata = (response as any).usageMetadata;
    if (usageMetadata) {
      recordApiCost(
        usageMetadata.promptTokenCount ?? 0,
        usageMetadata.candidatesTokenCount ?? 0,
        usageMetadata.totalTokenCount ?? 0
      );
    }

    const raw = (response as any).text;
    const text =
      typeof raw === "function" ? raw() : typeof raw === "string" ? raw : "";

    return NextResponse.json({
      text: text?.trim() || "Sorry, I couldn't generate a response.",
      walletAddress: walletAddress || null,
    });
  } catch (err: any) {
    console.error("API /api/chat error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
