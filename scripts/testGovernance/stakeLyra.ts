import { getFirstSigner } from "../helpers/helpers";
import { validateBaseEnvs } from "./utils/validation";
import { ethers } from "hardhat";
import { DAY_SEC, HOUR_SEC, toBN, YEAR_SEC } from "../test/utils";
import { deployAndValidate } from "./utils/deployAndValidate";

async function main(): Promise<void> {
  validateBaseEnvs();

  const deployer = await getFirstSigner();
  console.log("deploying with:", deployer.address);

  

  await lyraToken.approve(stkLyra.address, toBN("100000"));

  await stkLyra.stake(deployer.address, toBN("100000"));

}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
