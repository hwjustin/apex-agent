import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";
import { AppKitInit } from "@/components/AppKitInit";

export const metadata: Metadata = {
  title: "APEX-GPT",
  description: "AI Agent Client Demo for APEX Protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="base:app_id" content="698d07c4b3590846b383987e" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased h-screen overflow-hidden">
        <AppKitInit />
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
