# SubscribeNFT Smart Contract

![Solidity Version](https://img.shields.io/badge/solidity-0.8.0-blue)
![License](https://img.shields.io/badge/license-Unlicense-lightgrey)
![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-contracts-green)
![Hardhat](https://img.shields.io/badge/built%20with-Hardhat-orange)

## Introduction
 The `SubscribeNFT` contract is a unique implementation of a Non-Fungible Token (NFT) on the Ethereum blockchain, leveraging ERC-721 standards. This contract is designed for subscriptions and sponsorships, where users can mint and extend the life of NFTs using both Ether (ETH) and ERC20 tokens.

## Features
- ERC-721 Compliant: Fully compatible with the ERC-721 standard for NFTs.
- Multi-Currency Support: Allows for transactions in both ETH and various ERC20 tokens.
- Dynamic Pricing: Artists can set and update prices for minting and extending NFTs in both ETH and ERC20 tokens.
- Fee Management: Includes mechanisms for setting and collecting fees in both ETH and ERC20 tokens.
- Reentrancy Protection: Secured against reentrancy attacks.
- Enumerable NFTs: Supports enumerating NFTs owned by an account.
- OpenZeppelin Integration: Utilizes OpenZeppelin contracts for security and standard compliance.

## Setup

1. Install Dependencies: Make sure you have node.js and yarn installed.
```shell
yarn
```
2. Deployment: Deploy the contract on the Ethereum network using a tool Hardhat.
   
## Functions Overview
- `mint` and `extend`: Mint new NFTs or extend their expiration using ETH.
- `mintWithERC20` and `extendWithERC20`: Mint and extensions are run with permitted ERC20 tokens.
- `setPriceETH`, `setPriceERC20`, `setFeeETH`, `setFeeERC20`: Set prices and fees.
- `setAllowERC20`: Enable or disable specific ERC20 tokens for transactions.
- `withdrawETH` and `withdrawERC20`: Withdraw collected ETH and ERC20 tokens.
- Custom setters and getters for prices, fees, and allowed tokens.

## Usage
1. Minting an NFT: Call mint with ETH or mintWithERC20 with an ERC20 token to mint a new NFT.
2. Setting Prices: Use setPriceETH or setPriceERC20 to set the price for minting and extending NFTs.
3. Managing Fees: Set fees for transactions using setFeeETH and setFeeERC20.
4. Withdrawing Funds: Collected fees and payments can be withdrawn by the contract owner or specified artists.

# Hardhat

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.ts
TS_NODE_FILES=true npx ts-node scripts/deploy.ts
npx eslint '**/*.{js,ts}'
npx eslint '**/*.{js,ts}' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

# Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).
