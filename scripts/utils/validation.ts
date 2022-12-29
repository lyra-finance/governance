import { ContractId, ExternalContractId, getContract, getExternalContractAddress } from "./store";

export const validateBaseEnvs = () => {
  if (!process.env.PK) {
    throw Error("Missing process.env.PK");
  }

  if (!process.env.GAS_PRICE) {
    throw Error("Missing process.env.GAS_PRICE");
  }

  if (!process.env.ETHERSCAN_KEY) {
    throw Error("Missing process.env.ETHERSCAN_KEY");
  }

  return {
    pk: process.env.PK,
    gasPrice: Number(process.env.GAS_PRICE),
    etherscanKey: process.env.ETHERSCAN_KEY,
  };
};

export const validateTokenEnvs = () => {
  if (!process.env.TOKEN_NAME) {
    throw Error("Missing process.env.TOKEN_NAME");
  }

  if (!process.env.TOKEN_SYMBOL) {
    throw Error("Missing process.env.TOKEN_SYMBOL");
  }

  if (!process.env.TOKEN_SUPPLY) {
    throw Error("Missing process.env.TOKEN_SUPPLY");
  }

  return {
    name: process.env.TOKEN_NAME,
    symbol: process.env.TOKEN_SYMBOL,
    supply: process.env.TOKEN_SUPPLY,
  };
};

export const validateEscrowFactoryEnvs = (skipDelegate = false) => {
  const delegateRegistryAddress = getExternalContractAddress(ExternalContractId.DelegateRegistry);
  const tokenAddress = getContract(ContractId.LyraToken).address;

  if (!tokenAddress) {
    throw Error("Couldn't find Lyra token address");
  }

  if (!skipDelegate && !delegateRegistryAddress) {
    throw Error("Couldn't find delegate registry address");
  }

  return {
    delegateRegistryAddress,
    tokenAddress,
  };
};

export const validateEscrowProxyEnvs = () => {
  if (!process.env.ESCROW_BENEFICIARY) {
    throw Error("Missing process.env.ESCROW_BENEFICIARY");
  }

  if (!process.env.ESCROW_AMOUNT) {
    throw Error("Missing process.env.ESCROW_AMOUNT");
  }

  if (!process.env.ESCROW_ADMIN) {
    throw Error("Missing process.env.ESCROW_ADMIN");
  }

  if (!process.env.ESCROW_VESTING_BEGIN) {
    throw Error("Missing process.env.ESCROW_VESTING_BEGIN");
  }

  if (!process.env.ESCROW_VESTING_END) {
    throw Error("Missing process.env.ESCROW_VESTING_END");
  }

  if (!process.env.ESCROW_VESTING_CLIFF) {
    throw Error("Missing process.env.ESCROW_VESTING_CLIFF");
  }

  const factoryAddress = getContract(ContractId.EscrowFactory).address;
  const lyraTokenAddress = getContract(ContractId.LyraToken).address;

  if (!factoryAddress) {
    throw Error("Couldn't find Escrow Factory address");
  }

  if (!lyraTokenAddress) {
    throw Error("Couldn't find Lyra token address");
  }

  return {
    recipient: process.env.ESCROW_BENEFICIARY,
    vestingAmount: process.env.ESCROW_AMOUNT,
    admin: process.env.ESCROW_ADMIN,
    vestingBegin: process.env.ESCROW_VESTING_BEGIN,
    vestingEnd: process.env.ESCROW_VESTING_END,
    vestingCliff: process.env.ESCROW_VESTING_CLIFF,
    factoryAddress,
    lyraTokenAddress,
  };
};

export const validateEscrowProxiesEnvs = () => {
  if (!process.env.ESCROW_ADMIN) {
    throw Error("Missing process.env.ESCROW_ADMIN");
  }

  const factoryAddress = getContract(ContractId.EscrowFactory).address;
  const lyraTokenAddress = getContract(ContractId.LyraToken).address;

  if (!factoryAddress) {
    throw Error("Couldn't find Escrow Factory address");
  }

  if (!lyraTokenAddress) {
    throw Error("Couldn't find Lyra token address");
  }

  return {
    admin: process.env.ESCROW_ADMIN,
    factoryAddress,
    lyraTokenAddress,
  };
};

export const validateStakedLyraEnvs = () => {
  if (!process.env.SM_PROXY_ADMIN) {
    throw Error("Missing process.env.SM_PROXY_ADMIN");
  }

  if (!process.env.SM_COOLDOWN) {
    throw Error("Missing process.env.SM_COOLDOWN");
  }

  if (!process.env.SM_UNSTAKE_WINDOW) {
    throw Error("Missing process.env.SM_UNSTAKE_WINDOW");
  }

  if (!process.env.SM_REWARDS_VAULT) {
    throw Error("Missing process.env.SM_REWARDS_VAULT");
  }

  if (!process.env.SM_EMISSION_MANAGER) {
    throw Error("Missing process.env.SM_EMISSION_MANAGER");
  }

  if (!process.env.SM_DISTRIBUTION_DURATION) {
    throw Error("Missing process.env.SM_DISTRIBUTION_DURATION");
  }

  if (!process.env.SM_USDC_TOKEN_ADDRESS) {
    throw Error("Missing process.env.SM_USDC_TOKEN_ADDRESS");
  }

  let lyraTokenAddress = process.env.SM_LYRA_TOKEN_ADDRESS;
  if (!lyraTokenAddress) {
    lyraTokenAddress = getContract(ContractId.LyraToken).address;
    console.log({ lyraTokenAddress });
  }

  if (!lyraTokenAddress) {
    throw Error("Couldn't find Lyra token address");
  }

  return {
    proxyAdmin: process.env.SM_PROXY_ADMIN,
    cooldown: process.env.SM_COOLDOWN,
    unstakeWindow: process.env.SM_UNSTAKE_WINDOW,
    rewardsVault: process.env.SM_REWARDS_VAULT,
    emissionManager: process.env.SM_EMISSION_MANAGER,
    distributionDuration: process.env.SM_DISTRIBUTION_DURATION,
    usdcTokenAddress: process.env.SM_USDC_TOKEN_ADDRESS,
    lyraTokenAddress,
  };
};
