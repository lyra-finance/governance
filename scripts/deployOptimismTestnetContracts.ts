import { getFirstSigner } from "../helpers/helpers";
import { validateBaseEnvs } from "./utils/validation";
import { DAY_SEC } from "../test/utils";
import { getContractAddress } from "./utils/store";
import { deployAndValidate } from "./utils/deployAndValidate";

const OVM_L2_MESSENGER = "0x4200000000000000000000000000000000000007";

async function main(): Promise<void> {
  validateBaseEnvs();

  const deployer = await getFirstSigner();
  console.log("deploying with:", deployer.address);

  const ethereumGovernanceExecutor = getContractAddress("Executor", "goerli").address;

  if (!ethereumGovernanceExecutor) {
    throw Error("Missing executor");
  }

  const opBridgeExecutor = await deployAndValidate("OptimismBridgeExecutor", deployer, "optimismBridgeExecutor", [
    // Optimism L2CrossDomainMessenger
    OVM_L2_MESSENGER,
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
