import { ethers } from "hardhat";

import stkLyraAbi from "./abis/StakedLyra.json";
import executorAbi from "./abis/Executor.json";
import governanceAbi from "./abis/Governance.json";
import { fromBN, toBN, toBytes32 } from "../../test/utils";

const stkLyra = new ethers.Contract("0xCb9f85730f57732fc899fb158164b9Ed60c77D49", stkLyraAbi);
const executor = new ethers.Contract("0xEE86E99b42981623236824D33b4235833Afd8044", executorAbi);
const governance = new ethers.Contract("0xe8642cc1249F08756e70Bb8eb4BE0e6c09254fed", governanceAbi);

enum ProposalState {
  Pending,
  Canceled,
  Active,
  Failed,
  Succeeded,
  Queued,
  Expired,
  Executed,
}

async function main(): Promise<void> {
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  await provider.send("hardhat_reset", [
    {
      forking: {
        jsonRpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        blockNumber: 16938595,
      },
    },
  ]);

  const proposerAddr = "0x8746952f0953F3865774fF730905087D05D4136b";

  // proposer
  await provider.send("hardhat_impersonateAccount", [proposerAddr]);
  await provider.send("hardhat_setBalance", [proposerAddr, "0x1" + "0".repeat(18)]);

  let signer = await ethers.getSigner(proposerAddr);
  console.log("proposer original balance:", fromBN(await stkLyra.connect(signer).balanceOf(proposerAddr)));
  await stkLyra.connect(signer).transfer(executor.address, toBN("1"));

  const tx = await stkLyra.populateTransaction.transfer(signer.address, toBN("1"));

  await governance
    .connect(signer)
    .create(executor.address, [stkLyra.address], [0], [""], [tx.data as string], [false], toBytes32(""));
  const proposalCount = await governance.connect(signer).getProposalsCount();
  console.log({ proposalCount: proposalCount.toString() });

  console.log(
    "Proposal created:",
    ProposalState[await governance.connect(signer).getProposalState(proposalCount.sub(1))],
  );

  await ethers.provider.send("hardhat_mine", ["0x1c21", "0xc"]); // 7201
  await governance.connect(signer).submitVote(0, true);

  console.log("Vote1:", ProposalState[await governance.connect(signer).getProposalState(proposalCount.sub(1))]);

  // voter
  await ethers.provider.send("hardhat_impersonateAccount", ["0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1"]);
  await ethers.provider.send("hardhat_setBalance", [
    "0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1",
    "0x1" + "0".repeat(18),
  ]);
  signer = await ethers.getSigner("0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1");
  await governance.connect(signer).submitVote(0, true);

  console.log("Vote 2:", ProposalState[await governance.connect(signer).getProposalState(proposalCount.sub(1))]);

  // now execute
  await ethers.provider.send("hardhat_mine", ["0x" + (72001).toString(16), "0xc"]);

  console.log("Pre queue:", ProposalState[await governance.connect(signer).getProposalState(proposalCount.sub(1))]);

  // 72000
  await governance.connect(signer).queue(0);

  console.log("Post queue:", ProposalState[await governance.connect(signer).getProposalState(proposalCount.sub(1))]);

  await ethers.provider.send("evm_increaseTime", ["0x" + (86401).toString(16)]);
  await ethers.provider.send("hardhat_mine", []);

  console.log(
    "Fast forward 1d:",
    ProposalState[await governance.connect(signer).getProposalState(proposalCount.sub(1))],
  );

  // 604800
  console.log("\nbalance pre-execute:", fromBN(await stkLyra.connect(signer).balanceOf(proposerAddr)));

  await governance.connect(signer).execute(0);
  console.log("Post execute:", ProposalState[await governance.connect(signer).getProposalState(proposalCount.sub(1))]);

  console.log("\nbalance post-execute:", fromBN(await stkLyra.connect(signer).balanceOf(proposerAddr)));
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
