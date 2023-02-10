import { ContractId, registerContract } from "./store";
import { ethers } from "hardhat";
import { etherscanVerification } from "../../helpers/helpers";
import { Contract, Signer } from "ethers";

export async function deployAndValidate(
  contractName: string,
  deployer: Signer,
  contractId: ContractId,
  args: any[],
  contractPath?: string,
  overrides: any = {},
): Promise<Contract> {
  const factory = await ethers.getContractFactory(contractName, deployer);
  const instance = await factory.deploy(...args, { ...overrides });

  console.log(instance.deployTransaction.hash);

  const receipt = await instance.deployTransaction.wait(1);

  await registerContract(contractId, {
    address: instance.address,
    blockNumber: instance.deployTransaction.blockNumber || receipt.blockNumber,
  });

  console.log(`${contractId} deployed to ${instance.address}, verifying...`);

  await etherscanVerification(instance.address, args, contractPath);

  return instance;
}
