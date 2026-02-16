/**
 * usePurchase Hook
 *
 * Custom React hook to execute purchases via smart contract.
 * Handles USDC approval + purchaseProduct flow.
 * User's wallet signs the transactions (not server-side).
 */

import { useState } from 'react';
import { useWalletClient, usePublicClient } from 'wagmi';
import {
  PURCHASE_CONTRACT_ADDRESS,
  PURCHASE_CONTRACT_ABI,
  ProductDetails,
} from '@/lib/contracts/purchaseContract';
import { isPurchaseContractConfigured, PURCHASE_CONFIG } from '@/lib/config/purchase';

export type PurchaseStatus = 'idle' | 'approving' | 'pending' | 'confirming' | 'success' | 'error';

// Minimal ERC-20 ABI for approve + allowance
const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

interface UsePurchaseReturn {
  executePurchase: (product: ProductDetails, quantity?: number) => Promise<string>;
  status: PurchaseStatus;
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
  txHash: string | null;
  reset: () => void;
}

export function usePurchase(): UsePurchaseReturn {
  const [status, setStatus] = useState<PurchaseStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const isLoading = status === 'approving' || status === 'pending' || status === 'confirming';
  const isSuccess = status === 'success';

  const reset = () => {
    setStatus('idle');
    setError(null);
    setTxHash(null);
  };

  const executePurchase = async (
    product: ProductDetails,
    quantity: number = 1
  ): Promise<string> => {
    reset();
    setStatus('approving');

    try {
      if (!isPurchaseContractConfigured()) {
        throw new Error(
          'Purchase contract not configured. Please update the contract address in lib/config/purchase.ts'
        );
      }

      if (!walletClient) {
        throw new Error('Wallet not connected. Please connect your wallet to make a purchase.');
      }

      if (!publicClient) {
        throw new Error('Public client not available');
      }

      const productId = BigInt(product.productId || product.campaignId);

      // Fetch product details from contract to get the exact price (in USDC units)
      let priceAmount: bigint;
      try {
        const productData = await publicClient.readContract({
          address: PURCHASE_CONTRACT_ADDRESS,
          abi: PURCHASE_CONTRACT_ABI,
          functionName: 'getProduct',
          args: [productId],
        }) as any;

        priceAmount = productData.priceAmount;
        console.log('[Purchase] Product fetched from contract:', {
          productId: productId.toString(),
          name: productData.name,
          priceUSDC: (Number(priceAmount) / 1e6).toFixed(2),
          isActive: productData.isActive,
        });

        if (!productData.isActive) {
          throw new Error('Product is not active');
        }
      } catch (error: any) {
        if (error.message === 'Product is not active') throw error;
        console.error('[Purchase] Failed to fetch product:', error);
        // Fallback: 1 USDC = 1,000,000 units
        priceAmount = BigInt(1_000_000);
        console.log('[Purchase] Using fallback price: 1 USDC');
      }

      // Step 1: Check current USDC allowance
      const currentAllowance = await publicClient.readContract({
        address: PURCHASE_CONFIG.usdcAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [walletClient.account.address, PURCHASE_CONTRACT_ADDRESS],
      });

      console.log('[Purchase] Current USDC allowance:', currentAllowance.toString());

      // Step 2: Approve USDC if needed
      if (currentAllowance < priceAmount) {
        console.log('[Purchase] Approving USDC spend:', priceAmount.toString());

        const approveHash = await walletClient.writeContract({
          address: PURCHASE_CONFIG.usdcAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [PURCHASE_CONTRACT_ADDRESS, priceAmount],
        });

        console.log('[Purchase] Approval tx sent:', approveHash);

        // Wait for approval confirmation
        const approveReceipt = await publicClient.waitForTransactionReceipt({
          hash: approveHash,
          confirmations: 1,
        });

        if (approveReceipt.status === 'reverted') {
          throw new Error('USDC approval transaction reverted');
        }

        console.log('[Purchase] USDC approved');
      } else {
        console.log('[Purchase] Sufficient allowance, skipping approval');
      }

      // Step 3: Execute purchase
      setStatus('pending');

      console.log('[Purchase] Executing purchase:', {
        productId: productId.toString(),
        priceUSDC: (Number(priceAmount) / 1e6).toFixed(2),
      });

      // Simulate the transaction first
      try {
        await publicClient.simulateContract({
          address: PURCHASE_CONTRACT_ADDRESS,
          abi: PURCHASE_CONTRACT_ABI,
          functionName: 'purchaseProduct',
          args: [productId],
          account: walletClient.account,
        });
      } catch (simulationError: any) {
        console.error('[Purchase] Transaction simulation failed:', simulationError);

        if (simulationError.message?.includes('ProductNotFound')) {
          throw new Error('Product not found');
        } else if (simulationError.message?.includes('ProductNotActive')) {
          throw new Error('Product is not active');
        } else if (simulationError.message?.includes('InvalidPaymentAmount')) {
          throw new Error('Invalid payment amount - check USDC balance');
        } else if (simulationError.message?.includes('insufficient')) {
          throw new Error('Insufficient USDC balance');
        } else {
          throw new Error(
            `Transaction would fail: ${simulationError.shortMessage || simulationError.message}`
          );
        }
      }

      // Send the purchase transaction (no ETH value - pays in USDC)
      const hash = await walletClient.writeContract({
        address: PURCHASE_CONTRACT_ADDRESS,
        abi: PURCHASE_CONTRACT_ABI,
        functionName: 'purchaseProduct',
        args: [productId],
      });

      console.log('[Purchase] Transaction sent:', hash);
      setTxHash(hash);
      setStatus('confirming');

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      console.log('[Purchase] Transaction confirmed:', receipt);

      if (receipt.status === 'reverted') {
        throw new Error('Transaction reverted');
      }

      setStatus('success');
      console.log(
        '[Purchase] Success! View on explorer:',
        `${PURCHASE_CONFIG.explorerBaseUrl}${hash}`
      );
      return hash;
    } catch (err: any) {
      console.error('[Purchase] Error:', err);
      const errorMessage = err.message || 'Unknown error occurred';
      setError(new Error(errorMessage));
      setStatus('error');
      throw err;
    }
  };

  return {
    executePurchase,
    status,
    isLoading,
    isSuccess,
    error,
    txHash,
    reset,
  };
}
