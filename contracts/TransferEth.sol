// SPDX-License-Identifier: ISC
pragma solidity 0.7.5;

contract TransferEth {
  function transferEth(address payable destination, uint amount) external {
    destination.transfer(amount);
  }
}
