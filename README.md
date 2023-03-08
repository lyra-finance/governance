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

### Deploy

Add a `.env.private` file to `deployments/{network}/` for the network where you want to deploy

```sh
cp scripts/.env.example scripts/.env
```
