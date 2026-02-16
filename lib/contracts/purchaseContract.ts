/**
 * DemoPurchase Contract Configuration
 *
 * Contract on Base Mainnet (address configured in lib/config/purchase.ts)
 * This contract allows users to purchase products from advertisers.
 */

import { PURCHASE_CONFIG } from '@/lib/config/purchase';

export const PURCHASE_CONTRACT_ADDRESS = PURCHASE_CONFIG.contractAddress;

// TypeScript types for DemoPurchase
export interface Product {
  productId: bigint;
  advertiserId: bigint;
  name: string;
  description: string;
  priceAmount: bigint;
  isActive: boolean;
}

export interface Purchase {
  purchaseId: bigint;
  productId: bigint;
  buyer: `0x${string}`;
  amount: bigint;
  timestamp: bigint;
}

// Product details for UI (with string types for display)
export interface ProductDetails {
  productId: string;
  campaignId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  targetUrl?: string;
}

// DemoPurchase Contract ABI
export const PURCHASE_CONTRACT_ABI = [
  {
    "type": "function",
    "name": "purchaseProduct",
    "inputs": [
      {
        "name": "productId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "purchaseId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getProduct",
    "inputs": [
      {
        "name": "productId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "product",
        "type": "tuple",
        "internalType": "struct IDemoPurchase.Product",
        "components": [
          {
            "name": "productId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "advertiserId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "name",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "description",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "priceAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "isActive",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPurchase",
    "inputs": [
      {
        "name": "purchaseId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "purchase",
        "type": "tuple",
        "internalType": "struct IDemoPurchase.Purchase",
        "components": [
          {
            "name": "purchaseId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "productId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "buyer",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "amount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "timestamp",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getProductCount",
    "inputs": [],
    "outputs": [
      {
        "name": "count",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPurchaseCount",
    "inputs": [],
    "outputs": [
      {
        "name": "count",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "ProductPurchased",
    "inputs": [
      {
        "name": "purchaseId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "productId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "buyer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "ProductNotFound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ProductNotActive",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidPaymentAmount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PaymentFailed",
    "inputs": []
  }
] as const;
