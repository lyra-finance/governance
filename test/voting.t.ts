import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { deployTestContracts, TestSystemContractsType } from "./utils/deployTestSystem";
import { DAY_SEC, restoreSnapshot, takeSnapshot, toBN, WEEK_SEC, ZERO_ADDRESS } from "./utils";
import { InitializableAdminUpgradeabilityProxy, LyraSafetyModule } from "../typechain";
import { BigNumber } from "ethers";

describe.only("GovernorBravo voting with stkLyra", function () {
  let admin: SignerWithAddress;
  let proxyAdmin: SignerWithAddress;
  let karpincho: SignerWithAddress;

  let c: TestSystemContractsType;
  let snap: number;

  const vestingAmount: BigNumber = toBN("1000");

  let stakedLyra: LyraSafetyModule;
  let stakedLyraProxy: InitializableAdminUpgradeabilityProxy;

  const COOLDOWN_SECONDS = "3600"; // 1 hour in seconds
  const UNSTAKE_WINDOW = "1800"; // 30 min in seconds

  it("does some voting", async function () {
    [admin, proxyAdmin, karpincho] = await ethers.getSigners();

    c = await deployTestContracts(admin);

    stakedLyraProxy = (await (
      await ethers.getContractFactory("InitializableAdminUpgradeabilityProxy")
    ).deploy()) as InitializableAdminUpgradeabilityProxy;

    const stakedLyraImpl = (await (
      await ethers.getContractFactory("LyraSafetyModule")
    ).deploy(
      c.lyraToken.address,
      c.lyraToken.address,
      COOLDOWN_SECONDS,
      UNSTAKE_WINDOW,
      admin.address,
      admin.address,
      (1000 * 60 * 60).toString(),
    )) as LyraSafetyModule;

    const stakedLyraEncodedInitialize = stakedLyraImpl.interface.encodeFunctionData("initialize", [
      "Staked Lyra",
      "stkLYRA",
      18,
    ]);

    await stakedLyraProxy["initialize(address,address,bytes)"](
      stakedLyraImpl.address,
      proxyAdmin.address,
      stakedLyraEncodedInitialize,
    );

    await c.lyraToken.approve(stakedLyraProxy.address, ethers.constants.MaxUint256);

    stakedLyra = (await ethers.getContractAt("LyraSafetyModule", stakedLyraProxy.address)) as LyraSafetyModule;

    await stakedLyra.configureAssets([
      {
        emissionPerSecond: "100",
        totalStaked: await stakedLyra.totalSupply(),
        underlyingAsset: stakedLyra.address,
      },
    ]);

    await stakedLyra.stake(karpincho.address, vestingAmount);

    const governanceStrategy = await (
      await ethers.getContractFactory("LyraGovernanceStrategy")
    ).deploy(stakedLyra.address);

    const aaveGovernance = await (
      await ethers.getContractFactory("AaveGovernanceV2")
    ).deploy(
      governanceStrategy.address,
      10, // voting delay
      admin.address,
      [admin.address],
    );
    console.log(aaveGovernance.address);
  });

  beforeEach(async () => {
    snap = await takeSnapshot();
  });

  afterEach(async () => {
    await restoreSnapshot(snap);
  });
});
