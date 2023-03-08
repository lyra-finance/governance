import hre, { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import { parseEther } from "ethers/lib/utils";
import { expect } from "chai";
import { Lyra, MultiDistributor } from "../typechain";
import { toBN, ZERO_ADDRESS } from "./utils";

describe("LyraDistributor", function () {
  let signers: SignerWithAddress[];
  // let admin: SignerWithAddress;
  let lyraToken: Lyra;
  let distributor: MultiDistributor;

  before(async function () {
    signers = await hre.ethers.getSigners();
    // admin = signers[0];

    const name = "Lyra Token";
    const symbol = "Lyra";
    const supply = parseEther("1000");

    lyraToken = (await (await ethers.getContractFactory("Lyra")).deploy(name, symbol, supply)) as Lyra;
    distributor = (await (await ethers.getContractFactory("MultiDistributor")).deploy()) as MultiDistributor;
  });

  it("will claim even if no balance (skip tokens that have none)", async () => {
    await distributor.connect(signers[1]).claim([lyraToken.address]);
  });

  it("will revert if no tokens in distributor", async () => {
    await distributor.addToClaims(
      [
        {
          user: signers[1].address,
          amount: toBN("1"),
        },
      ],
      lyraToken.address,
      1,
      "test",
    );

    expect(await distributor.claimableBalances(signers[1].address, lyraToken.address)).eq(parseEther("1"));

    await expect(distributor.connect(signers[1]).claim([lyraToken.address])).revertedWith(
      "ERC20: transfer amount exceeds balance",
    );
    await lyraToken.transfer(distributor.address, parseEther("0.5"));
    await expect(distributor.connect(signers[1]).claim([lyraToken.address])).revertedWith(
      "ERC20: transfer amount exceeds balance",
    );
    await lyraToken.transfer(distributor.address, parseEther("0.5"));

    await distributor.connect(signers[1]).claim([lyraToken.address]);

    expect(await lyraToken.balanceOf(signers[1].address)).eq(parseEther("1"));
  });

  it("will calculate gas for 1000 airdrops", async () => {
    await lyraToken.transfer(distributor.address, parseEther("100"));
    await distributor.addToClaims(
      [
        {
          user: signers[1].address,
          amount: toBN("1"),
        },
      ],
      lyraToken.address,
      1,
      "test",
    );
    await distributor.addToClaims(
      [
        {
          user: signers[2].address,
          amount: toBN("2"),
        },
        {
          user: signers[3].address,
          amount: toBN("3"),
        },
      ],
      lyraToken.address,
      1,
      "test",
    );

    const res = await distributor.getClaimableForAddresses(
      [signers[1].address, signers[2].address],
      [lyraToken.address],
    );
    expect(res.claimed.length).eq(2);
    expect(res.claimable.length).eq(2);

    // will ignore zero address and random signer address, and still succeed
    await distributor.connect(signers[2]).claim([lyraToken.address, ZERO_ADDRESS, signers[1].address]);
  });
});
