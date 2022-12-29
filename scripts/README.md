# Supporting contract deployment

This document describes a suggestion for the steps for the correct deployment of all the Lyra supporting contracts

## Accounts

The following accounts will be required:

- `Account1`: EOA for deployments
- Multisigs:
  - `Multisig1` (Ethereum): Escrow ProxyAdmin & Safety Module ProxyAdmin
    - upgrades escrow implementation from escrow factory
    - set stakedToken in escrow factory
    - cancelVesting from escrow contracts
    - upgrades safety module implementation
    - Staking rewards admin
    - Staking rewards rewardsDistribution role
    - Bridge proxy Admin
  - `Multisig2` (Ethereum): Safety module emission manager & SM rewards vault
    - holds the Lyra tokens to be used as rewards in the SM
    - configures the rewards in the SM
  - `Multisig3` (Optimism):
    - Bridge proxy Admin
    - LC Staking rewards admin
    - LC Staking rewards rewardsDistribution role
    - Can be used to admin the Lyra protocol (outside of the scope of this document)

## Deployments and setups

First make sure to install dependencies, build the contracts and create the `.env` file as specified in the root's `README.md`.
You can try each deployment on kovan tests to avoid any issues when deploying to mainnet.
Each contract deployment address is stored in the `/deployments/deployments.json` file under the correct network attribute.

### Lyra token

1. Fill the specific env variables
   ```
   TOKEN_NAME=
   TOKEN_SYMBOL=
   TOKEN_SUPPLY=
   ```
2. Deploy the Lyra token using `Account1`
   ```bash
   yarn deploy:token:mainnet
   ```

### Escrow Factory and Escrow implementation contract

1. Make sure the following addresses are present:
   1. `LyraToken` for mainnet network (set in previous step) in `/deployments/deployments.json`
   2. `DelegateRegistry` for mainnet network (should be the one set [here](https://docs.snapshot.org/guides/delegation)) in `/deployments/externals.json`
2. Deploy the escrow implementation contract and escrow factory using `Account1`
   ```bash
   yarn deploy:escrowFactory:mainnet
   ```
3. After the deployment, `Account1` will be owner of the factory. The owner can upgrade the escrow implementation and set the staked token address. It makes sense to transfer the ownership to `Multisig1` by calling `factory.transferOwnership(Multisig1)`

### Escrow proxy

To deploy a new escrow proxy for a beneficiary, follow the next steps for each team member/investor.

1. Fill the specific env variables

   ```
   ESCROW_BENEFICIARY=
   ESCROW_ADMIN= # Should be address of Multisig1
   ESCROW_AMOUNT=
   ESCROW_VESTING_BEGIN=
   ESCROW_VESTING_END=
   ESCROW_VESTING_CLIFF=
   ```

2. Deploy the escrow proxy using `Account1`
   ```bash
   yarn deploy:escrowProxy:mainnet
   ```

### Safety Module

#### Deployment

1. Make sure the following addresses are present:
   1. `LyraToken` for mainnet network in `/deployments/deployments.json`
2. Configure the specific env variables

   ```
   SM_PROXY_ADMIN= # Should be address of Multisig1
   SM_COOLDOWN=
   SM_UNSTAKE_WINDOW=
   SM_REWARDS_VAULT= # Should be address of Multisig2
   SM_EMISSION_MANAGER= # Should be address of Multisig2
   SM_DISTRIBUTION_DURATION=
   ```

   Note: Make sure `SM_PROXY_ADMIN` and `SM_EMISSION_MANAGER` are different Multisig accounts to correctly perform the configuration required later. The same Multisig can be used for `SM_EMISSION_MANAGER` and `SM_REWARDS_VAULT`.

3. Run the deployment script
   ```bash
   yarn deploy:stakedLyra:mainnet
   ```

#### Rewards configuration

There are three transactions required to be executed.

1. The emission manager (`SM_EMISSION_MANAGER`) should call `stakedLyra.configureAssets(DistributionTypes.AssetConfigInput[] calldata assetsConfigInput)`
   1. Example of how to specify values: `stakedLyra.configureAssets([["emissionPerSecondValue","totalAmountToDistribute", "stakedLyraAddress"]])`
2. Transfer the amount of `totalAmountToDistribute` Lyra from `Account1` to `SM_REWARDS_VAULT`
3. The reward vault (`SM_REWARDS_VAULT`) should call `lyra.approve(stakedLyraAddress, totalAmountToDistribute)`

#### Configure safety module address on escrow contracts

To allow the escrow contracts to participate in safety module, the address of the stakedLyra should be added in the escrow factory.

1. The owner of the escrow factory should call `escrowFactory.setStakedToken(stakedLyraAddress)`

### Snapshot.org governance

Once the token and safety module are deployed, the strategies for the governance voting power in for the Lyra space in Snapshot.org should be configured. This is done using the website UI.

### Deploy and setup Staking Rewards for ERC20 tokens

Follow the instructions described in [this issue](https://github.com/lyra-finance/lyra-governance/issues/9) to deploy a Synthetix StakingRewards contracts using `Account1`. It makes sense to set `Multisig1` as the `RewardsDistribution` role (which is not transferable). After the deployment, if the owner parameter for the deployment was not updated as suggested in step 7 from the issue, the ownership of the StakingRewards contract should be transferred to the `Multisig1` by following these steps:

1. `Account1` calls `stakingRewards.nominateNewOwner(Multisig1)`
2. `Multisig1` calls `stakingRewards.acceptOwnership()`

### Lyra Bridge

1. Make sure the following addresses are present:
   1. `L1_XDOMAIN_MESSENGER` for mainnet network in `/deployments/external.json`
   2. `L2_XDOMAIN_MESSENGER` for mainnet-ovm network in `/deployments/external.json`
2. Configure the specific env variables
   ```
    BRIDGE_L1_PROXY_ADMIN= # Should be address of Multisig1
    BRIDGE_L2_PROXY_ADMIN= # Should be address of Multisig3
   ```
3. Run the deployment script
   ```bash
   yarn deploy:bridge:mainnet
   ```
4. Run the etherscan verification script
   ```bash
   yarn verify:bridge:mainnet
   ```

### Post Ethereum L1 contracts deployment

After deploying all the contracts in Ethereum and distributing the Lyra tokens to the escrows, safety module, Staking Rewards contracts and any other distribution (DEXes, etc), the remaining Lyra supply will continue in the `Account1` wallet. Some part of the Lyra tokens can be bridged to L2 to fund the Liquidity Certificate Staking Rewards, and the rest can be transferred to some Multisig to be used as Treasury.

### Liquidity Certificate Staking Rewards

1. Make sure the following addresses are present:
   1. `L2Lyra` for mainnet-ovm network in `/deployments/deployments.json`
2. Configure the specific env variables
   ```
    CSR_OWNER= # Should be address of Multisig3
    CSR_REWARDS_DISTRIBUTOR= # Should be address of Multisig3
    CSR_STAKING_TOKEN=
   ```
3. Run the deployment script
   ```bash
   yarn deploy:stakingRewards:mainnetOvm
   ```
4. After deployment, to fund and initialize the rewards:
   1. Transfer the amount of rewards tokens to the deployed StakingRewards
   2. Call `notifyRewardAmount(amountTransferredInStep1)` from the `Multisig3`
