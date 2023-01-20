import hre from "hardhat";
import { join } from "path";
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";

export enum ContractId {
  TokenMigrator = "TokenMigrator",
  VestingEscrow = "VestingEscrow",
  VestingEscrowV2 = "VestingEscrowV2",
  LyraToken = "LyraToken",
  EscrowFactory = "EscrowFactory",
  EscrowFactory2 = "EscrowFactory2",
  EscrowProxies = "EscrowProxies",
  LyraSafetyModule = "LyraSafetyModule",
  LyraSafetyModuleMigration = "LyraSafetyModuleMigration",
  LyraUsdcSafetyModuleMigration = "LyraUsdcSafetyModuleMigration",
  LyraUsdcSafetyModule = "LyraUsdcSafetyModule",
  LyraSafetyModuleProxy = "LyraSafetyModuleProxy",
  LyraUsdcSafetyModuleProxy = "LyraUsdcSafetyModuleProxy",
  UsdcTestToken = "UsdcTestToken",
  StakingRewards = "stakingRewards",
  LyraDistributor = "LyraDistributor",
  MultiDistributor = "MultiDistributor",
  ArbitraryTokenMultisender = "ArbitraryTokenMultisender",
}

export enum ExternalContractId {
  DelegateRegistry = "DelegateRegistry",
  L1_XDOMAIN_MESSENGER = "L1_XDOMAIN_MESSENGER",
  L2_XDOMAIN_MESSENGER = "L2_XDOMAIN_MESSENGER",
}

export const getDb = () => low(new FileSync(join(__dirname, "../../deployments", hre.network.name, "deployment.json")));

export const getExternalsDb = () =>
  low(new FileSync(join(__dirname, "../../deployments", hre.network.name, "externals.json")));

export const getContract = (contractId: ContractId): { address: string; blockNumber: number | undefined } =>
  getDb().get(`${contractId}`).value();

export const getExternalContractAddress = (contractId: ExternalContractId) =>
  getExternalsDb().get(`${contractId}`).value();

export const registerContract = (
  contractId: ContractId,
  newContract: { address: string; blockNumber: number | undefined },
) => getDb().set(`${contractId}`, newContract).write();

export const appendNewContract = (
  contractId: ContractId,
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
