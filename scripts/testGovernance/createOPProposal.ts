import { getFirstSigner } from "../../helpers/helpers";
import { validateBaseEnvs } from "../utils/validation";
import { ethers } from "hardhat";
import { toBN, toBytes32 } from "../../test/utils";
import { BigNumber, Contract } from "ethers";
import tokenAbi from "./abis/LyraToken.json";
import governanceAbi from "./abis/Governance.json";
import opExecutorAbi from "./abis/OptimismExecutor.json";
// import transferEthAbi from "./abis/TransferEth.json";

const createOptimismBridgeCalldata = async (
  optimismBridgeExecutor: Contract,
  targetContract: Contract,
  fn: string,
  params: any[],
): Promise<string> => {
  const targets: string[] = [targetContract.address];
  const values: BigNumber[] = [BigNumber.from(0)];
  const signatures: string[] = [""];
  const calldatas: string[] = [targetContract.interface.encodeFunctionData(fn, [...params])];
  const withDelegatecalls: boolean[] = [false];

  const encodedQueue = optimismBridgeExecutor.interface.encodeFunctionData("queue", [
    targets,
    values,
    signatures,
    calldatas,
    withDelegatecalls,
  ]);

  const encodedRootCalldata = ethers.utils.defaultAbiCoder.encode(
    ["address", "bytes", "uint32"],
    [optimismBridgeExecutor.address, encodedQueue, 1500000],
  );

  return encodedRootCalldata;
};

async function main(): Promise<void> {
  validateBaseEnvs();
  const deployer = await getFirstSigner();

  const OVM_L1_MESSENGER_PROXY = "0x5086d1eEF304eb5284A0f6720f79403b4e9bE294";
  const GOVV2_L1_GOERLI = "0xD5BB4Cd3dbD5164eE5575FBB23542b120a52BdB8";
  const EXE_L1_GOERLI = "0xb6f416a47cACb1583903ae6861D023FcBF3Be7b6";
  const EXE_L2_OP_GOERLI = "0x6971BD7c2BACd8526caFD70C3A0D8cFBD8e9d62F";
  const LYRA_TOKEN = "0xF27A512e26e3e77498B2396fC171d1EE2747E1c4";
  const TRANSFER_ETH = "0xEBdB1EC3e97A5Eb9C20D94D26037B1d71b703C19";

  const lyraGov = new ethers.Contract(GOVV2_L1_GOERLI, governanceAbi, deployer);
  const lyraToken = new ethers.Contract(LYRA_TOKEN, tokenAbi, deployer);
  const optimismBridgeExecutor = new ethers.Contract(EXE_L2_OP_GOERLI, opExecutorAbi, deployer);
  // const transferEth = new ethers.Contract(TRANSFER_ETH, transferEthAbi, deployer);

  const toAddress = "0xC1D0048b50bB4D67dDbF3ba14Abc6Fca05a6A66C";

  const encodedRootCalldata = await createOptimismBridgeCalldata(
    optimismBridgeExecutor,
    lyraToken,
    "transfer(address, uint256)",
    [toAddress, toBN("999")],
  );

  const tx1 = await lyraGov.create(
    EXE_L1_GOERLI,
    [OVM_L1_MESSENGER_PROXY],
    [0],
    ["sendMessage(address,bytes,uint32)"],
    [encodedRootCalldata],
    [false],
    toBytes32(""),
  );

  console.log("Transaction sent", tx1.hash);
  await tx1.wait();

  console.log("\n****** Finished creating proposal ******");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
