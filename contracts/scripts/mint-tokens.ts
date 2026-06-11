import { network } from "hardhat";

async function main() {
  const targetAddress = process.env.TARGET_ADDRESS;
  if (!targetAddress) {
    console.error("Please specify TARGET_ADDRESS env variable");
    process.exit(1);
  }

  const { viem } = await network.create();
  const [deployer] = await viem.getWalletClients();

  const usdtAddress = "0xf3f280d3493b356cfb35055c0edd4ef6f87ee680";
  const usdcAddress = "0xfe6546f15b90a9b740c5079eaab1e4539d46f988";
  const mntAddress = "0xdd9f1deb9fdc4aa92cca8a548b7d313bfb5cd204";
  const methAddress = "0xeb699b700eee9452f6e52bdfa81c62364554e47b";
  const moeAddress = "0x89503b3e0db3cb324451ca7625fe8c27774d86b1";

  console.log(`Minting mock tokens to ${targetAddress} using deployer ${deployer.account.address}...`);

  const usdt = await viem.getContractAt("MockERC20", usdtAddress as `0x${string}`);
  const usdc = await viem.getContractAt("MockERC20", usdcAddress as `0x${string}`);
  const mnt = await viem.getContractAt("MockERC20", mntAddress as `0x${string}`);
  const meth = await viem.getContractAt("MockERC20", methAddress as `0x${string}`);
  const moe = await viem.getContractAt("MockERC20", moeAddress as `0x${string}`);

  const mintAmount = 5000n * 10n ** 18n;

  console.log("Minting USDT...");
  let tx = await usdt.write.mint([targetAddress as `0x${string}`, mintAmount]);
  console.log(`USDT Minted. Tx: ${tx}`);

  console.log("Minting USDC...");
  tx = await usdc.write.mint([targetAddress as `0x${string}`, mintAmount]);
  console.log(`USDC Minted. Tx: ${tx}`);

  console.log("Minting MNT...");
  tx = await mnt.write.mint([targetAddress as `0x${string}`, mintAmount]);
  console.log(`MNT Minted. Tx: ${tx}`);

  console.log("Minting mETH...");
  tx = await meth.write.mint([targetAddress as `0x${string}`, mintAmount]);
  console.log(`mETH Minted. Tx: ${tx}`);

  console.log("Minting MOE...");
  tx = await moe.write.mint([targetAddress as `0x${string}`, mintAmount]);
  console.log(`MOE Minted. Tx: ${tx}`);

  console.log("Minting complete!");
}

main().catch(console.error);
