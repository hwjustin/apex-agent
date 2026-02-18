/**
 * CampaignRegistry Contract Configuration
 *
 * Contract Address: 0x8c2b543fa5d8740e40306e372dd4bcf6af3f5266 (Base Mainnet)
 * This contract allows advertisers to create and manage campaigns on the APEX network.
 */

export const CAMPAIGN_REGISTRY_ADDRESS = '0x8c2b543fa5d8740e40306e372dd4bcf6af3f5266' as const;

// TypeScript types for Campaign (from blockchain)
export interface Campaign {
  campaignId: bigint;
  advertiserId: bigint;
  budget: { amount: bigint; spent: bigint; cpaAmount: bigint; tokenAddress: `0x${string}` };
  startTime: bigint;
  expiryTime: bigint;
  spec: `0x${string}`;
}

// Campaign specification structure (decoded from spec hex)
export interface CampaignSpec {
  title?: string;
  description?: string;
  targetUrl?: string;
  rules?: Record<string, unknown>;
}

// Serialized campaign for JSON responses (bigint -> string)
export interface SerializedCampaign {
  campaignId: string;
  advertiserId: string;
  budget: { amount: string; spent: string; cpaAmount: string; tokenAddress: string };
  startTime: string;
  expiryTime: string;
  spec: CampaignSpec | null;
  status: 'active' | 'scheduled' | 'ended';
}

export const CAMPAIGN_REGISTRY_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_identityRegistry",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "campaignExists",
    "inputs": [
      {
        "name": "campaignId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "exists",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createCampaign",
    "inputs": [
      {
        "name": "advertiserId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "budgetAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "budgetTokenAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "cpaAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "startTime",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "expiryTime",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "spec",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "campaignId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getCampaign",
    "inputs": [
      {
        "name": "campaignId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "campaign",
        "type": "tuple",
        "internalType": "struct ICampaignRegistry.Campaign",
        "components": [
          {
            "name": "campaignId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "advertiserId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "budget",
            "type": "tuple",
            "internalType": "struct ICampaignRegistry.Budget",
            "components": [
              {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "spent",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "cpaAmount",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "tokenAddress",
                "type": "address",
                "internalType": "address"
              }
            ]
          },
          {
            "name": "startTime",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "expiryTime",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "spec",
            "type": "bytes",
            "internalType": "bytes"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCampaignCount",
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
    "name": "getCampaignRemainingBudget",
    "inputs": [
      {
        "name": "campaignId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "remaining",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCampaignsByAdvertiser",
    "inputs": [
      {
        "name": "advertiserId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "campaignIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "identityRegistry",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IERC721"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isActionProcessed",
    "inputs": [
      {
        "name": "actionHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "processed",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isCampaignActive",
    "inputs": [
      {
        "name": "campaignId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "active",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "processAction",
    "inputs": [
      {
        "name": "campaignId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "publisherId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "validatorId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "actionHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateCampaign",
    "inputs": [
      {
        "name": "campaignId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "cpaAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "startTime",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "expiryTime",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "spec",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "success",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "withdrawRemainingBudget",
    "inputs": [
      {
        "name": "campaignId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "amountWithdrawn",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "ActionProcessed",
    "inputs": [
      {
        "name": "campaignId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "publisherId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "validatorId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "paymentAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "actionHash",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "BudgetWithdrawn",
    "inputs": [
      {
        "name": "campaignId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "advertiserId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "amountWithdrawn",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "CampaignCreated",
    "inputs": [
      {
        "name": "campaignId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "advertiserId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "budgetAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "budgetTokenAddress",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "cpaAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "startTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "expiryTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "CampaignUpdated",
    "inputs": [
      {
        "name": "campaignId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "cpaAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "startTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "expiryTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "ActionAlreadyProcessed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CampaignAlreadyExpired",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CampaignNotActive",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CampaignNotFound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CampaignStillActive",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InsufficientBudget",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidBudgetAmount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidCpaAmount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidTimeRange",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidTokenAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TransferFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnauthorizedCaller",
    "inputs": []
  }
] as const;
