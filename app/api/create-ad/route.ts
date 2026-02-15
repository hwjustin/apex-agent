import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, parseAbiParameters, encodeAbiParameters } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { AD_REGISTRY_ADDRESS, AD_REGISTRY_ABI } from "@/lib/contracts/adRegistry";

export const runtime = "nodejs";

interface CreateAdRequest {
  campaignId: string;
  userWalletAddress: string;
}

export async function POST(req: Request) {
  try {
    const { campaignId, userWalletAddress }: CreateAdRequest = await req.json();

    // Validate inputs
    if (!campaignId) {
      return NextResponse.json({ error: "Missing campaignId" }, { status: 400 });
    }

    if (!userWalletAddress) {
      return NextResponse.json({ error: "Missing userWalletAddress" }, { status: 400 });
    }

    // Get publisher private key from environment
    const publisherPrivateKey = process.env.PUBLISHER_PRIVATE_KEY as `0x${string}`;
    const rpcUrl = process.env.RPC_URL || "https://sepolia.base.org";

    if (!publisherPrivateKey || publisherPrivateKey === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      console.error("Publisher private key not configured");
      return NextResponse.json({ error: "Publisher wallet not configured" }, { status: 500 });
    }

    // Create publisher account from private key
    const publisherAccount = privateKeyToAccount(publisherPrivateKey);

    // Create clients
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      account: publisherAccount,
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    // Prepare transaction parameters
    const campaignIdBigInt = BigInt(campaignId);
    const publisherId = BigInt(2); // Registered publisher ID
    const startTime = BigInt(Math.floor(Date.now() / 1000));

    // Encode metadata (user's wallet address)
    // Format as JSON with userWallet field for validator attribution
    const metadata = JSON.stringify({
      userWallet: userWalletAddress
    });

    const metadataBytes = encodeAbiParameters(
      parseAbiParameters('string'),
      [metadata]
    );

    console.log("\n[CreateAd API] 📝 Preparing transaction:", {
      campaignId: campaignIdBigInt.toString(),
      publisherId: publisherId.toString(),
      startTime: startTime.toString(),
      userWalletAddress,
      metadata,
      publisherAddress: publisherAccount.address,
    });

    // Simulate transaction first
    try {
      await publicClient.simulateContract({
        address: AD_REGISTRY_ADDRESS,
        abi: AD_REGISTRY_ABI,
        functionName: 'createAd',
        args: [campaignIdBigInt, publisherId, startTime, metadataBytes],
        account: publisherAccount,
      });
      console.log("[CreateAd API] ✓ Simulation successful");
    } catch (simulationError: any) {
      console.error("[CreateAd API] ❌ Simulation failed:", simulationError.message);

      // Provide user-friendly error messages
      if (simulationError.message?.includes('CampaignNotFound')) {
        return NextResponse.json({ error: 'Campaign not found in registry' }, { status: 400 });
      } else if (simulationError.message?.includes('CampaignNotActive')) {
        return NextResponse.json({ error: 'Campaign is not active' }, { status: 400 });
      } else if (simulationError.message?.includes('PublisherNotFound')) {
        return NextResponse.json({ error: 'Publisher not registered in IdentityRegistry' }, { status: 500 });
      } else if (simulationError.message?.includes('UnauthorizedCaller')) {
        return NextResponse.json({ error: 'Publisher wallet not authorized for this campaign' }, { status: 403 });
      } else {
        return NextResponse.json({
          error: `Transaction simulation failed: ${simulationError.shortMessage || simulationError.message}`
        }, { status: 500 });
      }
    }

    // Send transaction
    const hash = await walletClient.writeContract({
      address: AD_REGISTRY_ADDRESS,
      abi: AD_REGISTRY_ABI,
      functionName: 'createAd',
      args: [campaignIdBigInt, publisherId, startTime, metadataBytes],
    });

    console.log("[CreateAd API] 📤 Transaction sent:", hash);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    });

    console.log("[CreateAd API] ✅ Transaction confirmed:", {
      hash,
      status: receipt.status,
      blockNumber: receipt.blockNumber.toString(),
      explorer: `https://sepolia.basescan.org/tx/${hash}`,
    });

    if (receipt.status === 'reverted') {
      return NextResponse.json({ error: 'Transaction reverted' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      txHash: hash,
      blockNumber: receipt.blockNumber.toString(),
    });

  } catch (error: any) {
    console.error("[CreateAd API] ❌ Unexpected error:", error.message || error);
    return NextResponse.json({
      error: error.message || "Failed to create ad"
    }, { status: 500 });
  }
}
