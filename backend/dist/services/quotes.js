import { createPublicClient, http, parseAbi } from "viem";
import { RPC_URL, TOKENS, ROUTER_ADDRESS } from "../config.js";
// Viem public client for local network querying
const client = createPublicClient({
    transport: http(RPC_URL),
});
// ABI for the router's swap quoting logic
const ROUTER_ABI = parseAbi([
    "function getAmountsOut(uint amountIn, address[] path) view returns (uint[] memory amounts)"
]);
// Mock prices in USD for fallback computations if the chain is offline
const MOCK_PRICES = {
    USDT: 1.0,
    USDC: 1.0,
    mETH: 3500.0,
    MNT: 0.85,
    MOE: 0.15,
};
export async function calculateQuote({ inputTokenSymbol, amountIn, targetTokenASymbol, targetTokenBSymbol, slippageTolerance = 0.5, }) {
    const inputAddr = TOKENS[inputTokenSymbol];
    const addrA = TOKENS[targetTokenASymbol];
    const addrB = TOKENS[targetTokenBSymbol];
    const amountInParsed = parseFloat(amountIn);
    const amountAIn = amountInParsed / 2;
    const amountBIn = amountInParsed - amountAIn;
    // Paths
    const pathA = [inputAddr, addrA];
    const pathB = [inputAddr, addrB];
    try {
        // Attempt live routing query via router contract
        // We try to call getAmountsOut on the router
        const amountAInBigInt = BigInt(Math.floor(amountAIn * 1e18));
        const amountBInBigInt = BigInt(Math.floor(amountBIn * 1e18));
        let amountAOutBigInt = amountAInBigInt; // 1-to-1 fallback if same token
        if (inputAddr !== addrA) {
            const amountsOutA = await client.readContract({
                address: ROUTER_ADDRESS,
                abi: ROUTER_ABI,
                functionName: "getAmountsOut",
                args: [amountAInBigInt, pathA],
            });
            amountAOutBigInt = amountsOutA[amountsOutA.length - 1];
        }
        let amountBOutBigInt = amountBInBigInt;
        if (inputAddr !== addrB) {
            const amountsOutB = await client.readContract({
                address: ROUTER_ADDRESS,
                abi: ROUTER_ABI,
                functionName: "getAmountsOut",
                args: [amountBInBigInt, pathB],
            });
            amountBOutBigInt = amountsOutB[amountsOutB.length - 1];
        }
        const slippageFactor = 1 - slippageTolerance / 100;
        const minAmountAOutBigInt = BigInt(Math.floor(Number(amountAOutBigInt) * slippageFactor));
        const minAmountBOutBigInt = BigInt(Math.floor(Number(amountBOutBigInt) * slippageFactor));
        return {
            amountAOut: (Number(amountAOutBigInt) / 1e18).toString(),
            amountBOut: (Number(amountBOutBigInt) / 1e18).toString(),
            minAmountAOut: (Number(minAmountAOutBigInt) / 1e18).toString(),
            minAmountBOut: (Number(minAmountBOutBigInt) / 1e18).toString(),
            pathA,
            pathB,
            isMock: false,
        };
    }
    catch (error) {
        // Fallback to Mock mathematics
        const inputPrice = MOCK_PRICES[inputTokenSymbol] || 1.0;
        const priceA = MOCK_PRICES[targetTokenASymbol] || 1.0;
        const priceB = MOCK_PRICES[targetTokenBSymbol] || 1.0;
        // inputAmount * inputPrice = targetAmount * targetPrice
        // targetAmount = (inputAmount * inputPrice) / targetPrice
        const expectedAOut = (amountAIn * inputPrice) / priceA;
        const expectedBOut = (amountBIn * inputPrice) / priceB;
        const slippageFactor = 1 - slippageTolerance / 100;
        const minAOut = expectedAOut * slippageFactor;
        const minBOut = expectedBOut * slippageFactor;
        return {
            amountAOut: expectedAOut.toFixed(6),
            amountBOut: expectedBOut.toFixed(6),
            minAmountAOut: minAOut.toFixed(6),
            minAmountBOut: minBOut.toFixed(6),
            pathA,
            pathB,
            isMock: true,
        };
    }
}
