import {etherscanVerification, getFirstSigner} from "../helpers/helpers";
import { ContractId } from "./utils/store";
import { validateBaseEnvs, validateStakedLyraEnvs } from "./utils/validation";
import { deployAndValidate } from "./utils/deployAndValidate";
import * as path from "path";
import {DAY_SEC, toBN} from "../test/utils";
import {Contract} from "@ethersproject/contracts";
import {InitializableAdminUpgradeabilityProxy} from "../typechain";

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

  // const lyraSafetyModuleProxy = await deployAndValidate(
  //   "InitializableAdminUpgradeabilityProxy",
  //   deployer,
  //   ContractId.LyraSafetyModuleProxy,
  //   [],
  //   "@aave/aave-stake-v2/contracts/lib/InitializableAdminUpgradeabilityProxy.sol:InitializableAdminUpgradeabilityProxy",
  //   { gasPrice: toBN('0.000000022'), nonce:130, }
  // );

  //
  // const lyraSafetyModule = await deployAndValidate(
  //   "LyraSafetyModule",
  //   deployer,
  //   ContractId.LyraSafetyModuleMigration,
  //   [
  //     // IERC20 stakedToken
  //     lyraTokenAddress,
  //     // IERC20 rewardToken
  //     "0xCb9f85730f57732fc899fb158164b9Ed60c77D49",
  //     // uint256 cooldownSeconds
  //     14 * DAY_SEC,
  //     // uint256 unstakeWindow
  //     2 * DAY_SEC,
  //     // address rewardsVault
  //     "0x8ef8eEEB39b21ECdDE451e6C539017DF24D14a19",
  //     // address emissionManager
  //     "0x8ef8eEEB39b21ECdDE451e6C539017DF24D14a19",
  //     // uint128 distributionDuration
  //     distributionDuration
  //   ],
  //   "contracts/stakedToken/LyraSafetyModule.sol:LyraSafetyModule",
  //   { gasPrice: toBN('0.000000022') }
  // );
  //
  // let encodedInitializeStakedLyra = lyraSafetyModule.interface.encodeFunctionData("initialize", [
  //   "Staked Lyra",
  //   "stkLYRA",
  //   18,
  // ]);
  //
  // console.log(encodedInitializeStakedLyra);
  // console.log(encodedInitializeStakedLyra.toString());

  // console.log("Initializing StakedLyra Proxy...");
  //
  // let tx = await lyraSafetyModuleProxy["initialize(address,address,bytes)"](
  //   lyraSafetyModule.address,
  //   proxyAdmin,
  //   encodedInitializeStakedLyra,
  //   { gasPrice: toBN('0.000000022')}
  // );
  // await tx.wait();

  await etherscanVerification("0x857bC2e9dCb0E3b831763390e351470a3CCCBBfa", [
      // IERC20 stakedToken
      lyraTokenAddress,
      // IERC20 rewardToken
      "0xCb9f85730f57732fc899fb158164b9Ed60c77D49",
      // uint256 cooldownSeconds
      (14 * DAY_SEC).toString(),
      // uint256 unstakeWindow
      (2 * DAY_SEC).toString(),
      // address rewardsVault
      "0x8ef8eEEB39b21ECdDE451e6C539017DF24D14a19",
      // address emissionManager
      "0x8ef8eEEB39b21ECdDE451e6C539017DF24D14a19",
      // uint128 distributionDuration
      distributionDuration
    ],
    "contracts/stakedToken/LyraSafetyModule.sol:LyraSafetyModule");

  //
  // // USDC safety module and proxy
  //
  // const lyraUsdcSafetyModule = await deployAndValidate(
  //   "LyraUsdcSafetyModule",
  //   deployer,
  //   ContractId.LyraUsdcSafetyModule,
  //   [usdcTokenAddress, lyraTokenAddress, cooldown, unstakeWindow, rewardsVault, emissionManager, distributionDuration],
  //   "contracts/safety-module/LyraUsdcSafetyModule.sol:LyraUsdcSafetyModule",
  // );
  //
  // const lyraUsdcSafetyModuleProxy = await deployAndValidate(
  //   "InitializableAdminUpgradeabilityProxy",
  //   deployer,
  //   ContractId.LyraUsdcSafetyModuleProxy,
  //   [],
  //   path.join(
  //     __dirname,
  //     "../node_modules/@aave/aave-stake-v2/contracts/lib/InitializableAdminUpgradeabilityProxy.sol:InitializableAdminUpgradeabilityProxy",
  //   ),
  // );
  //
  // encodedInitializeStakedLyra = lyraUsdcSafetyModule.interface.encodeFunctionData("initialize", [
  //   "Staked USDC",
  //   "stkUSDC",
  //   18,
  // ]);
  //
  // console.log("Initializing StakedLyra Proxy...");
  //
  // tx = await lyraUsdcSafetyModuleProxy["initialize(address,address,bytes)"](
  //   lyraUsdcSafetyModule.address,
  //   proxyAdmin,
  //   encodedInitializeStakedLyra,
  // );
  // await tx.wait();
  //
  // console.log({
  //   lyraSafetyModule: lyraSafetyModule.address,
  //   lyraSafetyModuleProxy: lyraSafetyModuleProxy.address,
  //   // lyraUsdcSafetyModule: lyraUsdcSafetyModule.address,
  //   // lyraUsdcSafetyModuleProxy: lyraUsdcSafetyModuleProxy.address,
  // });

  console.log("\n****** Finished Deployment ******");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
