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
    address: "0x21df544947ba3e8b3c32561399e88b52dc8b2823" as `0x${string}`,
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 18,
    address: "0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2" as `0x${string}`,
  },
  mETH: {
    symbol: "mETH",
    name: "Mantle ETH",
    decimals: 18,
    address: "0xd8a5a9b31c3c0232e196d518e89fd8bf83acad43" as `0x${string}`,
  },
  MNT: {
    symbol: "MNT",
    name: "Mantle Token",
    decimals: 18,
    address: "0xdc11f7e700a4c898ae5caddb1082cffa76512add" as `0x${string}`, // Mock ERC20 representing MNT
  },
  MOE: {
    symbol: "MOE",
    name: "Merchant Moe Token",
    decimals: 18,
    address: "0x51a1ceb83b83f1985a81c295d1ff28afef186e02" as `0x${string}`,
  },
};

// Vault Addresses on Local Host Hardhat Network
export const VAULTS = {
  conservative: {
    id: 1,
    name: "Conservative Care",
    symbol: "bfCons",
    address: "0x0355b7b8cb128fa5692729ab3aaa199c1753f726" as `0x${string}`,
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
    address: "0x202cce504e04bed6fc0521238ddf04bc9e8e15ab" as `0x${string}`,
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
    address: "0xf4b146fba71f41e0592668ffbf264f1d186b2ca8" as `0x${string}`,
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
    address: "0x172076e0166d1f9cc711c77adf8488051744980c" as `0x${string}`,
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
    address: "0x4ee6ecad1c2dae9f525404de8555724e3c35d07b" as `0x${string}`,
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
    address: "0xbec49fa140acaa83533fb00a2bb19bddd0290f25" as `0x${string}`,
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
    address: "0xd84379ceae14aa33c123af12424a37803f885889" as `0x${string}`,
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
    address: "0x2b0d36facd61b71cc05ab8f3d2355ec3631c0dd5" as `0x${string}`,
    description: "Aggressive yield farming with MOE and USDT stablecoins. Maximum potential returns.",
    targetApy: "30-45%",
    risk: "High",
    allocations: [
      { token: TOKENS.MOE, weight: 70 },
      { token: TOKENS.USDT, weight: 30 },
    ],
  },
};

export const ROUTER_ADDRESS = "0x8198f5d8f8cffe8f9c413d98a0a55aeb8ab9fbb7" as `0x${string}`; // Mock Moe Router on Local Network
