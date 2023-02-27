import { getFirstSigner } from "../helpers/helpers";
import { validateBaseEnvs } from "./utils/validation";
import { ethers } from "hardhat";
import { DAY_SEC, HOUR_SEC, toBN, YEAR_SEC, ZERO_ADDRESS } from "../test/utils";
import { AaveGovernanceV2, Executor, Lyra } from "../typechain";

const ETHEREUM_GOVERNANCE_EXECUTOR = ZERO_ADDRESS;

async function main(): Promise<void> {
  validateBaseEnvs();

  const deployer = await getFirstSigner();
  console.log("deploying with:", deployer.address);

  if (ETHEREUM_GOVERNANCE_EXECUTOR == ZERO_ADDRESS) {
    throw Error("Missing executor");
  }
  const arbiBridgeExecutor = await (await ethers.getContractFactory("ArbitrumBridgeExecutor")).connect(deployer).deploy(
    // ethereumGovernanceExecutor
    ETHEREUM_GOVERNANCE_EXECUTOR,
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
  );
  await arbiBridgeExecutor.deployed();

  console.log(`- ArbiBridgeExecutor: ${arbiBridgeExecutor.address}`);

  console.log("\n****** Finished Deployment ******");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
