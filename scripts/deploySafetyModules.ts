import { getFirstSigner } from "../helpers/helpers";
import { ContractId } from "./utils/store";
import { validateBaseEnvs, validateStakedLyraEnvs } from "./utils/validation";
import { deployAndValidate } from "./utils/deployAndValidate";
import * as path from "path";

async function main(): Promise<void> {
  validateBaseEnvs();
  const {
    cooldown,
    distributionDuration,
    emissionManager,
    rewardsVault,
    unstakeWindow,
    lyraTokenAddress,
    usdcTokenAddress,
    proxyAdmin,
  } = validateStakedLyraEnvs();

  const deployer = await getFirstSigner();
  console.log("deploying with:", deployer.address);

  // Lyra Safety module and proxy

  const lyraSafetyModule = await deployAndValidate(
    "LyraUsdcSafetyModuleMigration",
    deployer,
    ContractId.LyraSafetyModuleMigration,
    [usdcTokenAddress, lyraTokenAddress, cooldown, unstakeWindow, rewardsVault, emissionManager, distributionDuration],
    "contracts/safety-module/LyraUsdcSafetyModuleMigration.sol:LyraUsdcSafetyModuleMigration",
  );

  const lyraSafetyModuleProxy = await deployAndValidate(
    "InitializableAdminUpgradeabilityProxy",
    deployer,
    ContractId.LyraSafetyModuleProxy,
    [],
    "@aave/aave-stake-v2/contracts/lib/InitializableAdminUpgradeabilityProxy.sol:InitializableAdminUpgradeabilityProxy",
  );

  let encodedInitializeStakedLyra = lyraSafetyModule.interface.encodeFunctionData("initialize", [
    "Staked Lyra",
    "stkLYRA",
    18,
  ]);

  console.log("Initializing StakedLyra Proxy...");

  let tx = await lyraSafetyModuleProxy["initialize(address,address,bytes)"](
    lyraSafetyModule.address,
    proxyAdmin,
    encodedInitializeStakedLyra,
  );
  await tx.wait();

  // USDC safety module and proxy

  const lyraUsdcSafetyModule = await deployAndValidate(
    "LyraUsdcSafetyModule",
    deployer,
    ContractId.LyraUsdcSafetyModule,
    [usdcTokenAddress, lyraTokenAddress, cooldown, unstakeWindow, rewardsVault, emissionManager, distributionDuration],
    "contracts/safety-module/LyraUsdcSafetyModule.sol:LyraUsdcSafetyModule",
  );

  const lyraUsdcSafetyModuleProxy = await deployAndValidate(
    "InitializableAdminUpgradeabilityProxy",
    deployer,
    ContractId.LyraUsdcSafetyModuleProxy,
    [],
    path.join(
      __dirname,
      "../node_modules/@aave/aave-stake-v2/contracts/lib/InitializableAdminUpgradeabilityProxy.sol:InitializableAdminUpgradeabilityProxy",
    ),
  );

  encodedInitializeStakedLyra = lyraUsdcSafetyModule.interface.encodeFunctionData("initialize", [
    "Staked USDC",
    "stkUSDC",
    18,
  ]);

  console.log("Initializing StakedLyra Proxy...");

  tx = await lyraUsdcSafetyModuleProxy["initialize(address,address,bytes)"](
    lyraUsdcSafetyModule.address,
    proxyAdmin,
    encodedInitializeStakedLyra,
  );
  await tx.wait();

  console.log({
    lyraSafetyModule: lyraSafetyModule.address,
    lyraSafetyModuleProxy: lyraSafetyModuleProxy.address,
    lyraUsdcSafetyModule: lyraUsdcSafetyModule.address,
    lyraUsdcSafetyModuleProxy: lyraUsdcSafetyModuleProxy.address,
  });

  console.log("\n****** Finished Deployment ******");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
