import { Signer } from "ethers";
import { ethers } from "hardhat";
import { Lyra, TestStakedToken, TestRewardsVault } from "../../typechain";
import { toBN } from "./index";

export type TestSystemContractsType = {
  lyraToken: Lyra;
  stakedToken: TestStakedToken;
};

export async function deployTestContracts(deployer: Signer): Promise<TestSystemContractsType> {
  console.log("Deploying all contracts for test...");

  const lyraToken = (await (await ethers.getContractFactory("Lyra"))
    .connect(deployer)
    .deploy("Lyra Token", "Lyra", toBN("10000000"))) as Lyra;

  const TestRewardsVaultFactory = await ethers.getContractFactory("TestRewardsVault");
  const testRewardsVault = (await TestRewardsVaultFactory.deploy()) as TestRewardsVault;

  const StakedTokenFactory = await ethers.getContractFactory("TestStakedToken");
  const stakedToken = (await StakedTokenFactory.deploy(
    "Staked Lyra",
    "stkLyra",
    lyraToken.address,
    testRewardsVault.address,
  )) as TestStakedToken;
  await stakedToken.deployed();

  // Set StakedToken as the reward distributor and send some stkLyra to use as rewards
  await testRewardsVault.setRewardsDistributor(stakedToken.address, lyraToken.address);
  await lyraToken.transfer(testRewardsVault.address, toBN("1000000"));

  return {
    lyraToken,
    stakedToken,
  };
}
