// SPDX-License-Identifier: ISC
pragma solidity 0.7.5;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TestRewardsVault {
  function setRewardsDistributor(address distributor, address rewardsToken) external {
    IERC20(rewardsToken).approve(distributor, type(uint256).max);
  }
}
