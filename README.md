# Lyra Governance

## Documentation

![](docs/uml/lyra.png?raw=true)

- [Smart contracts API documentation](SUMMARY.md)

- [Lyra Safety Module](docs/safety-module/safety-module.md)

## Usage

### Pre Requisites

Before running any command, make sure to install dependencies:

```sh
$ yarn install
```

### Compile

Compile the smart contracts:

```sh
$ yarn build
```

### Lint Solidity

Lint the Solidity code:

```sh
$ yarn lint:sol
```

### Lint TypeScript

Lint the TypeScript code:

```sh
$ yarn lint:ts
```

### Test

Run the tests:

```sh
$ yarn test
```

### Coverage

Generate the code coverage report:

```sh
$ yarn coverage
```

### Deploy

Create `.env` file and complete the variables:

```sh
cp scripts/.env.example scripts/.env
```

For a full step by step contracts deployment, follow [these](./scripts/README.md) instructions.

#### Lyra Token

Deploy the token contract to Mainnet Network:

```sh
$ yarn deploy:mainnet
```

Kovan example:

```sh
$ yarn deploy:kovan
```

#### StakedLyra implementation and Proxy

Deploy the StakedLyra implementation contract and Proxy to Mainnet Network:

```sh
$ yarn deploy:stakedLyra:mainnet
```

Kovan example:

```sh
$ yarn deploy:stakedLyra:kovan
```

#### StakingRewards for Liquidity Certificate

Deploy the StakingRewards contract to Optimism Mainnet Network:

```sh
$ yarn deploy:stakingRewards:mainnetOvm
```

Optimism Kovan example:

```sh
$ yarn deploy:stakingRewards:kovanOvm
```
