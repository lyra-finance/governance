import { getFirstSigner } from "../helpers/helpers";
import { validateBaseEnvs } from "./utils/validation";
import { ethers } from "hardhat";
import { DAY_SEC, HOUR_SEC, toBN, YEAR_SEC } from "../test/utils";
import { deployAndValidate } from "./utils/deployAndValidate";

async function main(): Promise<void> {
  validateBaseEnvs();

  const deployer = await getFirstSigner();
  console.log("deploying with:", deployer.address);

  const lyraToken = await deployAndValidate("Lyra", deployer, "Lyra", ["Lyra Token", "Lyra", toBN("1000000000")]);

  const stkLyraImplementation = await deployAndValidate("LyraSafetyModule", deployer, "stkLyraImplementation", [
    // IERC20 stakedToken
    lyraToken.address,
    // uint256 cooldownSeconds
    HOUR_SEC,
    // uint256 unstakeWindow
    2 * HOUR_SEC,
    // address rewardsVault
    deployer.address,
    // address emissionManager
    deployer.address,
    // uint128 distributionDuration
    YEAR_SEC * 100,
  ]);

  const proxyAdmin = await deployAndValidate("ProxyAdmin", deployer, "ProxyAdmin", []);

  const proxy = await deployAndValidate("InitializableAdminUpgradeabilityProxy", deployer, "stkLyra", []);

  await proxy["initialize(address,address,bytes)"](
    stkLyraImplementation.address,
    proxyAdmin.address,
    stkLyraImplementation.interface.encodeFunctionData("initialize", ["Staked Lyra", "stkLYRA", 18]),
  );

  const stkLyra = new ethers.Contract(proxy.address, stkLyraImplementation.interface, deployer);

  console.log("\nconfiguring stkLyra and seeding initial rewards");
  await lyraToken.approve(stkLyra.address, toBN("25000000"), { gasLimit: 1000000 });

  await stkLyra.stake(deployer.address, toBN("25000000"), { gasLimit: 1000000 });
  await stkLyra.configureAssets(
    [
      {
        emissionPerSecond: toBN("0.03"),
        totalStaked: toBN("25000000"),
        underlyingAsset: stkLyra.address,
      },
    ],
    { gasLimit: 1000000 },
  );
  // Approve some stkLyra for rewards being claimed
  await stkLyra.approve(stkLyra.address, toBN("25000000"), { gasLimit: 1000000 });

  console.log("=== Token setup done ===");

  // Add voting contracts and executors

  // const governanceStrategy = await deployAndValidate("LyraGovernanceStrategy", deployer, "LyraGovernanceStrategy", [
  //   lyraToken.address,
  //   stkLyra.address,
  // ]);

  // const lyraGovernance = await deployAndValidate("LyraGovernanceV2", deployer, "LyraGovernanceV2", [
  //   governanceStrategy.address,
  //   5, // voting delay - can only start voting after this many blocks
  //   deployer.address,
  //   [deployer.address],
  // ]);

  // await deployAndValidate("Executor", deployer, "Executor", [
  //   // admin
  //   lyraGovernance.address,
  //   // delay - time before being able to vote (sec)
  //   10,
  //   // grace period - time after `delay` while a proposal can be executed
  //   5 * DAY_SEC,
  //   // min delay
  //   1,
  //   // max delay
  //   12 * DAY_SEC,
  //   // propositionThreshold (in percentage of 10000, so 100 = 1% of total tokens to create proposal)
  //   100,
  //   // vote duration (blocks, so ~10min)
  //   40, // number of blocks vote lasts after the voting delay
  //   // vote differential: percentage of supply that `for` votes need to be over `against`
  //   // (100 = basically free 1% voting against)
  //   100,
  //   // minimum quorum (at least 2% must vote for this to be able to pass)
  //   200,
  // ]);

  // console.log("\n****** Finished Deployment ******");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
