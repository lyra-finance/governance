import { etherscanVerification, getFirstSigner } from "../helpers/helpers";
import { ContractId } from "./utils/store";
import { validateBaseEnvs } from "./utils/validation";
import { deployAndValidate } from "./utils/deployAndValidate";

async function main(): Promise<void> {
  validateBaseEnvs();

  console.log("Deploying MultiDistributor...");

  const deployer = await getFirstSigner();

  await deployAndValidate(
    "MultiDistributor",
    deployer,
    ContractId.MultiDistributor,
    [],
    "contracts/token/MultiDistributor.sol:MultiDistributor",
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
