import hre, { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import { parseEther } from "ethers/lib/utils";
import { expect } from "chai";
import { Lyra } from "../typechain";

describe("Lyra", function () {
  let signers: SignerWithAddress[];
  let admin: SignerWithAddress;

  before(async function () {
    signers = await hre.ethers.getSigners();
    admin = signers[0];
  });

  describe("Deployment", () => {
    it("should set name, symbol and mint the supply on deployment", async () => {
      const name = "Lyra Token";
      const symbol = "Lyra";
      const supply = parseEther("1000");

      const lyraToken = (await (await ethers.getContractFactory("Lyra")).deploy(name, symbol, supply)) as Lyra;

      expect(await lyraToken.name()).to.eq(name);
      expect(await lyraToken.symbol()).to.eq(symbol);
      expect(await lyraToken.decimals()).to.eq(18);
      expect(await lyraToken.totalSupply()).to.eq(supply);
      expect(await lyraToken.balanceOf(admin.address)).to.eq(supply);
    });
  });
});
