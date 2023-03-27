import { getFirstSigner } from "../helpers/helpers";
import { validateBaseEnvs } from "./utils/validation";
import { DAY_SEC } from "../test/utils";
import { deployAndValidate } from "./utils/deployAndValidate";

const LYRA = "0x01BA67AAC7f75f647D94220Cc98FB30FCc5105Bf";
const STK_LYRA = "0xCb9f85730f57732fc899fb158164b9Ed60c77D49";

async function main(): Promise<void> {
  validateBaseEnvs();

  const deployer = await getFirstSigner();
  console.log("deploying with:", deployer.address);

  const proxyAdmin = await deployAndValidate("ProxyAdmin", deployer, "ProxyAdmin", []);

  const governanceStrategy = await deployAndValidate("LyraGovernanceStrategy", deployer, "LyraGovernanceStrategy", [
    LYRA,
    STK_LYRA,
  ]);

  const GUARDIAN = "0x246d38588b16Dd877c558b245e6D5a711C649fCF";
  const lyraGovernance = await deployAndValidate("LyraGovernanceV2", deployer, "LyraGovernanceV2", [
    governanceStrategy.address,
    7200, // voting delay - can only start voting after this many blocks
    GUARDIAN,
    [],
  ]);

  const executorShort = await deployAndValidate("Executor", deployer, "ExecutorShort", [
    // admin
    lyraGovernance.address,
    // delay - minimum time between queueing and execution of proposal
    DAY_SEC,
    // grace period - time after `delay` while a proposal can be executed
    5 * DAY_SEC,
    // min delay
    DAY_SEC,
    // max delay
    10 * DAY_SEC,
    // propositionThreshold (in percentage of 10000, so 100 = 1% of total tokens to create proposal)
    50,
    // vote duration (blocks, so ~3day)
    17280, // number of blocks vote lasts after the voting delay
    // vote differential: percentage of supply that `for` votes need to be over `against`
    // (100 = basically free 1% voting against)
    50,
    // minimum quorum (at least 4% must vote for this to be able to pass)
    400,
  ]);

  const executorLong = await deployAndValidate("Executor", deployer, "ExecutorLong", [
    // admin
    lyraGovernance.address,
    // delay - minimum time between queueing and execution of proposal
    7 * DAY_SEC,
    // grace period - time after `delay` while a proposal can be executed
    5 * DAY_SEC,
    // min delay
    7 * DAY_SEC,
    // max delay
    10 * DAY_SEC,
    // propositionThreshold (in percentage of 10000, so 100 = 1% of total tokens to create proposal)
    200,
    // vote duration (blocks, so ~10 days)
    57600, // number of blocks vote lasts after the voting delay
    // vote differential: percentage of supply that `for` votes need to be over `against`
    // (100 = basically free 1% voting against)
    1500,
    // minimum quorum (at least 20% must vote for this to be able to pass)
    2000,
  ]);

  await deployAndValidate("TransferEth", deployer, "TransferEth", []);

  await lyraGovernance.authorizeExecutors([executorShort.address, executorLong.address]);
  await lyraGovernance.transferOwnership(executorLong.address);
  await proxyAdmin.transferOwnership(GUARDIAN);

  console.log("\n****** Finished Deployment ******");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
