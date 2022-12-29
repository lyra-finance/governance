import { ethers } from "hardhat";

async function main(): Promise<void> {
  console.log("Deploying TestLiquidityPool...");

  const liquidityPool = await (await ethers.getContractFactory("TestLiquidityPool")).deploy();
  await liquidityPool.deployed();

  console.log("TestLiquidityPool deployed to: ", liquidityPool.address);

  console.log("Deploying TestLiquidityCertificate...");

  const liquidityCertificate = await (
    await ethers.getContractFactory("TestLiquidityCertificate")
  ).deploy("Lyra Liquidity Certificate", "LLC", liquidityPool.address);
  await liquidityCertificate.deployed();

  console.log("TestLiquidityCertificate deployed to: ", liquidityCertificate.address);

  console.log("\n****** Finished Deployment ******");
  console.log("TestLiquidityPool: ", liquidityPool.address);
  console.log("TestLiquidityCertificate: ", liquidityCertificate.address);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
