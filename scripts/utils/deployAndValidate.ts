import { registerContract } from "./store";
import { ethers } from "hardhat";
import { etherscanVerification } from "../../helpers/helpers";
import { Contract, Signer } from "ethers";

export async function deployAndValidate(
  contractName: string,
  deployer: Signer,
  contractId: string,
  args: any[],
  contractPath?: string,
  overrides: any = {},
): Promise<Contract> {
  const factory = await ethers.getContractFactory(contractName, deployer);
  const instance = await factory.deploy(...args, { ...overrides });

  console.log(`Deploying contract ${contractName}`);
  console.log(`- Hash: ${instance.deployTransaction.hash}`);

  const receipt = await instance.deployTransaction.wait(1);

  await registerContract(contractId, {
    address: instance.address,
    blockNumber: instance.deployTransaction.blockNumber || receipt.blockNumber,
  });

  console.log(`- Address: ${instance.address}`);

  await etherscanVerification(instance.address, args, contractPath);

  return instance;
}
