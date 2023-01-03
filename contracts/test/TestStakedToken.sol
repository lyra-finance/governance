// SPDX-License-Identifier: ISC
pragma solidity 0.7.5;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IStakedLyra } from "../interfaces/IStakedLyra.sol";

contract TestStakedToken is ERC20, IStakedLyra {
  using SafeMath for uint256;

  // Cooldown period of 1 day
  uint256 public constant COOLDOWN_SECONDS = 86400000;

  // Unstake window period of 1 day
  uint256 public constant UNSTAKE_WINDOW = 86400000;

  IERC20 public immutable STAKED_TOKEN;

  /// @notice Address to pull from the rewards, needs to have approved this contract
  address public immutable REWARDS_VAULT;

  mapping(address => uint256) public stakerRewardsToClaim;
  mapping(address => uint256) public stakersCooldowns;

  constructor(string memory name, string memory symbol, IERC20 stakedToken, address rewardsVault) ERC20(name, symbol) {
    STAKED_TOKEN = stakedToken;
    REWARDS_VAULT = rewardsVault;
  }

  function stake(address onBehalfOf, uint256 amount) external override {
    require(amount != 0, "INVALID_ZERO_AMOUNT");

    _mint(onBehalfOf, amount);
    IERC20(STAKED_TOKEN).transferFrom(msg.sender, address(this), amount);
  }

  function redeem(address to, uint256 amount) external override {
    require(amount != 0, "INVALID_ZERO_AMOUNT");

    uint256 cooldownStartTimestamp = stakersCooldowns[msg.sender];
    require(block.timestamp > cooldownStartTimestamp.add(COOLDOWN_SECONDS), "INSUFFICIENT_COOLDOWN");
    require(
      block.timestamp.sub(cooldownStartTimestamp.add(COOLDOWN_SECONDS)) <= UNSTAKE_WINDOW,
      "UNSTAKE_WINDOW_FINISHED"
    );

    uint256 balanceOfMessageSender = balanceOf(msg.sender);
    uint256 amountToRedeem = (amount > balanceOfMessageSender) ? balanceOfMessageSender : amount;

    _burn(msg.sender, amountToRedeem);

    if (balanceOfMessageSender.sub(amountToRedeem) == 0) {
      stakersCooldowns[msg.sender] = 0;
    }

    IERC20(STAKED_TOKEN).transfer(to, amountToRedeem);
  }

  function cooldown() external override {
    require(balanceOf(msg.sender) != 0, "INVALID_BALANCE_ON_COOLDOWN");
    stakersCooldowns[msg.sender] = block.timestamp;
  }

  function claimRewards(address to, uint256 amount) external override {
    uint256 newTotalRewards = stakerRewardsToClaim[msg.sender];
    uint256 amountToClaim = (amount == type(uint256).max) ? newTotalRewards : amount;

    stakerRewardsToClaim[msg.sender] = newTotalRewards.sub(amountToClaim, "INVALID_AMOUNT");

    STAKED_TOKEN.transferFrom(REWARDS_VAULT, to, amountToClaim);
  }

  // Methods for testing

  function setRewards(address to, uint256 amount) external {
    stakerRewardsToClaim[to] = amount;
  }
}
