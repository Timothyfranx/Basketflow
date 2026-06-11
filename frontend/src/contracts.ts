// SPDX-License-Identifier: MIT

// ABIs for our contracts (simplified for frontend calls)
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
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "remaining", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    type: "function",
  },
] as const;

export const VAULT_ABI = [
  {
    inputs: [
      { name: "inputToken", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "minShares", type: "uint256" },
      { name: "pathA", type: "address[]" },
      { name: "pathB", type: "address[]" },
      { name: "amountAMin", type: "uint256" },
      { name: "amountBMin", type: "uint256" },
      { name: "amountAMinPool", type: "uint256" },
      { name: "amountBMinPool", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    name: "depositWithERC20",
    outputs: [{ name: "shares", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "shares", type: "uint256" },
      { name: "outputToken", type: "address" },
      { name: "minAmountA", type: "uint256" },
      { name: "minAmountB", type: "uint256" },
      { name: "pathA", type: "address[]" },
      { name: "pathB", type: "address[]" },
      { name: "amountAMinOut", type: "uint256" },
      { name: "amountBMinOut", type: "uint256" },
      { name: "minOutputOut", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    name: "withdrawToERC20",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "assets", type: "uint256" }],
    name: "previewDeposit",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "shares", type: "uint256" }],
    name: "previewRedeem",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
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
  {
    inputs: [],
    name: "tokenA",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tokenB",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Token Addresses on Local Host Hardhat Network
export const TOKENS = {
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 18,
    address: "0xf3f280d3493b356cfb35055c0edd4ef6f87ee680" as `0x${string}`,
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 18,
    address: "0xfe6546f15b90a9b740c5079eaab1e4539d46f988" as `0x${string}`,
  },
  mETH: {
    symbol: "mETH",
    name: "Mantle ETH",
    decimals: 18,
    address: "0xeb699b700eee9452f6e52bdfa81c62364554e47b" as `0x${string}`,
  },
  MNT: {
    symbol: "MNT",
    name: "Mantle Token",
    decimals: 18,
    address: "0xdd9f1deb9fdc4aa92cca8a548b7d313bfb5cd204" as `0x${string}`, // Mock ERC20 representing MNT
  },
  MOE: {
    symbol: "MOE",
    name: "Merchant Moe Token",
    decimals: 18,
    address: "0x89503b3e0db3cb324451ca7625fe8c27774d86b1" as `0x${string}`,
  },
};

// Vault Addresses on Local Host Hardhat Network
export const VAULTS = {
  conservative: {
    id: 1,
    name: "Conservative Care",
    symbol: "bfCons",
    address: "0x2e6fd1e46f539a94931f5194100a87d1ae544228" as `0x${string}`,
    description: "Safe, steady income. Sleep at night.",
    targetApy: "8-12%",
    risk: "Low",
    allocations: [
      { token: TOKENS.USDC, weight: 50 },
      { token: TOKENS.mETH, weight: 50 },
    ],
  },
  mantleMax: {
    id: 2,
    name: "Mantle Max",
    symbol: "bfMax",
    address: "0x45c371f90d82a993364129bbd311025c2805b6df" as `0x${string}`,
    description: "Mantle native. Higher returns. You picked the right chain.",
    targetApy: "18-25%",
    risk: "Medium",
    allocations: [
      { token: TOKENS.MNT, weight: 40 },
      { token: TOKENS.mETH, weight: 30 },
      { token: TOKENS.MOE, weight: 30 },
    ],
  },
  stableShuffle: {
    id: 3,
    name: "Stable Shuffle",
    symbol: "bfStable",
    address: "0x63ac1e2de0663dabf69b39dae8537a195c0f92c1" as `0x${string}`,
    description: "The safest play. Literally just free money.",
    targetApy: "4-7%",
    risk: "Minimal",
    allocations: [
      { token: TOKENS.USDC, weight: 50 },
      { token: TOKENS.USDT, weight: 50 },
    ],
  },
  moePowerhouse: {
    id: 4,
    name: "Moe Powerhouse",
    symbol: "bfMoe",
    address: "0x89a3d93fa1400c924e9f67b3d35de6c272e0f856" as `0x${string}`,
    description: "High yield strategy utilizing the Merchant Moe token. Maximum growth potential.",
    targetApy: "25-35%",
    risk: "High",
    allocations: [
      { token: TOKENS.MOE, weight: 60 },
      { token: TOKENS.MNT, weight: 40 },
    ],
  },
  methAlpha: {
    id: 5,
    name: "mETH Alpha",
    symbol: "bfmETH",
    address: "0x2da07c38b587cf0513baa39ac2ba7abb6e0f04bc" as `0x${string}`,
    description: "Liquid-staked ETH paired with Mantle gas tokens. Balanced exposure with auto-compounding.",
    targetApy: "12-18%",
    risk: "Medium",
    allocations: [
      { token: TOKENS.mETH, weight: 50 },
      { token: TOKENS.MNT, weight: 50 },
    ],
  },
  usdcMntYield: {
    id: 6,
    name: "USDC-MNT Yield",
    symbol: "bfMntUsdc",
    address: "0x07927a4ce9207968262a9d2a65c230df20a3aa79" as `0x${string}`,
    description: "Earn solid yield on the USDC/MNT pair. A stable USD base with MNT price exposure.",
    targetApy: "10-15%",
    risk: "Medium",
    allocations: [
      { token: TOKENS.USDC, weight: 50 },
      { token: TOKENS.MNT, weight: 50 },
    ],
  },
  liquidGold: {
    id: 7,
    name: "Liquid Gold",
    symbol: "bfGold",
    address: "0x2666955a9c88976641792dbb8e6e981111ed3b1b" as `0x${string}`,
    description: "Liquid-staked ETH combined with USDT stablecoins. Moderate risk and reliable APY.",
    targetApy: "14-20%",
    risk: "Medium",
    allocations: [
      { token: TOKENS.mETH, weight: 50 },
      { token: TOKENS.USDT, weight: 50 },
    ],
  },
  hyperDrive: {
    id: 8,
    name: "MOE Hyperdrive",
    symbol: "bfHyper",
    address: "0x0a67e710d4580ddd7721d0ead216836e2211b48d" as `0x${string}`,
    description: "Aggressive yield farming with MOE and USDT stablecoins. Maximum potential returns.",
    targetApy: "30-45%",
    risk: "High",
    allocations: [
      { token: TOKENS.MOE, weight: 70 },
      { token: TOKENS.USDT, weight: 30 },
    ],
  },
};

export const ROUTER_ADDRESS = "0xe7c1e5487787e5c478ac68478d90f9488053b9a0" as `0x${string}`; // Mock Moe Router on Local Network
