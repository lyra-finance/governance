import { getFirstSigner } from "../../helpers/helpers";
import { validateBaseEnvs } from "../utils/validation";
import { ethers } from "hardhat";
import { toBN, toBytes32 } from "../../test/utils";
import tokenAbi from "./abis/LyraToken.json";
import governanceAbi from "./abis/Governance.json";

async function main(): Promise<void> {
  validateBaseEnvs();
  const deployer = await getFirstSigner();

  const GOVV2_L1_GOERLI = "0xD5BB4Cd3dbD5164eE5575FBB23542b120a52BdB8";
  const EXE_L1_GOERLI = "0xb6f416a47cACb1583903ae6861D023FcBF3Be7b6";
  const LYRA_TOKEN = "0x81dC2c079057Ec6Ce15F0f83F8209A529f4d1D0c";

  const lyraGov = new ethers.Contract(GOVV2_L1_GOERLI, governanceAbi, deployer);
  const lyraToken = new ethers.Contract(LYRA_TOKEN, tokenAbi, deployer);

  const testAdddress = "0xC1D0048b50bB4D67dDbF3ba14Abc6Fca05a6A66C";

  const tx = await lyraToken.populateTransaction.transfer(testAdddress, toBN("1000"));

  const tx1 = await lyraGov.create(EXE_L1_GOERLI, [LYRA_TOKEN], [0], [""], [tx.data as string], [false], toBytes32(""));
  console.log("Transaction sent", tx1.hash);
  await tx1.wait();

  console.log("\n****** Finished creating proposal ******");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
