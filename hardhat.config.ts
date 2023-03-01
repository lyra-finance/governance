import "@eth-optimism/hardhat-ovm";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import "hardhat-tracer";
import "@typechain/hardhat";
import "solidity-coverage";
import "@nomiclabs/hardhat-etherscan";

import dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import { NetworkUserConfig } from "hardhat/types";

export function loadArgsAndEnv(argv: string[]) {
  const result: { [key: string]: string } = {};
  for (let i = 0; i < argv.length - 1; i++) {
    if (argv[i].substr(0, 2) === "--") {
      result[argv[i].substr(2)] = argv[i + 1];
    }
  }

  const network = process.env.HARDHAT_NETWORK || result["network"];

  if (network) {
    // Override in order of priority
    const res = {
      ...(dotenv.config({ path: __dirname + "/deployments/.env.defaults" }).parsed || {}),
      ...(dotenv.config({ path: __dirname + "/deployments/" + network + "/.env.public" }).parsed || {}),
      ...(dotenv.config({ path: __dirname + "/deployments/.env.private" }).parsed || {}),
      ...(dotenv.config({ path: __dirname + "/deployments/" + network + "/.env.private" }).parsed || {}),
    };
    process.env = {
      ...process.env,
      ...res,
    };
  }
}

loadArgsAndEnv(process.argv);

const chainIds = {
  mainnet: 1,
  goerli: 5,
  [`optimism-mainnet`]: 10,
  [`arbitrum-mainnet`]: 42161,
  [`arbitrum-goerli`]: 421613,
  [`optimism-goerli`]: 420,
};

const GWEI = 1000000000;

const gasPrices = {
  mainnet: 10 * GWEI,
  goerli: GWEI,
  [`optimism-mainnet`]: GWEI,
  [`arbitrum-mainnet`]: GWEI,
  [`arbitrum-goerli`]: GWEI,
  [`optimism-goerli`]: GWEI,
};

const privateKey = process.env.PK || "";
const infuraApiKey = process.env.INFURA_API_KEY || "";
const etherscanApiKey = process.env.ETHERSCAN_KEY || "";

console.log({ etherscanApiKey });

function createNetworkConfig(network: keyof typeof chainIds): NetworkUserConfig {
  const url: string = "https://" + network + ".infura.io/v3/" + infuraApiKey;
  if (["optimism-kovan", "optimism-mainnet"].includes(network)) {
    return {
      accounts: privateKey ? [privateKey] : { mnemonic: "" },
      chainId: chainIds[network],
      gasPrice: "auto",
      url,
    };
  } else {
    return {
      accounts: privateKey ? [privateKey] : { mnemonic: "" },
      chainId: chainIds[network],
      gasPrice: GWEI,
      url,
    };
  }
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.7.5",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
      {
        version: "0.8.10",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
      },
    },
    local: {
      url: "http://127.0.0.1:8545",
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
      },
      gasPrice: 10000000,
    },
    goerli: createNetworkConfig("goerli"),
    mainnet: createNetworkConfig("mainnet"),
    "optimism-mainnet": createNetworkConfig("optimism-mainnet"),
    "arbitrum-mainnet": createNetworkConfig("arbitrum-mainnet"),
  },
  mocha: {
    timeout: 1_000_000,
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
    disambiguatePaths: false,
  },
  gasReporter: {
    enabled: !!process.env.REPORT_GAS,
  },
  etherscan: {
    apiKey: etherscanApiKey,
  },
};

export default config;
