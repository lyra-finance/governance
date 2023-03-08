import hre from "hardhat";
import { join } from "path";
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";

export function getDb(networkOverride?: string) {
  return low(
    new FileSync(join(__dirname, "../../deployments", networkOverride || hre.network.name, "deployment.json")),
  );
}

export function getExternalsDb(networkOverride?: string) {
  return low(new FileSync(join(__dirname, "../../deployments", networkOverride || hre.network.name, "externals.json")));
}

export function getContractAddress(contractId: string, networkOverride?: string) {
  return getDb(networkOverride).get(`${contractId}`).value();
}

export function getExternalContractAddress(contractId: string, networkOverride?: string) {
  return getExternalsDb(networkOverride).get(`${contractId}`).value();
}

export function registerContract(
  contractId: string,
  newContract: { address: string; blockNumber: number | undefined },
) {
  return getDb().set(`${contractId}`, newContract).write();
}

export function appendNewContract(
  contractId: string,
  newContract: { address: string; blockNumber: number | undefined },
) {
  let contracts = getDb().get(`${contractId}`).value();

  if (!contracts) {
    contracts = [];
  }

  return getDb()
    .set(`${contractId}`, [...contracts, newContract])
    .write();
}
