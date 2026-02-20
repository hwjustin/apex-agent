/**
 * AdRegistry Contract Configuration
 *
 * Contract Address: 0x5734e51dc16802b9724f4e1b877b39ccc01985c2 (Base Mainnet)
 *
 * NOTE: This contract has been modified to allow publisher wallets to create ads.
 *
 * This contract allows publishers to create ad records when displaying campaigns.
 */

export const AD_REGISTRY_ADDRESS = '0x5734e51dc16802b9724f4e1b877b39ccc01985c2' as const;

// TypeScript types for Ad (from blockchain)
export interface Ad {
  adId: bigint;
  campaignId: bigint;
  advertiserId: bigint;
  publisherId: bigint;
  startTime: bigint;
  metadata: `0x${string}`;
}

// Serialized ad for JSON responses (bigint -> string)
export interface SerializedAd {
  adId: string;
  campaignId: string;
  advertiserId: string;
  publisherId: string;
  startTime: string;
  metadata: string;
}

export const AD_REGISTRY_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_identityRegistry",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_campaignRegistry",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "adExists",
    "inputs": [
      {
        "name": "adId",
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
    "name": "campaignRegistry",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract ICampaignRegistry"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createAd",
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
        "name": "startTime",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "metadata",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "adId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getAd",
    "inputs": [
      {
        "name": "adId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "ad",
        "type": "tuple",
        "internalType": "struct IAdRegistry.Ad",
        "components": [
          {
            "name": "adId",
            "type": "uint256",
            "internalType": "uint256"
          },
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
            "name": "publisherId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "startTime",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "metadata",
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
    "name": "getAdCount",
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
    "name": "getAdsByAdvertiser",
    "inputs": [
      {
        "name": "advertiserId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "adIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAdsByCampaign",
    "inputs": [
      {
        "name": "campaignId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "adIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAdsByPublisher",
    "inputs": [
      {
        "name": "publisherId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "adIds",
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
    "name": "updateAd",
    "inputs": [
      {
        "name": "adId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "metadata",
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
    "type": "event",
    "name": "AdCreated",
    "inputs": [
      {
        "name": "adId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
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
        "name": "publisherId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "startTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "AdUpdated",
    "inputs": [
      {
        "name": "adId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "metadata",
        "type": "bytes",
        "indexed": false,
        "internalType": "bytes"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AdNotFound",
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
    "name": "InvalidStartTime",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnauthorizedCaller",
    "inputs": []
  }
] as const;
