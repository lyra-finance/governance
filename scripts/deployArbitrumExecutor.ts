import { getFirstSigner } from "../helpers/helpers";
import { validateBaseEnvs } from "./utils/validation";
import { DAY_SEC, HOUR_SEC } from "../test/utils";
import { deployAndValidate } from "./utils/deployAndValidate";

const GUARDIAN = "0x2CcF21e5912e9ecCcB0ecdEe9744E5c507cf88AE";
const SHORT_EXECUTOR = "0xEE86E99b42981623236824D33b4235833Afd8044";

async function main(): Promise<void> {
  validateBaseEnvs();

  const deployer = await getFirstSigner();
  console.log("deploying with:", deployer.address);

  const arbiBridgeExecutor = await deployAndValidate("ArbitrumBridgeExecutor", deployer, "arbitrumBridgeExecutor", [
    // ethereumGovernanceExecutor
    SHORT_EXECUTOR,
    // delay
    3 * HOUR_SEC,
    // gracePeriod
    5 * DAY_SEC,
    // minimumDelay
    3 * HOUR_SEC,
    // maximumDelay
    10 * DAY_SEC,
    // guardian
    GUARDIAN,
  ]);

  console.log(`- ArbiBridgeExecutor: ${arbiBridgeExecutor.address}`);

  console.log("\n****** Finished Deployment ******");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
