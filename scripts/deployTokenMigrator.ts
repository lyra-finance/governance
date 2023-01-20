import {etherscanVerification, getFirstSigner} from "../helpers/helpers";
import { ContractId } from "./utils/store";
import { validateBaseEnvs } from "./utils/validation";
import { deployAndValidate } from "./utils/deployAndValidate";

async function main(): Promise<void> {
  validateBaseEnvs();

  const deployer = await getFirstSigner();
  console.log("deploying with:", deployer.address);

  // Lyra Safety module and proxy
  //
  // const tokenMigrator = await deployAndValidate(
  //   "TokenMigrator",
  //   deployer,
  //   ContractId.TokenMigrator,
  //   [
  //     "0xde48b1b5853cc63b1d05e507414d3e02831722f8",
  //     "0x0F5d45a7023612e9e244fe84FAc5fCf3740d1492"
  //   ],
  //     "contracts/TokenMigrator.sol:TokenMigrator",
  // );

  await etherscanVerification("0x0474bE53472280f96027b901C0367d2aC7aD539f",
    [
      "0xde48b1b5853cc63b1d05e507414d3e02831722f8",
      "0x0F5d45a7023612e9e244fe84FAc5fCf3740d1492"
    ],
    "contracts/TokenMigrator.sol:TokenMigrator",);
  //
  // console.log({
  //   tokenMigrator: tokenMigrator.address,
  // });

  console.log("\n****** Finished Deployment ******");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
