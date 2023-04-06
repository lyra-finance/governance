import { getFirstSigner } from "../helpers/helpers";
import { DAY_SEC, YEAR_SEC } from "../test/utils";
import { deployAndValidate } from "./utils/deployAndValidate";
import { validateBaseEnvs } from "./utils/validation";

async function main(): Promise<void> {
  validateBaseEnvs();

  const deployer = await getFirstSigner();
  console.log("deploying with:", deployer.address);

  await deployAndValidate("LyraSafetyModule", deployer, "LyraSafetyModule", [
    // lyra token
    "0x01ba67aac7f75f647d94220cc98fb30fcc5105bf",
    // uint256 cooldownSeconds
    14 * DAY_SEC,
    // uint256 unstakeWindow
    2 * DAY_SEC,
    // address rewardsVault
    "0x8ef8eEEB39b21ECdDE451e6C539017DF24D14a19",
    // address emissionManager
    "0xEE86E99b42981623236824D33b4235833Afd8044",
    // uint128 distributionDuration
    YEAR_SEC * 100,
  ]);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
