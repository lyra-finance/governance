import { getDeployer } from "../../helpers/helpers";
import { ContractId, getContract } from "../utils/store";
import { Contract } from "@ethersproject/contracts";
import { LyraSafetyModule, LyraSafetyModule__factory, Lyra__factory } from "../../typechain";
import { MAX_UINT, toBN } from "../../test/utils";

async function main(): Promise<void> {
  const first = getDeployer(process.env.PK);
  const second = getDeployer(process.env.MULTI_SIG_1);
  const third = getDeployer(process.env.MULTI_SIG_2);

  console.log("mint some Lyra...", first.address);
  let tx: any;
  let receipt: any;

  const lyraToken = new Contract(getContract(ContractId.LyraToken).address, Lyra__factory.abi, first);
  tx = await lyraToken["transfer(address,uint256)"](second.address, toBN("1000"));
  receipt = await tx.wait(1);
  console.log("receipt", receipt);

  tx = await lyraToken["transfer(address,uint256)"](third.address, toBN("50000"));
  receipt = await tx.wait(1);
  console.log("receipt", receipt);

  const safetyModuleProxy = new Contract(
    getContract(ContractId.LyraSafetyModule).address,
    LyraSafetyModule__factory.abi,
    first,
  ) as LyraSafetyModule;

  console.log("approve safety module");
  tx = await lyraToken["approve(address,uint256)"](getContract(ContractId.LyraSafetyModuleProxy).address, MAX_UINT);
  receipt = await tx.wait(1);
  console.log("receipt", receipt);

  console.log("staking with", first.address);
  tx = await safetyModuleProxy
    .attach(getContract(ContractId.LyraSafetyModuleProxy).address)
    .stake(first.address, toBN("75000"));
  receipt = await tx.wait(1);
  console.log("receipt", receipt);
  await delay(600000);

  console.log("staking with", second.address);
  tx = await safetyModuleProxy
    .attach(getContract(ContractId.LyraSafetyModuleProxy).address)
    .stake(second.address, toBN("5000"));
  receipt = await tx.wait(1);
  console.log("receipt", receipt);
  await delay(1200000);

  console.log("staking with", third.address);
  tx = await safetyModuleProxy
    .attach(getContract(ContractId.LyraSafetyModuleProxy).address)
    .stake(third.address, toBN("25000"));
  receipt = await tx.wait(1);
  console.log("receipt", receipt);
  await delay(300000);

  console.log("trigger cooldown for third user", third.address);

  tx = await safetyModuleProxy.attach(getContract(ContractId.LyraSafetyModuleProxy).address).connect(third).cooldown();
  receipt = await tx.wait(1);
  console.log("receipt", receipt);

  console.log("\n****** Finished Seed ******");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
