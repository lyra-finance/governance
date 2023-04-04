// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.7.5;
pragma experimental ABIEncoderV2;

import { VirtualAAVEStakedToken } from "./virtual-aave/VirtualAAVEStakedToken.sol";
import { IERC20 } from "@aave/aave-stake-v2/contracts/interfaces/IERC20.sol";
import { SafeMath } from "@aave/aave-stake-v2/contracts/lib/SafeMath.sol";
import { SafeERC20 } from "@aave/aave-stake-v2/contracts/lib/SafeERC20.sol";

/**
 * @title LyraSafetyModule
 * @notice Contract to stake Lyra token, tokenize the position and get rewards, inheriting from AAVE StakedTokenV3
 * @author Lyra
 **/
contract LyraSafetyModule is VirtualAAVEStakedToken {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  string internal constant NAME = "Staked Lyra";
  string internal constant SYMBOL = "stkLYRA";
  uint8 internal constant DECIMALS = 18;

  constructor(
    IERC20 stakedToken,
    uint256 cooldownSeconds,
    uint256 unstakeWindow,
    address rewardsVault,
    address emissionManager,
    uint128 distributionDuration
  )
    public
    VirtualAAVEStakedToken(
      stakedToken,
      IERC20(address(this)),
      cooldownSeconds,
      unstakeWindow,
      rewardsVault,
      emissionManager,
      distributionDuration,
      NAME,
      SYMBOL,
      DECIMALS,
      address(0)
    )
  {}

  function stake(address onBehalfOf, uint256 amount) public override {
    super.stake(onBehalfOf, amount);
    emit CooldownUpdated(onBehalfOf, balanceOf(onBehalfOf), stakersCooldowns[onBehalfOf]);
  }

  function redeem(address to, uint256 amount) public override {
    super.redeem(to, amount);
    emit CooldownUpdated(msg.sender, balanceOf(msg.sender), stakersCooldowns[msg.sender]);
  }

  function cooldown() public override {
    super.cooldown();
    emit CooldownUpdated(msg.sender, balanceOf(msg.sender), stakersCooldowns[msg.sender]);
  }

  function transfer(address recipient, uint256 amount) public override returns (bool) {
    super.transfer(recipient, amount);
    emit CooldownUpdated(msg.sender, balanceOf(msg.sender), stakersCooldowns[msg.sender]);
    emit CooldownUpdated(recipient, balanceOf(recipient), stakersCooldowns[recipient]);
    return true;
  }

  function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
    super.transferFrom(sender, recipient, amount);
    emit CooldownUpdated(sender, balanceOf(sender), stakersCooldowns[sender]);
    emit CooldownUpdated(recipient, balanceOf(recipient), stakersCooldowns[recipient]);
    return true;
  }

  function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
    // Additionally keep track when the total supply changes
    // We use the address(0) _votingSnapshots to preserve the shape of the state in the contracts

    // When tokens are minted
    if (from == address(0)) {
      uint previous = this.totalSupply();
      _writeSnapshot(
        _votingSnapshots,
        _votingSnapshotsCounts,
        address(0), // use address(0) for snapshotting total supply
        uint128(previous),
        uint128(previous.add(amount))
      );
    }
    // When tokens are burnt
    if (to == address(0)) {
      uint previous = this.totalSupply();
      _writeSnapshot(
        _votingSnapshots,
        _votingSnapshotsCounts,
        address(0), // use address(0) for snapshotting total supply
        uint128(previous),
        uint128(previous.sub(amount))
      );
    }
    super._beforeTokenTransfer(from, to, amount);
  }

  /**
   * @dev returns the total supply at a certain block number
   * used by the voting strategy contracts to calculate the total votes needed for threshold/quorum
   **/
  function totalSupplyAt(uint256 blockNumber) external view override returns (uint256) {
    // If there are no snapshots, return the current total supply
    if (_votingSnapshotsCounts[address(0)] == 0) {
      return super.totalSupply();
    }

    // Take the first snapshot if the requested block is before the first snapshot
    if (_votingSnapshots[address(0)][0].blockNumber > blockNumber) {
      return _votingSnapshots[address(0)][0].value;
    }

    return _searchByBlockNumber(_votingSnapshots, _votingSnapshotsCounts, address(0), blockNumber);
  }

  event CooldownUpdated(address indexed user, uint256 balance, uint256 cooldownTimestamp);
}
