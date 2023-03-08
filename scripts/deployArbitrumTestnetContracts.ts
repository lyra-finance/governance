import { getFirstSigner } from "../helpers/helpers";
import { validateBaseEnvs } from "./utils/validation";
import { DAY_SEC } from "../test/utils";
import { getContractAddress } from "./utils/store";
import { deployAndValidate } from "./utils/deployAndValidate";

async function main(): Promise<void> {
  validateBaseEnvs();

  const deployer = await getFirstSigner();
  console.log("deploying with:", deployer.address);

  const ethereumGovernanceExecutor = getContractAddress("Executor", "goerli").address;

  if (!ethereumGovernanceExecutor) {
    throw Error("Missing executor");
  }

  const arbiBridgeExecutor = await deployAndValidate(
    "ArbitrumBridgeExecutor",
    deployer,
    "arbitrumBridgeExecutor",
    [
      // ethereumGovernanceExecutor
      ethereumGovernanceExecutor,
      // delay
      20,
      // gracePeriod
      5 * DAY_SEC,
      // minimumDelay
      1,
      // maximumDelay
      14 * DAY_SEC,
      // guardian
      deployer.address,
    ],
    "contracts/AaveImports_8_10.sol:ArbitrumBridgeExecutor",
  );

  console.log(`- ArbiBridgeExecutor: ${arbiBridgeExecutor.address}`);

  console.log("\n****** Finished Deployment ******");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
