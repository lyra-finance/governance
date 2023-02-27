import hre from "hardhat";
import { join } from "path";
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";

export const getDb = () => low(new FileSync(join(__dirname, "../../deployments", hre.network.name, "deployment.json")));

export const getExternalsDb = () =>
  low(new FileSync(join(__dirname, "../../deployments", hre.network.name, "externals.json")));

export const getContract = (contractId: string): { address: string; blockNumber: number | undefined } =>
  getDb().get(`${contractId}`).value();

export const getExternalContractAddress = (contractId: string) => getExternalsDb().get(`${contractId}`).value();

export const registerContract = (
  contractId: string,
  newContract: { address: string; blockNumber: number | undefined },
) => getDb().set(`${contractId}`, newContract).write();

export const appendNewContract = (
  contractId: string,
  newContract: { address: string; blockNumber: number | undefined },
) => {
  let contracts = getDb().get(`${contractId}`).value();

  if (!contracts) {
    contracts = [];
  }

  return getDb()
    .set(`${contractId}`, [...contracts, newContract])
    .write();
};
