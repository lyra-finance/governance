import { getFirstSigner } from "../../helpers/helpers";
import { validateBaseEnvs } from "../utils/validation";
import { ethers } from "ethers";

async function main(): Promise<void> {
  validateBaseEnvs();

  const deployer = await getFirstSigner();
  console.log("deploying with:", deployer.address);

  const etherAmount = "2"; // 1 Ether

  // Convert the amount of Ether to wei
  const weiAmount = ethers.utils.parseEther(etherAmount);

  // Send the transaction
  const transaction = await deployer.sendTransaction({
    to: "",
    value: weiAmount,
  });

  // Wait for the transaction to be mined
  const receipt = await transaction.wait();

  console.log(`Sent ${etherAmount} Ether in transaction ${receipt.transactionHash}`);

  console.log("\n****** Finished Deployment ******");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
