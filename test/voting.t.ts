import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { deployTestContracts, TestSystemContractsType } from "./utils/deployTestSystem";
import {
  DAY_SEC,
  fastForward,
  mineBlock,
  restoreSnapshot,
  takeSnapshot,
  toBN,
  toBytes32,
  WEEK_SEC,
  ZERO_ADDRESS
} from "./utils";
import {AaveGovernanceV2, Executor, InitializableAdminUpgradeabilityProxy, LyraSafetyModule} from "../typechain";
import {expect} from "./utils/testSetup";

describe.only("GovernorBravo voting with stkLyra", function () {
  let admin: SignerWithAddress;
  let proxyAdmin: SignerWithAddress;
  let alice: SignerWithAddress;

  let c: TestSystemContractsType;
  let snap: number;

  let stakedLyra: LyraSafetyModule;
  let stakedLyraProxy: InitializableAdminUpgradeabilityProxy;

  const COOLDOWN_SECONDS = "3600"; // 1 hour in seconds
  const UNSTAKE_WINDOW = "1800"; // 30 min in seconds

  it("does some voting", async function () {
    [admin, proxyAdmin, alice] = await ethers.getSigners();

    c = await deployTestContracts(admin);

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


    stakedLyraProxy = (await (
      await ethers.getContractFactory("InitializableAdminUpgradeabilityProxy")
    ).deploy()) as InitializableAdminUpgradeabilityProxy;

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

    stakedLyra = (await ethers.getContractAt("LyraSafetyModule", stakedLyraProxy.address)) as LyraSafetyModule;

    await c.lyraToken.approve(stakedLyra.address, ethers.constants.MaxUint256);

    await stakedLyra.configureAssets([
      {
        emissionPerSecond: "100",
        totalStaked: await stakedLyra.totalSupply(),
        underlyingAsset: stakedLyra.address,
      },
    ]);

    await stakedLyra.stake(alice.address, toBN('650000'));

    const governanceStrategy = await (
      await ethers.getContractFactory("LyraGovernanceStrategy")
    ).deploy(stakedLyra.address);

    const aaveGovernance = await (
      await ethers.getContractFactory("AaveGovernanceV2")
    ).deploy(
      governanceStrategy.address,
      5, // voting delay - can only start voting after this many blocks
      admin.address,
      [admin.address],
    ) as AaveGovernanceV2;
    console.log(aaveGovernance.address);


    const executor = await (
      await ethers.getContractFactory("Executor")
    ).deploy(
      // admin
      aaveGovernance.address,
      // delay
      7 * DAY_SEC,
      // grace period
      5 * DAY_SEC,
      // min delay
      3 * DAY_SEC,
      // max delay
      12 * DAY_SEC,
      125,
      // vote duration
      10, // number of blocks vote lasts after the voting delay
      // vote differential: percentage of supply that `for` votes need to be over `against`
      650,
      // minimum quorum
      650
    ) as Executor;
    console.log(executor.address);

    await aaveGovernance.authorizeExecutors([executor.address]);

    await c.lyraToken.connect(admin).transfer(executor.address, toBN('1000'));

    // Note: must have 6.5% of the total supply staked
    const tx = await c.lyraToken.populateTransaction.transfer(alice.address, toBN('100'));

    console.log("\ncreate proposal\n");

    await aaveGovernance.connect(alice).create(
      executor.address,
      [c.lyraToken.address],
      [0],
      [''],
      [tx.data as string],
      [false],
      toBytes32('')
    )

    console.log("\nvoting\n");

    // cannot vote before the waiting period ends
    await expect(aaveGovernance.connect(alice).submitVote(0, true)).revertedWith("VOTING_CLOSED");
    await skipBlocks(6);
    await aaveGovernance.connect(alice).submitVote(0, true);

    console.log("\nqueue\n");
    // cannot queue before voting period ends
    await expect(aaveGovernance.connect(admin).queue(0)).revertedWith("INVALID_STATE_FOR_QUEUE");
    await skipBlocks(10);
    await aaveGovernance.connect(admin).queue(0);

    console.log("\nexecute\n");
    // canot execute before timelock ends
    await expect(aaveGovernance.connect(admin).execute(0)).revertedWith("TIMELOCK_NOT_FINISHED");
    await fastForward(8 * DAY_SEC);
    await aaveGovernance.connect(admin).execute(0);

    // tokens are transferred successfully
    expect(await c.lyraToken.balanceOf(alice.address)).eq(toBN('100'));
    expect(await c.lyraToken.balanceOf(executor.address)).eq(toBN('900'));
  });

  beforeEach(async () => {
    snap = await takeSnapshot();
  });

  afterEach(async () => {
    await restoreSnapshot(snap);
  });
});


async function skipBlocks(n: number) {
  for (let i=0;i<n;i++) {
    await mineBlock();
  }
}