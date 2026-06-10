import { network } from "hardhat";

async function main() {
  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  console.log("Deploying contracts with deployer:", deployer.account.address);

  // 1. Deploy mock ERC20 tokens
  console.log("Deploying Mock ERC20 tokens...");
  const usdt = await viem.deployContract("MockERC20", ["Tether USD", "USDT"]);
  const usdc = await viem.deployContract("MockERC20", ["USD Coin", "USDC"]);
  const meth = await viem.deployContract("MockERC20", ["Mantle ETH", "mETH"]);
  const mnt = await viem.deployContract("MockERC20", ["Mantle Token", "MNT"]);
  const moe = await viem.deployContract("MockERC20", ["Merchant Moe", "MOE"]);
  const lp = await viem.deployContract("MockERC20", ["Moe LP", "MOE-LP"]);

  console.log("Mock ERC20s deployed:");
  console.log(`USDT: ${usdt.address}`);
  console.log(`USDC: ${usdc.address}`);
  console.log(`mETH: ${meth.address}`);
  console.log(`MNT: ${mnt.address}`);
  console.log(`MOE: ${moe.address}`);
  console.log(`LP: ${lp.address}`);

  // 2. Deploy Mock Router
  console.log("Deploying Mock Router...");
  const router = await viem.deployContract("MockMoeRouter", [lp.address]);
  console.log(`Router: ${router.address}`);

  // 3. Deploy Vaults
  console.log("Deploying Vaults...");
  const conservative = await viem.deployContract("BasketFlowVault", [
    lp.address,
    "BasketFlow Conservative",
    "bfCons",
    router.address,
    usdc.address,
    meth.address,
  ]);
  console.log(`Conservative Vault: ${conservative.address}`);

  const mantleMax = await viem.deployContract("BasketFlowVault", [
    lp.address,
    "BasketFlow Mantle Max",
    "bfMax",
    router.address,
    mnt.address,
    meth.address,
  ]);
  console.log(`Mantle Max Vault: ${mantleMax.address}`);

  const stableShuffle = await viem.deployContract("BasketFlowVault", [
    lp.address,
    "BasketFlow Stable Shuffle",
    "bfStable",
    router.address,
    usdc.address,
    usdt.address,
  ]);
  console.log(`Stable Shuffle Vault: ${stableShuffle.address}`);

  const moePowerhouse = await viem.deployContract("BasketFlowVault", [
    lp.address,
    "BasketFlow Moe Powerhouse",
    "bfMoe",
    router.address,
    moe.address,
    mnt.address,
  ]);
  console.log(`Moe Powerhouse Vault: ${moePowerhouse.address}`);

  const methAlpha = await viem.deployContract("BasketFlowVault", [
    lp.address,
    "BasketFlow mETH Alpha",
    "bfmETH",
    router.address,
    meth.address,
    mnt.address,
  ]);
  console.log(`mETH Alpha Vault: ${methAlpha.address}`);

  const usdcMntYield = await viem.deployContract("BasketFlowVault", [
    lp.address,
    "BasketFlow USDC-MNT Yield",
    "bfMntUsdc",
    router.address,
    usdc.address,
    mnt.address,
  ]);
  console.log(`USDC-MNT Yield Vault: ${usdcMntYield.address}`);

  const liquidGold = await viem.deployContract("BasketFlowVault", [
    lp.address,
    "BasketFlow Liquid Gold",
    "bfGold",
    router.address,
    meth.address,
    usdt.address,
  ]);
  console.log(`Liquid Gold Vault: ${liquidGold.address}`);

  const hyperDrive = await viem.deployContract("BasketFlowVault", [
    lp.address,
    "BasketFlow MOE Hyperdrive",
    "bfHyper",
    router.address,
    moe.address,
    usdt.address,
  ]);
  console.log(`MOE Hyperdrive Vault: ${hyperDrive.address}`);

  // Mint some mock tokens to default Hardhat accounts so they can test immediately
  const accounts = await viem.getWalletClients();
  const mintAmount = 5000n * 10n ** 18n;
  for (const acc of accounts) {
    await usdt.write.mint([acc.account.address, mintAmount]);
    await usdc.write.mint([acc.account.address, mintAmount]);
    await mnt.write.mint([acc.account.address, mintAmount]);
    console.log(`Minted 5000 USDT/USDC/MNT to ${acc.account.address}`);
  }

  console.log("Deployment complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
