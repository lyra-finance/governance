import { getFirstSigner } from "../../helpers/helpers";
import { validateBaseEnvs } from "../utils/validation";
import { ethers } from "hardhat";
import { toBN, toBytes32 } from "../../test/utils";
import { BigNumber, Contract } from "ethers";
import { formatUnits, hexDataLength } from "ethers/lib/utils";
import governanceAbi from "./abis/Governance.json";
import tokenAbi from "./abis/LyraToken.json";
import arbitrumExecutorAbi from "./abis/ArbitrumExecutor.json";
import arbitrumInboxAbi from "./abis/ArbitrumInbox.json";

export class BridgeData {
  l1Value: any;
  encodedRootCalldata: string;
  constructor(l1Value: any, encodedRootCalldata: string) {
    this.l1Value = l1Value;
    this.encodedRootCalldata = encodedRootCalldata;
  }
}

const createArbitrumBridgeCalldata = async (
  arbitrumInbox: Contract,
  arbitrumBridgeExecutor: Contract,
  targetContract: Contract,
  fn: string,
  params: any[],
  refundAddress: string,
): Promise<BridgeData> => {
  const targets: string[] = [targetContract.address];
  const values: BigNumber[] = [BigNumber.from(0)];
  const signatures: string[] = [""];
  const calldatas: string[] = [targetContract.interface.encodeFunctionData(fn, [...params])];
  const withDelegatecalls: boolean[] = [false];

  const encodedQueue = arbitrumBridgeExecutor.interface.encodeFunctionData("queue", [
    targets,
    values,
    signatures,
    calldatas,
    withDelegatecalls,
  ]);

  const bytesLength = hexDataLength(encodedQueue);
  const submissionCost = await arbitrumInbox.calculateRetryableSubmissionFee(bytesLength, 0);
  const submissionCostWithMargin = submissionCost.add(ethers.utils.parseUnits("10", "gwei"));

  const l2Provider = new ethers.providers.JsonRpcProvider("https://goerli.infura.io/v3/" + process.env.INFURA_API_KEY);
  const gasPriceBid = await l2Provider.getGasPrice();

  const retryableTicket = {
    destAddr: arbitrumBridgeExecutor.address,
    arbTxCallValue: 0,
    maxSubmissionCost: submissionCostWithMargin,
    submissionRefundAddress: refundAddress,
    valueRefundAddress: refundAddress,
    maxGas: BigNumber.from(200000).mul(3),
    gasPriceBid: ethers.utils.parseUnits("1", "gwei"),
    data: encodedQueue,
  };

  const value = retryableTicket.maxSubmissionCost.add(retryableTicket.maxGas.mul(retryableTicket.gasPriceBid));

  console.log("GasPriceBid", gasPriceBid);
  console.log("GasPriceBid", value);
  console.log("GasPriceBid", ethers.utils.parseUnits("0.6", "gwei"));
  console.log("GasPriceBid", ethers.utils.parseUnits("1", "gwei"));

  const encodedRootCalldata = await arbitrumInbox.populateTransaction.createRetryableTicket(
    retryableTicket.destAddr,
    retryableTicket.arbTxCallValue,
    retryableTicket.maxSubmissionCost,
    retryableTicket.submissionRefundAddress,
    retryableTicket.valueRefundAddress,
    retryableTicket.maxGas,
    retryableTicket.gasPriceBid,
    retryableTicket.data,
    {
      value: value,
    },
  );
  console.log(`Value: ${formatUnits(value)}`);

  return new BridgeData(value, encodedRootCalldata.data as string);
};

async function main(): Promise<void> {
  validateBaseEnvs();
  const deployer = await getFirstSigner();
  const GOVV2_L1_GOERLI = "0xD5BB4Cd3dbD5164eE5575FBB23542b120a52BdB8";
  const EXE_L1_GOERLI = "0xb6f416a47cACb1583903ae6861D023FcBF3Be7b6";
  const LYRA_ARBI = "0x0ddE89A15bC4C4Fb32a79fa68dD07E3dee24675D";
  const EXE_L2_ARBI_GOERLI = "0x2D2aBC9CEebd6532b934C92FF2A2d2fd00314E1A";
  const ARBI_INBOX = "0x6BEbC4925716945D46F0Ec336D5C2564F419682C";

  const lyraToken = new ethers.Contract(LYRA_ARBI, tokenAbi, deployer);
  const lyraGov = new ethers.Contract(GOVV2_L1_GOERLI, governanceAbi, deployer);
  const arbiBridgeExecutor = new ethers.Contract(EXE_L2_ARBI_GOERLI, arbitrumExecutorAbi, deployer);
  const arbiInbox = new ethers.Contract(ARBI_INBOX, arbitrumInboxAbi, deployer);

  const toAddress = "0xC1D0048b50bB4D67dDbF3ba14Abc6Fca05a6A66C";

  const data: BridgeData = await createArbitrumBridgeCalldata(
    arbiInbox,
    arbiBridgeExecutor,
    lyraToken,
    "transfer(address, uint256)",
    [toAddress, toBN("1000")],
    deployer.address,
  );

  const tx1 = await lyraGov.create(
    EXE_L1_GOERLI,
    [ARBI_INBOX],
    [data.l1Value],
    [""],
    [data.encodedRootCalldata],
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
