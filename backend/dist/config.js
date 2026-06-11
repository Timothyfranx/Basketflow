import dotenv from "dotenv";
dotenv.config();
export const PORT = process.env.PORT || 3001;
export const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545"; // Default local Hardhat network
// Local Hardhat Network Contract Address references from frontend/src/contracts.ts
export const TOKENS = {
    USDT: "0x21df544947ba3e8b3c32561399e88b52dc8b2823",
    USDC: "0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2",
    mETH: "0xd8a5a9b31c3c0232e196d518e89fd8bf83acad43",
    MNT: "0xdc11f7e700a4c898ae5caddb1082cffa76512add",
    MOE: "0x51a1ceb83b83f1985a81c295d1ff28afef186e02",
};
export const VAULTS = {
    conservative: "0x0355b7b8cb128fa5692729ab3aaa199c1753f726",
    mantleMax: "0x202cce504e04bed6fc0521238ddf04bc9e8e15ab",
    stableShuffle: "0xf4b146fba71f41e0592668ffbf264f1d186b2ca8",
    moePowerhouse: "0x172076e0166d1f9cc711c77adf8488051744980c",
    methAlpha: "0x4ee6ecad1c2dae9f525404de8555724e3c35d07b",
    usdcMntYield: "0xbec49fa140acaa83533fb00a2bb19bddd0290f25",
    liquidGold: "0xd84379ceae14aa33c123af12424a37803f885889",
    hyperDrive: "0x2b0d36facd61b71cc05ab8f3d2355ec3631c0dd5",
};
export const ROUTER_ADDRESS = "0x8198f5d8f8cffe8f9c413d98a0a55aeb8ab9fbb7"; // Mock Moe Router
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
];
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
];
