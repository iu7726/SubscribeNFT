import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { ERC20Token, SubscribeNFT } from "../typechain";

let subscribeNFT: SubscribeNFT;
let erc20Token: ERC20Token;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ONE_ETHER = BigNumber.from(Math.pow(10, 10)).mul(Math.pow(10, 8)).toString();
const HALF_ETHER = BigNumber.from(ONE_ETHER).div(2).toString();
const FEE_ETHER = ethers.utils.parseEther("0.01");

const parseEther = (val: string) => ethers.utils.parseEther(val);
const formatEther = (val: string) => ethers.utils.formatEther(val);

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const SubscribeNFT = await ethers.getContractFactory("SubscribeNFT")
  subscribeNFT = await SubscribeNFT.deploy();

  console.log(`const SubscribeNFT = "${subscribeNFT.address}"`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});