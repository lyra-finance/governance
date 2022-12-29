import { validateBaseEnvs } from "../utils/validation";
import { getFirstSigner } from "../../helpers/helpers";
import { ContractId } from "../utils/store";
import { deployAndValidate } from "../utils/deployAndValidate";
import { toBN } from "../../test/utils";

async function main(): Promise<void> {
  validateBaseEnvs();

  console.log("Deploying Test USDC...");

  const deployer = await getFirstSigner();

  await deployAndValidate(
    "TestToken",
    deployer,
    ContractId.UsdcTestToken,
    ["USD Coin", "USDC", toBN("100000000")],
    "contracts/test/TestToken.sol:TestToken",
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
