import { getDeployer } from "../helpers/helpers";
import { ContractId } from "./utils/store";
import { validateBaseEnvs, validateTokenEnvs } from "./utils/validation";
import { deployAndValidate } from "./utils/deployAndValidate";

async function main(): Promise<void> {
  validateBaseEnvs();
  const { name, symbol, supply } = validateTokenEnvs();

  const deployer = getDeployer();
  console.log("Deploying Lyra...");

  const lyraToken = await deployAndValidate("Lyra", deployer, ContractId.LyraToken, [name, symbol, supply]);

  console.log("\n****** Finished Deployment ******");
  console.log("Lyra token: ", lyraToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
