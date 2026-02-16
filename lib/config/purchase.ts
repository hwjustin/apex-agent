/**
 * Purchase Configuration
 *
 * Central configuration for the purchase flow. Update these values as needed.
 */

export const PURCHASE_CONFIG = {
  // Contract address - DemoPurchase contract on Base Sepolia
  contractAddress: '0xe9a8c0a1f5ac4788840d8820a10555f9da8bf38d' as `0x${string}`,

  // USDC token address on Base Sepolia
  usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`,

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

  // BaseScan URL for transaction links (Base Sepolia)
  explorerBaseUrl: 'https://sepolia.basescan.org/tx/',
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
