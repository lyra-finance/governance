import { getFirstSigner } from "../helpers/helpers";
import { validateBaseEnvs } from "./utils/validation";
import { DAY_SEC, HOUR_SEC } from "../test/utils";
import { deployAndValidate } from "./utils/deployAndValidate";

const GUARDIAN = "0xD4C00FE7657791C2A43025dE483F05E49A5f76A6";
const SHORT_EXECUTOR = "0x50cdcf492Bf80a274881589EDe6AD652c9CE07Af";
const OVM_L2_CROSS_DOMAIN_MESSENGER = "0x4200000000000000000000000000000000000007";

async function main(): Promise<void> {
  validateBaseEnvs();

  const deployer = await getFirstSigner();
  console.log("deploying with:", deployer.address);

  const opBridgeExecutor = await deployAndValidate("OptimismBridgeExecutor", deployer, "optimismBridgeExecutor", [
    // OP cross domain messenger
    OVM_L2_CROSS_DOMAIN_MESSENGER,
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

  console.log(`- opBridgeExecutor: ${opBridgeExecutor.address}`);

  console.log("\n****** Finished Deployment ******");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
