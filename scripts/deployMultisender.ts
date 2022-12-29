import { getFirstSigner } from "../helpers/helpers";
import { ContractId } from "./utils/store";
import { validateBaseEnvs } from "./utils/validation";
import { deployAndValidate } from "./utils/deployAndValidate";

async function main(): Promise<void> {
  validateBaseEnvs();

  console.log("Deploying ArbitraryTokenMultisender...");

  const deployer = await getFirstSigner();

  await deployAndValidate("ArbitraryTokenMultisender", deployer, ContractId.ArbitraryTokenMultisender, []);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
