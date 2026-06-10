import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";

describe("BasketFlowVault", async function () {
  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();

  it("Should deposit USDT, swap and add liquidity to Moe, and mint vault shares", async function () {
    const [owner, user] = await viem.getWalletClients();

    // 1. Deploy mock ERC20 tokens
    const usdt = await viem.deployContract("MockERC20", ["Tether USD", "USDT"]);
    const usdc = await viem.deployContract("MockERC20", ["USD Coin", "USDC"]);
    const meth = await viem.deployContract("MockERC20", ["Mantle ETH", "mETH"]);
    const lp = await viem.deployContract("MockERC20", ["Moe LP", "MOE-LP"]);

    // 2. Deploy Mock Router
    const router = await viem.deployContract("MockMoeRouter", [lp.address]);

    // 3. Deploy BasketFlowVault
    const vault = await viem.deployContract("BasketFlowVault", [
      lp.address,
      "BasketFlow Conservative",
      "bfCons",
      router.address,
      usdc.address,
      meth.address,
    ]);

    // 4. Set up user balance of USDT (mint 1000 USDT)
    const amountIn = 1000n * 10n ** 18n;
    await usdt.write.mint([user.account.address, amountIn]);

    // Verify user balance
    const userBalanceBefore = await usdt.read.balanceOf([user.account.address]);
    assert.equal(userBalanceBefore, amountIn);

    // 5. User approves Vault to spend USDT
    const userVault = await viem.getContractAt("BasketFlowVault", vault.address, {
      client: { wallet: user },
    });
    const userUsdt = await viem.getContractAt("MockERC20", usdt.address, {
      client: { wallet: user },
    });
    await userUsdt.write.approve([vault.address, amountIn]);

    // 6. User deposits USDT into BasketFlowVault
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    
    // We pass USDT -> USDC path and USDT -> mETH path
    const pathA = [usdt.address, usdc.address];
    const pathB = [usdt.address, meth.address];

    // Since mock router swaps 1-to-1:
    // 500 USDT -> 500 USDC
    // 500 USDT -> 500 mETH
    // addLiquidity mints 500 + 500 = 1000 LP tokens
    // vault mints 1000 shares
    const minShares = 1000n * 10n ** 18n;

    await userVault.write.depositWithERC20([
      usdt.address,
      amountIn,
      minShares,
      pathA,
      pathB,
      0n, // amountAMin
      0n, // amountBMin
      0n, // amountAMinPool
      0n, // amountBMinPool
      deadline,
    ]);

    // 7. Verify user received correct amount of vault shares
    const userShares = await vault.read.balanceOf([user.account.address]);
    assert.equal(userShares, minShares);

    // Verify vault holds the LP tokens
    const vaultLp = await lp.read.balanceOf([vault.address]);
    assert.equal(vaultLp, minShares);

    // Verify user USDT balance is now 0 (except for any leftovers, but in 1-to-1 swap there's no leftovers)
    const userUsdtAfter = await usdt.read.balanceOf([user.account.address]);
    assert.equal(userUsdtAfter, 0n);
  });

  it("Should withdraw shares, remove liquidity, swap back to USDT, and burn shares", async function () {
    const [owner, user] = await viem.getWalletClients();

    // 1. Deploy mock ERC20 tokens
    const usdt = await viem.deployContract("MockERC20", ["Tether USD", "USDT"]);
    const usdc = await viem.deployContract("MockERC20", ["USD Coin", "USDC"]);
    const meth = await viem.deployContract("MockERC20", ["Mantle ETH", "mETH"]);
    const lp = await viem.deployContract("MockERC20", ["Moe LP", "MOE-LP"]);

    // 2. Deploy Mock Router
    const router = await viem.deployContract("MockMoeRouter", [lp.address]);

    // 3. Deploy BasketFlowVault
    const vault = await viem.deployContract("BasketFlowVault", [
      lp.address,
      "BasketFlow Conservative",
      "bfCons",
      router.address,
      usdc.address,
      meth.address,
    ]);

    // 4. Set up user balance and deposit first
    const amountIn = 1000n * 10n ** 18n;
    await usdt.write.mint([user.account.address, amountIn]);

    const userVault = await viem.getContractAt("BasketFlowVault", vault.address, {
      client: { wallet: user },
    });
    const userUsdt = await viem.getContractAt("MockERC20", usdt.address, {
      client: { wallet: user },
    });

    await userUsdt.write.approve([vault.address, amountIn]);

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    await userVault.write.depositWithERC20([
      usdt.address,
      amountIn,
      amountIn, // 1-to-1
      [usdt.address, usdc.address],
      [usdt.address, meth.address],
      0n,
      0n,
      0n,
      0n,
      deadline,
    ]);

    // Shares balance should be 1000 LP
    const sharesAmount = await vault.read.balanceOf([user.account.address]);
    assert.equal(sharesAmount, amountIn);

    // 5. Perform withdrawal
    // When removing 1000 LP:
    // Mock router returns 500 USDC and 500 mETH
    // Swapping 500 USDC -> 500 USDT
    // Swapping 500 mETH -> 500 USDT
    // Total USDT returned = 1000 USDT
    const pathA = [usdc.address, usdt.address];
    const pathB = [meth.address, usdt.address];

    await userVault.write.withdrawToERC20([
      sharesAmount,
      usdt.address,
      0n, // minAmountA
      0n, // minAmountB
      pathA,
      pathB,
      0n, // amountAMinOut
      0n, // amountBMinOut
      amountIn, // minOutputOut (1000 USDT)
      deadline,
    ]);

    // 6. Verify user shares were burned
    const userSharesAfter = await vault.read.balanceOf([user.account.address]);
    assert.equal(userSharesAfter, 0n);

    // Verify user received their USDT back
    const userUsdtAfter = await usdt.read.balanceOf([user.account.address]);
    assert.equal(userUsdtAfter, amountIn);

    // Verify vault holds 0 LP tokens now
    const vaultLpAfter = await lp.read.balanceOf([vault.address]);
    assert.equal(vaultLpAfter, 0n);
  });
});
