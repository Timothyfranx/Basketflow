import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 3001;
export const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545"; // Default local Hardhat network

// Local Hardhat Network Contract Address references from frontend/src/contracts.ts
export const TOKENS = {
  USDT: "0xf3f280d3493b356cfb35055c0edd4ef6f87ee680",
  USDC: "0xfe6546f15b90a9b740c5079eaab1e4539d46f988",
  mETH: "0xeb699b700eee9452f6e52bdfa81c62364554e47b",
  MNT: "0xdd9f1deb9fdc4aa92cca8a548b7d313bfb5cd204",
  MOE: "0x89503b3e0db3cb324451ca7625fe8c27774d86b1",
};

export const VAULTS = {
  conservative: "0x2e6fd1e46f539a94931f5194100a87d1ae544228",
  mantleMax: "0x45c371f90d82a993364129bbd311025c2805b6df",
  stableShuffle: "0x63ac1e2de0663dabf69b39dae8537a195c0f92c1",
  moePowerhouse: "0x89a3d93fa1400c924e9f67b3d35de6c272e0f856",
  methAlpha: "0x2da07c38b587cf0513baa39ac2ba7abb6e0f04bc",
  usdcMntYield: "0x07927a4ce9207968262a9d2a65c230df20a3aa79",
  liquidGold: "0x2666955a9c88976641792dbb8e6e981111ed3b1b",
  hyperDrive: "0x0a67e710d4580ddd7721d0ead216836e2211b48d",
};

export const ROUTER_ADDRESS = "0xe7c1e5487787e5c478ac68478d90f9488053b9a0"; // Mock Moe Router

export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "success", type: "bool" }],
    type: "function",
  },
] as const;

export const VAULT_ABI = [
  {
    inputs: [],
    name: "totalAssets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "asset",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
