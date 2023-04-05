import { getFirstSigner } from "../helpers/helpers";
import { validateBaseEnvs } from "../scripts/utils/validation";
import { HOUR_SEC, toBN, YEAR_SEC } from "../test/utils";
import { deployAndValidate } from "../scripts/utils/deployAndValidate";

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
    deployer.address,
    stkLyraImplementation.interface.encodeFunctionData("initialize", ["Staked Lyra", "stkLYRA", 18]),
  );

  // await proxy["changeAdmin(address)"](lyraToken.address);
  // const tx = await proxy.admin();
  const tx = await proxy.changeAdmin(proxyAdmin.address);
  console.log(tx.data);
  // const admin = await proxyAdmin.getProxyAdmin(proxy);
  // console.log(admin.data);

  console.log("\n****** Finished Deployment ******");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
