# Lyra Safety Module

This document is based on [aave-stake-v2 README](https://github.com/aave/aave-stake-v2/blob/cef5a67308c14938035d29f7214c55610bcf04d2/README.md) since the implementation of Lyra Safety Module is based on [AAVE Safety Module](https://github.com/aave/aave-stake-v2/blob/cef5a67308c14938035d29f7214c55610bcf04d2)

Changes from the original version of the contracts can be observed in this [link](https://github.com/lyra-finance/aave-stake-v2/compare/diff-base...lyra-finance:diff-change), considering that the base version of [StakedTokenNoGov.sol](https://github.com/lyra-finance/aave-stake-v2/blob/diff-base/contracts/stake/StakedTokenNoGov.sol) is identical to [StakedTokenV2.sol](https://github.com/aave/aave-stake-v2/blob/cef5a67308c14938035d29f7214c55610bcf04d2/contracts/stake/StakedTokenV2.sol) which is the version being used by AAVE at the time this was created.

### Architecture

![General architecture](../../docs/safety-module/lyra-sm.png)

A common parent contract `AaveDistributionManager` is used to keep the "accounting" logic for a set of children front contracts taking care of each type of incentive; being these, initially, a `StakedLyra` contract for stake of Lyra tokens on the Lyra SM (Security Module) which will be used as security fund in the near future.
The rationale of this inheritance chain in 2 main layers is the clearly conceptual separation between a common part of configurations of the distributions and mathematical calculation, and one specific part for each type of incentive (locking funds in a stake).
Additionally, there will be a Rewards vault where the LYRA rewards will be keep, to distribute through the `StakedLyra`which should be granted in advance with allowance to pull funds from.
The following sections will go in detail on the specification of both the `AaveDistributionManager` and the front contract.

### AaveDistributionManager

Core contract for calculation of multiple distributions with different configurations. All the front contracts which users/lyra escrow will interact with inherit from the `AaveDistributionManager`.
It calculates how many rewards belong to a certain user depending on the user's situation defined by the front contract of the distribution. This calculation is done by using a distribution index representing the accumulation of rewards from an emission per second and snapshoting that index on each user to take into account how much of the total belongs to him.

#### Data

- `assets`. Mapping of `AssetData` structs which, for each front contract connected to the `AaveDistributionManager` stores 1 or more of:
  - `emissionPerSecond`: Amount of rewards per second distribution-wide. It's used to calculate the raw amount of rewards to distribute in a time delta since the last update of the following described `index`.
  - `index`: Variable representing the accumulated rewards distributed distribution-wide per unit of token used in the specific child contract of the distribution (per unit of staked Lyra in the case of the `StakedLyra` child contract). The next index is calculated by the formula on `_getNormalizedDistribution()` **emissionPerSecond _ timeDelta _ 10^PRECISION / balanceOnFrontContract + previousIndex**, scaling it up multiplying by 10^18 in order to not lose precision.
  - `lastUpdateTimestamp`: timestamp when the struct was updated.
  - `userIndexes`: mapping user address => index snapshotted on the user from the one of the distribution.

For the child `StakedLyra`, they key of the mapping used is the address of the `StakedLyra` itself.

#### Logic

This contract allows to do the following:

- **Configuration of multiple distributions**: only allowed to a trusted `EMISSION_MANAGER`, allows to list an specific distribution, with some emission per second and front contract.
- **Update of user/distribution state on interaction**: called by the child contract when something happened concerning the situation on the user, for example when he stakes on `StakedLyra`, redeems, etc...
- **Get the unclaimed rewards of an user**: self-explanatory, used by the children contracts to check how much rewards were accrued for an user and store the data if needed on their side, by interacting with the `claimRewards()` function.
- **Query information about distributions/users**: by using the different view functions available.

### StakedLyra

Contract to stake LYRA token, to be connected with a slashing mechanism in the near future in order to secure the Lyra protocol, forming the so called Lyra SM (Security Module).
Holders of Lyra tokens stake them in this contract, they receive equivalent amount in `stkLYRA` tokens and start accruing rewards in LYRA; rewards previously configured on the father contract `AaveDistributionManager` by the a trusted **EMISSION_MANAGER**. Once they accrued LYRA rewards, they can claim them at any moment but, to withdraw their staked LYRA tokens, they need to activate and wait a cooldown period, and withdraw just after it, during a withdrawal time window.

#### Data

- `stakerRewardsToClaim`: mapping storing the accrued rewards accrued and stored for an user, not taking into account those accrued but not stored yet.
- `stakersCooldowns`: mapping the timestamp of activation of cooldown period for an user, if activated.

#### Logic

This contract allows to do the following:

- **Stake LYRA tokens to start accruing rewards**: through the `stake()` function. The LYRA tokens will be locked in this same contract, and stkLYRA tokens will be minted for the user in the same proportion as LYRA staked, the state in the father `AaveDistributionManager` will be updated and the timestamp of the cooldown will be updated too.
- **Withdraw staked LYRA tokens**: if an user has stkLYRA, he can call the `redeem()` function, burning the stkLYRA and receiving the same proportion of previously staked LYRA. The withdrawal will only succeed if the user is on the withdrawal window after the cooldown period.
- **Activate the cooldown period**: self-explanatory, calling the `cooldown()` function and needed to withdraw the staked LYRA.
- **Claim the accrued rewards**: by calling the `claimRewards()` function, used to update the state and transfer to the user the accrued rewards, consequence of the time he was/is staking.
- **Query information about users**: about their rewards or cooldown period.

#### Cooldown period

The main objective of the cooldown period is to avoid situations on the future Security Module when, if an slashing event happens, people starts withdrawing in mass their staked funds, leaving the protocol uncover and removing the utility on the stake itself.
To achieve this, the most important condition to be fulfilled on any state update/operation involving the `StakedLyra` contract is that, if a user staking withdraws, he already respected a cooldown period, which leads that movement of funds should only affect "negatively" the cooldown period.
Depending on the type of operation, the cooldown period is affected in the following way:

- If an user stakes LYRA with/without having any fund staked before, if he didn't have the cooldown activated, it remains the same way.
- If an user stakes LYRA holding already stkLYRA and with cooldown period activated:
  - If the cooldown is expired, remains expired.
  - If the cooldown is still valid, using the amount staked and the current timestamp, it does the weighted average with the current cooldown timestamp of the user.
- If the user redeems LYRA, the cooldown timestamp is set to 0.
- If the user claims rewards, the cooldown timestamp is not affected.
- On transfer of stkLYRA:
- The cooldown timestamp of the sender remains as it is.
- On the recipient:
  - If the recipient is on a valid cooldown period finishing before that the one of the sender, we do the same weighted average as in stake().
  - If the recipient has an expired cooldown timestamp, his cooldown timestamp is set to 0.
  - If both sender and recipient have valid cooldown period activated and the one of the sender ends before than the recipient, the recipient keeps his own.

### Deployment and configuration

There are two steps required, first the deployment of the contracts and then the configuration of the rewards.

#### Deployment

1. Configure the specific env variables
   ```
   SM_PROXY_ADMIN=
   SM_COOLDOWN=
   SM_UNSTAKE_WINDOW=
   SM_REWARDS_VAULT=
   SM_EMISSION_MANAGER=
   SM_DISTRIBUTION_DURATION=
   ```
   Note: Make sure `SM_PROXY_ADMIN` and `SM_EMISSION_MANAGER` are different Multisig accounts to correctly perform the configuration required later. The same Multisig can be used for `SM_EMISSION_MANAGER` and `SM_REWARDS_VAULT`.
2. Run the deployment script `yarn deploy:stakedLyra:mainnet`

#### Rewards configuration

There are two transactions required to be executed.

1. The emission manager should call `stakedLyra.configureAssets(DistributionTypes.AssetConfigInput[] calldata assetsConfigInput)`
   1. Example of how to specify values: `stakedLyra.configureAssets([["emissionPerSecondValue","totalAmountToDistribute", "stakedLyraAddress"]])`
2. The reward vault should call `lyra.approve(stakedLyraAddress, totalAmountToDistribute)`
