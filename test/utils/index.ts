import { Result } from "@ethersproject/abi";
import { BigNumber, ContractReceipt } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { signTypedData_v4 } from "eth-sig-util";
import { fromRpcSig } from "ethereumjs-util";
// import { expect } from './testSetup';

import { expect } from "chai";

export const ZERO_ADDRESS = ethers.constants.AddressZero;

export const BASE = ethers.BigNumber.from(10).pow(18); // 1e18
export const HALFBASE = ethers.BigNumber.from(10).pow(9); // 1e9
export const HOUR_SEC = 60 * 60;
export const DAY_SEC = 24 * HOUR_SEC;
export const WEEK_SEC = 7 * DAY_SEC;
export const MONTH_SEC = 28 * DAY_SEC;
export const SIX_MONTH_SEC = 6 * MONTH_SEC;
export const YEAR_SEC = 365 * DAY_SEC;
export const MAX_UINT = ethers.BigNumber.from(2).pow(256).sub(1);
export const UNIT = ethers.BigNumber.from(10).pow(18);

// allow for decimals to be passed in up to 9dp of precision
export function toBN(val: string) {
  // multiplier is to handle decimals
  if (val.includes("e")) {
    if (parseFloat(val) > 1) {
      const x = val.split(".");
      const y = x[1].split("e+");
      const exponent = parseFloat(y[1]);
      const newVal = x[0] + y[0] + "0".repeat(exponent - y[0].length);
      console.warn(`Warning: toBN of val with exponent, converting to string. (${val}) converted to (${newVal})`);
      val = newVal;
    } else {
      console.warn(
        `Warning: toBN of val with exponent, converting to float. (${val}) converted to (${parseFloat(val).toFixed(
          18,
        )})`,
      );
      val = parseFloat(val).toFixed(18);
    }
  } else if (val.includes(".") && val.split(".")[1].length > 18) {
    console.warn(`Warning: toBN of val with more than 18 decimals. Stripping excess. (${val})`);
    const x = val.split(".");
    x[1] = x[1].slice(0, 18);
    val = x[0] + "." + x[1];
  }
  return ethers.utils.parseUnits(val, 18);
}

export function fromBN(val: BigNumber): string {
  return ethers.utils.formatUnits(val, 18);
}

export function send(method: string, params?: Array<any>) {
  return ethers.provider.send(method, params === undefined ? [] : params);
}

export function mineBlock() {
  return send("evm_mine", []);
}

export function toBytes32(msg: string): string {
  return ethers.utils.formatBytes32String(msg);
}

/**
 *  Gets the time of the last block.
 */
export async function currentTime() {
  const { timestamp } = await ethers.provider.getBlock("latest");
  return timestamp;
}

/**
 *  Increases the time in the EVM.
 *  @param seconds Number of seconds to increase the time by
 */
export async function fastForward(seconds: number) {
  const method = "evm_increaseTime";
  const params = [seconds];

  // TODO: check which method we need for hardhat
  // method: 'evm_setNextBlockTimestamp',
  // params: [(await currentTime()) + seconds],

  await send(method, params);

  await mineBlock();
}

/**
 *  Increases the time in the EVM to as close to a specific timestamp as possible
 */
export async function fastForwardTo(time: number) {
  const timestamp = await currentTime();
  if (time < timestamp) {
    throw new Error(
      `Time parameter (${time}) is less than now ${timestamp}. You can only fast forward to times in the future.`,
    );
  }

  const secondsBetween = Math.floor(time - timestamp);
  await fastForward(secondsBetween);
}

/**
 *  Takes a snapshot and returns the ID of the snapshot for restoring later.
 */
export async function takeSnapshot(): Promise<number> {
  const result = await send("evm_snapshot");
  await mineBlock();
  return result;
}

/**
 *  Restores a snapshot that was previously taken with takeSnapshot
 *  @param id The ID that was returned when takeSnapshot was called.
 */
export async function restoreSnapshot(id: number) {
  await send("evm_revert", [id]);
  await mineBlock();
}

export function getEventArgs(receipt: ContractReceipt, eventName: string): Result {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const value = receipt.events!.find(e => e.event === eventName);
  if (value == undefined || value.args == undefined) {
    throw Error();
  }
  return value.args;
}

export function assertCloseTo(a: BigNumber, b: BigNumber, delta: BigNumber = toBN("0.5")) {
  expect(a.sub(b).abs().lte(delta), `${fromBN(a)} is not close to ${fromBN(b)} +/- ${fromBN(delta)}`).is.true;
}

export function assertCloseToPercentage(a: BigNumber, b: BigNumber, percentage: BigNumber = toBN("0.0005")) {
  if (b.eq(0)) {
    expect(a.eq(0), `${fromBN(a)} is not close to ${fromBN(b)} +/- ${fromBN(percentage.mul(100))}%`).is.true;
    return;
  }
  expect(
    b.sub(a).mul(toBN("1")).div(b).abs().lte(percentage),
    `${fromBN(a)} is not close to ${fromBN(b)} +/- ${fromBN(percentage.mul(100))}%`,
  ).is.true;
}

export function assertNotCloseToPercentage(a: BigNumber, b: BigNumber, percentage: BigNumber = toBN("0.0005")) {
  if (b.eq(0)) {
    expect(a.eq(0), `${fromBN(a)} is close to ${fromBN(b)} +/- ${fromBN(percentage.mul(100))}%`).is.false;
    return;
  }
  expect(
    b.sub(a).mul(toBN("1")).div(b).abs().lte(percentage),
    `${fromBN(a)} is close to ${fromBN(b)} +/- ${fromBN(percentage.mul(100))}%`,
  ).is.false;
}

export const buildPermitParams = async (
  chainId: number,
  token: string,
  revision: string,
  tokenName: string,
  owner: SignerWithAddress,
  spender: string,
  nonce: number,
  deadline: string,
  value: string,
) => {
  return ethers.utils.splitSignature(
    await owner._signTypedData(
      {
        name: tokenName,
        version: revision,
        chainId: chainId,
        verifyingContract: token,
      },
      {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      },
      {
        owner: owner.address,
        spender,
        value,
        nonce,
        deadline,
      },
    ),
  );
};

export const buildAndSignPermitMessage = async (
  chainId: number,
  token: string,
  revision: string,
  tokenName: string,
  owner: string,
  spender: string,
  nonce: number,
  deadline: string,
  value: string,
  privateKey: string,
) => {
  const data = {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Permit" as const,
    domain: {
      name: tokenName,
      version: revision,
      chainId: chainId,
      verifyingContract: token,
    },
    message: {
      owner,
      spender,
      value,
      nonce,
      deadline,
    },
  };

  const signature = signTypedData_v4(Buffer.from(privateKey.substring(2, 66), "hex"), {
    data,
  });
  return fromRpcSig(signature);
};
