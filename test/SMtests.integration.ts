import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { deployTestContracts, TestSystemContractsType } from "./utils/deployTestSystem";
import { expect } from "chai";
import { fastForward, restoreSnapshot, takeSnapshot, toBN } from "./utils";
import { InitializableAdminUpgradeabilityProxy, LyraSafetyModule } from "../typechain";
import { BigNumber } from "ethers";

describe("VestingEscrow/StakedLyra - Integration", function () {
  let admin: SignerWithAddress;
  let proxyAdmin: SignerWithAddress;
  let alice: SignerWithAddress;

  let c: TestSystemContractsType;
  let snap: number;

  const vestingAmount: BigNumber = toBN("1000");

  let stakedLyra: LyraSafetyModule;
  let stakedLyraProxy: InitializableAdminUpgradeabilityProxy;

  const COOLDOWN_SECONDS = "3600"; // 1 hour in seconds
  const UNSTAKE_WINDOW = "1800"; // 30 min in seconds

  before(async function () {
    [admin, proxyAdmin, alice] = await ethers.getSigners();

    c = await deployTestContracts(admin);

    stakedLyraProxy = (await (
      await ethers.getContractFactory("InitializableAdminUpgradeabilityProxy")
    ).deploy()) as InitializableAdminUpgradeabilityProxy;

    const stakedLyraImpl = (await (
      await ethers.getContractFactory("LyraSafetyModule")
    ).deploy(
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
  });

  beforeEach(async () => {
    snap = await takeSnapshot();
  });

  afterEach(async () => {
    await restoreSnapshot(snap);
  });

  it("should start the staking cooldown period", async () => {
    await stakedLyra.stake(alice.address, vestingAmount);

    await expect(stakedLyra.connect(alice).redeem(alice.address, vestingAmount)).revertedWith(
      "UNSTAKE_WINDOW_FINISHED",
    );

    await stakedLyra.connect(alice).cooldown();

    await expect(stakedLyra.connect(alice).redeem(alice.address, vestingAmount)).revertedWith("INSUFFICIENT_COOLDOWN");

    await fastForward((await stakedLyra.COOLDOWN_SECONDS()).toNumber());

    const preBalance = await c.lyraToken.balanceOf(alice.address);

    await stakedLyra.connect(admin).redeem(alice.address, vestingAmount);

    expect(await stakedLyra.balanceOf(alice.address)).eq(vestingAmount); // nothing changed
    expect(await c.lyraToken.balanceOf(alice.address)).eq(preBalance); // nothing changed

    await stakedLyra.connect(alice).redeem(alice.address, vestingAmount);

    expect(await stakedLyra.balanceOf(alice.address)).eq(0);
    expect(await c.lyraToken.balanceOf(alice.address)).eq(preBalance.add(vestingAmount));

    await stakedLyra.connect(alice).redeem(alice.address, vestingAmount);
    expect(await stakedLyra.balanceOf(alice.address)).eq(0); // nothing changed
    expect(await c.lyraToken.balanceOf(alice.address)).eq(preBalance.add(vestingAmount)); // nothing changed
  });
});
