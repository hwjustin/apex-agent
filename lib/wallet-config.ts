"use client";

import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { baseSepolia } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";

// WalletConnect project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "60afa7e692e94972d30babecedbd7c1f";

const metadata = {
  name: "APEX-GPT",
  description: "AI Agent Client Demo for APEX Protocol",
  url: typeof window !== "undefined" ? window.location.origin : "https://apex-gpt.example.com",
  icons: ["/apex-logo-new.png"],
};

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [baseSepolia];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  defaultNetwork: baseSepolia,
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#FACC15",
    "--w3m-border-radius-master": "16px",
  },
});
