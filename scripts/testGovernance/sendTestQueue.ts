import { getFirstSigner } from "../../helpers/helpers";
import { validateBaseEnvs } from "../utils/validation";
import { ethers } from "hardhat";
import governanceAbi from "./abis/Governance.json";

async function main(): Promise<void> {
  validateBaseEnvs();
  const deployer = await getFirstSigner();
  const GOVV2_L1_GOERLI = "0xD5BB4Cd3dbD5164eE5575FBB23542b120a52BdB8";
  const lyraGov = new ethers.Contract(GOVV2_L1_GOERLI, governanceAbi, deployer);

  const tx1 = await lyraGov.queue(1);
  console.log("Transaction sent", tx1.hash);
  await tx1.wait();

  console.log("\n****** Finished queueing proposal ******");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
