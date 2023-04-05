import { getFirstSigner } from "../../helpers/helpers";
import { validateBaseEnvs } from "../utils/validation";
import { ethers } from "hardhat";
import { toBytes32 } from "../../test/utils";
import governanceAbi from "./abis/Governance.json";
import transferEthAbi from "./abis/TransferEth.json";

async function main(): Promise<void> {
  validateBaseEnvs();
  const deployer = await getFirstSigner();

  const GOVV2_L1_GOERLI = "0xD5BB4Cd3dbD5164eE5575FBB23542b120a52BdB8";
  const EXE_L1_GOERLI = "0xb6f416a47cACb1583903ae6861D023FcBF3Be7b6";
  const TRANSFER_ETH = "0xC288DEEB259aeDAC740983E906B1e9514A6539a3";
  const lyraGov = new ethers.Contract(GOVV2_L1_GOERLI, governanceAbi, deployer);

  const transferEth = new ethers.Contract(TRANSFER_ETH, transferEthAbi, deployer);

  const testAdddress = "0xC1D0048b50bB4D67dDbF3ba14Abc6Fca05a6A66C";

  const tx = await transferEth.populateTransaction.transferEth(testAdddress, ethers.utils.parseEther("0.1"));

  const tx1 = await lyraGov.create(
    EXE_L1_GOERLI,
    [TRANSFER_ETH],
    [0],
    [""],
    [tx.data as string],
    [true],
    toBytes32(""),
  );

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
