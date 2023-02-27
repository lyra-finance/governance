import { getFirstSigner } from "../helpers/helpers";
import { validateBaseEnvs } from "./utils/validation";
import { ethers } from "hardhat";
import { toBN } from "../test/utils";

const USDC_SM_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "uint128", name: "emissionPerSecond", type: "uint128" },
          { internalType: "uint256", name: "totalStaked", type: "uint256" },
          { internalType: "address", name: "underlyingAsset", type: "address" },
        ],
        internalType: "struct DistributionTypes.AssetConfigInput[]",
        name: "assetsConfigInput",
        type: "tuple[]",
      },
    ],
    name: "configureAssets",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

async function main(): Promise<void> {
  validateBaseEnvs();
  const deployer = await getFirstSigner();

  const USDC_STAKING_PROXY = "0x54D59c4596C7Ea66fD62188Ba1E16Db39E6F5472";
  const EMISSION_PER_SECOND = toBN("0");

  const c = new ethers.Contract(USDC_STAKING_PROXY, USDC_SM_ABI, deployer);

  const tx = await c.configureAssets([
    {
      emissionPerSecond: EMISSION_PER_SECOND,
      totalStaked: await c.totalSupply(),
      underlyingAsset: USDC_STAKING_PROXY,
    },
  ]);

  console.log(tx.hash);
  await tx.wait();

  console.log("\n****** Finished configuring emissions ******");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
