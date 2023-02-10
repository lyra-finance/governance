// SPDX-License-Identifier: ISC
pragma solidity 0.7.5;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TokenSwapper
 * @author Lyra
 * @dev Swap from one token to another 1:1
 */
contract TokenMigrator is Ownable {
  IERC20 public immutable fromToken;
  IERC20 public immutable toToken;

  constructor(IERC20 _fromToken, IERC20 _toToken) Ownable() {
    fromToken = _fromToken;
    toToken = _toToken;
  }

  function swap(uint amount) external {
    require(amount != 0, "Invalid swap amount");
    fromToken.transferFrom(msg.sender, address(this), amount);
    toToken.transfer(msg.sender, amount);
  }

  function withdraw(address recipient, uint fromTokenAmt, uint toTokenAmt) external onlyOwner {
    require(recipient != address(0), "Invalid recipient");
    if (fromTokenAmt > 0) {
      fromToken.transfer(recipient, fromTokenAmt);
    }
    if (toTokenAmt > 0) {
      toToken.transfer(recipient, toTokenAmt);
    }
  }
}
