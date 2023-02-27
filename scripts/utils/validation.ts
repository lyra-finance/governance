export const validateBaseEnvs = () => {
  if (!process.env.PK) {
    throw Error("Missing process.env.PK");
  }

  if (!process.env.ETHERSCAN_KEY) {
    throw Error("Missing process.env.ETHERSCAN_KEY");
  }

  return {
    pk: process.env.PK,
    etherscanKey: process.env.ETHERSCAN_KEY,
  };
};
