/**
 * Purchase Configuration
 *
 * Central configuration for the purchase flow. Update these values as needed.
 */

export const PURCHASE_CONFIG = {
  // Contract address - DemoPurchase contract on Base Mainnet
  contractAddress: '0x7f34ec8b18e05af38d771cb50382fa15fc30a1d1' as `0x${string}`,

  // USDC token address on Base Mainnet
  usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,

  // Patterns to detect user wants to buy (case-insensitive)
  affirmativePatterns: [
    /\byes\b/i,
    /\bbuy\b/i,
    /\bpurchase\b/i,
    /\bproceed\b/i,
    /\bbook\b/i,
    /\bconfirm\b/i,
    /\blet'?s?\s*do\s*it\b/i,
    /\bi'?ll?\s*take\s*it\b/i,
    /\bsure\b/i,
    /\bgo\s*ahead\b/i,
  ],

  // AI prompt addition - tells AI to ask about purchase
  purchasePrompt: `When you recommend a product or service, always ask the user: "Would you like to purchase this?" to give them the option to proceed with a transaction.`,

  // BaseScan URL for transaction links (Base Mainnet)
  explorerBaseUrl: 'https://basescan.org/tx/',
};

/**
 * Check if a message indicates the user wants to purchase
 */
export function detectAffirmativeResponse(message: string): boolean {
  const trimmed = message.trim();

  // Check against all patterns
  return PURCHASE_CONFIG.affirmativePatterns.some(pattern => pattern.test(trimmed));
}

/**
 * Check if the purchase contract is configured (not zero address)
 */
export function isPurchaseContractConfigured(): boolean {
  return PURCHASE_CONFIG.contractAddress !== '0x0000000000000000000000000000000000000000';
}
