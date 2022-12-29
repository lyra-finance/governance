// SPDX-License-Identifier: ISC
pragma solidity 0.7.5;

// https://docs.synthetix.io/contracts/source/interfaces/istakingrewards
interface IStakingRewards {
  // Mutative
  function stake(uint256 tokenId) external;

  function withdraw(uint256 tokenId) external;

  function getReward() external;

  function exit() external;

  // Views
  function lastTimeRewardApplicable() external view returns (uint256);

  function rewardPerToken() external view returns (uint256);

  function earned(address account) external view returns (uint256);

  function getRewardForDuration() external view returns (uint256);

  function totalSupply() external view returns (uint256);

  function balanceOf(address account) external view returns (uint256);
}
