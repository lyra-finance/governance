import hre from "hardhat";

export const getFirstSigner = async () => (await hre.ethers.getSigners())[0];

export async function etherscanVerification(contractAddress: string, args: any[]) {
  if (hre.network.name === "local" || hre.network.name === "local-ovm") {
    return;
  }

  return runTaskWithRetry(
    "verify:verify",
    {
      address: contractAddress,
      constructorArguments: args,
    },
    4,
    10000,
  );
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry is needed because the contract was recently deployed and it hasn't propagated to the explorer backend yet
export const runTaskWithRetry = async (task: string, params: any, times: number, msDelay: number) => {
  let counter = times;
  await delay(msDelay);

  try {
    await hre.run(task, params);
  } catch (error) {
    counter--;

    if (counter > 0) {
      await runTaskWithRetry(task, params, counter, msDelay);
    } else {
      console.error("[ETHERSCAN][ERROR]", "unable to verify", error.message);
    }
  }
};

export function getDeployer(pk?: string) {
  const provider = new hre.ethers.providers.JsonRpcProvider(process.env.RPC_URL);

  const deployer = new hre.ethers.Wallet(String(pk || process.env.PK), provider);
  console.log("deploying with:", deployer.address);
  return deployer;
}
