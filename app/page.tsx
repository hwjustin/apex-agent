"use client";

import Image from "next/image";
import { FormEvent, ReactNode, useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SerializedCampaign } from "@/lib/contracts/campaignRegistry";
import { WalletButton } from "@/components/WalletButton";
import { useAccount } from "wagmi";
import { PurchaseCard } from "@/components/PurchaseCard";
import { ProductDetails } from "@/lib/contracts/purchaseContract";
import { detectAffirmativeResponse } from "@/lib/config/purchase";

// Whitelisted wallet addresses that can send messages
const WHITELISTED_ADDRESSES = [
  "0xA5cfB98718a77BB6eeAe3f9cDDE45F2521Ae4fC1",
] as const;

type AgentAction = {
  type: "fetch-campaigns" | "create-ad";
  status: "pending" | "success" | "error";
  label: string;
  detail?: string;
  txHash?: string;
};

type Message = {
  id: number;
  role: "user" | "ai" | "agent-action";
  content: string | ReactNode | AgentAction;
};

function AgentActionCard({ action }: { action: AgentAction }) {
  const borderColor =
    action.status === "pending"
      ? "border-l-yellow-400"
      : action.status === "success"
      ? "border-l-green-500"
      : "border-l-red-500";

  const icon =
    action.status === "pending"
      ? "\u23f3"
      : action.status === "success"
      ? "\u2705"
      : "\u274c";

  return (
    <div
      className={`border-l-4 ${borderColor} bg-gray-50 rounded-lg px-3 py-2 max-w-[80%] ${
        action.status === "pending" ? "animate-pulse-subtle" : ""
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
        <span>{icon}</span>
        <span className="font-mono">
          {action.type === "fetch-campaigns" ? "CampaignRegistry" : "AdRegistry"}
        </span>
      </div>
      <div className="mt-1 text-xs text-gray-700">{action.label}</div>
      {action.detail && (
        <div className="mt-0.5 text-[11px] text-gray-500 font-mono">
          {action.detail}
        </div>
      )}
      {action.txHash && (
        <a
          href={`https://basescan.org/tx/${action.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-[11px] text-blue-600 hover:text-blue-800 font-mono underline break-all"
        >
          tx: {action.txHash.slice(0, 10)}...{action.txHash.slice(-8)}
        </a>
      )}
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nextId, setNextId] = useState(1);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const actionIdRef = useRef(100000);
  const [campaigns, setCampaigns] = useState<SerializedCampaign[]>([]);
  const [hasCreatedAdForCampaign, setHasCreatedAdForCampaign] = useState<Record<string, boolean>>({});

  // Purchase flow state
  const [showPurchaseCard, setShowPurchaseCard] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<ProductDetails | null>(null);
  const [lastRecommendedCampaign, setLastRecommendedCampaign] = useState<SerializedCampaign | null>(null);

  // Wallet connection (user's wallet for authentication only)
  const { address: walletAddress, isConnected: isWalletConnected } = useAccount();

  // Check if connected wallet is whitelisted
  const isWhitelisted = walletAddress && WHITELISTED_ADDRESSES.some(
    addr => addr.toLowerCase() === walletAddress.toLowerCase()
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch campaigns only when a whitelisted wallet connects
  useEffect(() => {
    if (!isWhitelisted) {
      setCampaigns([]);
      return;
    }

    const fetchCampaigns = async () => {
      const msgId = ++actionIdRef.current;
      const pendingAction: AgentAction = {
        type: "fetch-campaigns",
        status: "pending",
        label: "Querying CampaignRegistry...",
      };
      setMessages(prev => [...prev, { id: msgId, role: "agent-action", content: pendingAction }]);

      try {
        const response = await fetch("/api/campaigns");
        if (!response.ok) {
          setMessages(prev =>
            prev.map(m =>
              m.id === msgId
                ? { ...m, content: { ...pendingAction, status: "error" as const, label: "Failed to fetch campaigns", detail: `HTTP ${response.status}` } }
                : m
            )
          );
          return;
        }
        const data = await response.json();
        if (data?.campaigns) {
          setCampaigns(data.campaigns);
          setMessages(prev =>
            prev.map(m =>
              m.id === msgId
                ? { ...m, content: { ...pendingAction, status: "success" as const, label: `Found ${data.campaigns.length} active campaign${data.campaigns.length !== 1 ? "s" : ""}` } }
                : m
            )
          );
        } else {
          setMessages(prev =>
            prev.map(m =>
              m.id === msgId
                ? { ...m, content: { ...pendingAction, status: "success" as const, label: "No active campaigns" } }
                : m
            )
          );
        }
      } catch (error) {
        setMessages(prev =>
          prev.map(m =>
            m.id === msgId
              ? { ...m, content: { ...pendingAction, status: "error" as const, label: "Error fetching campaigns", detail: String(error) } }
              : m
          )
        );
      }
    };

    fetchCampaigns();
  }, [isWhitelisted]);

  // Helper function to detect if AI recommended a campaign
  function detectRecommendedCampaign(aiMessage: string, campaigns: SerializedCampaign[]): SerializedCampaign | null {
    // Check if any campaign's targetUrl or title is mentioned in the AI response
    for (const campaign of campaigns) {
      const spec = campaign.spec;
      if (!spec) continue;

      // Check if targetUrl is mentioned
      if (spec.targetUrl && aiMessage.includes(spec.targetUrl)) {
        return campaign;
      }

      // Check if campaign title is mentioned (case-insensitive)
      if (spec.title && aiMessage.toLowerCase().includes(spec.title.toLowerCase())) {
        return campaign;
      }
    }
    return null;
  }

  // Create ad record in AdRegistry (server-side signing by publisher)
  async function createAdRecord(campaignId: string, userWalletAddress: string) {
    const msgId = ++actionIdRef.current;
    const pendingAction: AgentAction = {
      type: "create-ad",
      status: "pending",
      label: "Submitting ad record to AdRegistry...",
    };
    setMessages(prev => [...prev, { id: msgId, role: "agent-action", content: pendingAction }]);

    try {
      const response = await fetch('/api/create-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, userWalletAddress }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create ad');
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === msgId
            ? { ...m, content: { ...pendingAction, status: "success" as const, label: "Ad recorded on-chain", txHash: data.txHash, detail: `Block #${data.blockNumber}` } }
            : m
        )
      );

      setHasCreatedAdForCampaign(prev => ({
        ...prev,
        [campaignId]: true,
      }));

    } catch (error: any) {
      setMessages(prev =>
        prev.map(m =>
          m.id === msgId
            ? { ...m, content: { ...pendingAction, status: "error" as const, label: "Failed to create ad record", detail: error.message } }
            : m
        )
      );
    }
  }

  // Convert campaign to product details for purchase
  function campaignToProductDetails(campaign: SerializedCampaign): ProductDetails {
    const spec = campaign.spec;
    return {
      productId: '1', // Using product ID 1 from DemoPurchase contract
      campaignId: campaign.campaignId,
      title: spec?.title || `Campaign #${campaign.campaignId}`,
      description: spec?.description || 'No description available',
      price: '1.00', // Placeholder - actual price fetched from contract
      currency: 'USDC',
      targetUrl: spec?.targetUrl,
    };
  }

  // Handle successful purchase
  function handlePurchaseSuccess(txHash: string) {
    const successMessage: Message = {
      id: nextId,
      role: 'ai',
      content: `Purchase successful! Your transaction has been confirmed. [View on BaseScan](https://basescan.org/tx/${txHash})`,
    };
    setMessages(prev => [...prev, successMessage]);
    setNextId(id => id + 1);
    setShowPurchaseCard(false);
    setPendingPurchase(null);
    setLastRecommendedCampaign(null);
  }

  // Handle purchase error
  function handlePurchaseError(error: Error) {
    const errorMessage: Message = {
      id: nextId,
      role: 'ai',
      content: `Purchase could not be completed: ${error.message}. Would you like to try again?`,
    };
    setMessages(prev => [...prev, errorMessage]);
    setNextId(id => id + 1);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || !isWhitelisted) return;

    // Check if user gave an affirmative response to purchase
    if (detectAffirmativeResponse(trimmed) && lastRecommendedCampaign) {
      const userMessage: Message = {
        id: nextId,
        role: "user",
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMessage]);
      setNextId((id) => id + 1);
      setInput("");

      // Convert campaign to product details and show purchase modal
      const productDetails = campaignToProductDetails(lastRecommendedCampaign);
      setPendingPurchase(productDetails);
      setShowPurchaseCard(true);

      const confirmMessage: Message = {
        id: nextId + 1,
        role: 'ai',
        content: `Opening purchase confirmation for **${productDetails.title}**...`,
      };
      setMessages((prev) => [...prev, confirmMessage]);
      setNextId((id) => id + 2);
      return;
    }

    const userMessage: Message = {
      id: nextId,
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setNextId((id) => id + 1);
    setInput("");
    setIsLoading(true);

    try {
      const aiText = await fakeAiReply(trimmed);

      const aiMessage: Message = {
        id: nextId + 1,
        role: "ai",
        content: aiText,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setNextId((id) => id + 2);

      // Check if AI recommended a campaign and create ad record if so
      const recommendedCampaign = detectRecommendedCampaign(aiText, campaigns);

      if (recommendedCampaign) {
        // Track the last recommended campaign for purchase flow
        setLastRecommendedCampaign(recommendedCampaign);
        console.log('\nAI recommended campaign:', recommendedCampaign.spec?.title || `Campaign #${recommendedCampaign.campaignId}`);

        if (!hasCreatedAdForCampaign[recommendedCampaign.campaignId] && walletAddress) {
          // Create ad record in background (don't block chat)
          createAdRecord(recommendedCampaign.campaignId, walletAddress);
        }
      }
    } catch (err) {
      const aiMessage: Message = {
        id: nextId + 1,
        role: "ai",
        content: "Sorry, something went wrong.",
      };
      setMessages((prev) => [...prev, aiMessage]);
      setNextId((id) => id + 2);
    } finally {
      setIsLoading(false);
    }
  }

  async function fakeAiReply(prompt: string): Promise<string> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        campaigns,
        walletAddress: walletAddress || null,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Chat API failed:", res.status, err);
      return "Sorry, something went wrong talking to the AI agent.";
    }

    const data = await res.json();
    return typeof data.text === "string" ? data.text : "Sorry, empty response.";
  } catch (error) {
    console.error("Error calling /api/chat:", error);
    return "Sorry, something went wrong talking to the AI agent.";
  }
}


  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 text-gray-900">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <Image
            src="/apex-logo-new.png"
            alt="APEX logo"
            width={100}
            height={40}
            className="h-10 w-auto"
          />
          <span className="text-[10px] rounded-full bg-[#FACC15] px-2 py-0.5 text-black font-semibold">
            demo
          </span>
        </div>

        <div className="m-3">
          <Button className="w-full rounded-full text-xs">
            + New chat
          </Button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-3 text-xs">
          <div className="rounded-3xl bg-muted px-3 py-2">
            <div className="font-semibold">Today</div>
            <div className="mt-1 line-clamp-1 text-muted-foreground">
              London to Denver Flight Booking
            </div>
          </div>

        </div>

        {/* Wallet Connection & Status */}
        <div className="border-t border-gray-200 px-3 py-3 mb-1.25 text-[11px]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-700">Wallet</div>
              <div className="text-gray-500 text-[10px] truncate">
                {isWalletConnected && walletAddress
                  ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                  : "Not connected"}
              </div>
              {isWalletConnected && !isWhitelisted && (
                <div className="mt-1 text-[10px] text-amber-600">
                  Not authorized
                </div>
              )}
              {isWhitelisted && (
                <div className="mt-1 text-[10px] text-green-600">
                  Authorized
                </div>
              )}
            </div>
            <WalletButton />
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-h-0">
        <header className="border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur">
          <h1 className="text-xl font-extrabold">APEX-GPT</h1>
          <p className="text-xs text-muted-foreground">
            The First AI Agent Integrated with APEX
          </p>
        </header>

        <main className="flex flex-1 flex-col min-h-0">
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Start the conversation by typing a message below.
              </div>
            )}

            {messages.map((m) =>
              m.role === "agent-action" ? (
                <div key={m.id} className="flex justify-start">
                  <AgentActionCard action={m.content as AgentAction} />
                </div>
              ) : (
                <div
                  key={m.id}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-3xl px-3 py-2 text-sm shadow-sm ${
                      m.role === "user"
                        ? "bg-white text-gray-900 border border-gray-200"
                        : "bg-muted text-gray-900"
                    }`}
                  >
                    {typeof m.content === "string" && m.role === "ai" ? (
                      <div>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ node, ...props }) => (
                              <a
                                {...props}
                                className="text-primary underline hover:text-primary/80 break-all font-medium"
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div>{m.content as ReactNode}</div>
                    )}
                  </div>
                </div>
              )
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-3xl bg-muted px-3 py-2 text-sm shadow-sm">
                  AI is thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-200 bg-white/90 px-4 py-3 backdrop-blur"
          >
            <div className="flex gap-2">
              <Input
                className="flex-1 rounded-full"
                placeholder={
                  !isWalletConnected
                    ? "Connect your wallet to chat..."
                    : !isWhitelisted
                    ? "Wallet not authorized..."
                    : "Ask me anything..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!isWhitelisted}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading || !isWhitelisted}
                className="rounded-full px-4 py-2 text-sm font-medium bg-[#FACC15] text-black hover:bg-[#FACC15]/90 disabled:opacity-50"
              >
                <svg
                  className={`h-4 w-4 ${isLoading ? "opacity-60" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 4L20 12L4 20L7 12L4 4Z"
                    fill="currentColor"
                  />
                </svg>
              </Button>
            </div>
          </form>
        </main>
      </div>

      {/* Purchase Card Modal */}
      {pendingPurchase && (
        <PurchaseCard
          product={pendingPurchase}
          isOpen={showPurchaseCard}
          onClose={() => {
            setShowPurchaseCard(false);
            setPendingPurchase(null);
            setLastRecommendedCampaign(null);
          }}
          onSuccess={handlePurchaseSuccess}
          onError={handlePurchaseError}
        />
      )}
    </div>
  );
}
