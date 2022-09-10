const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const VoteChainContract = await hre.ethers.getContractFactory("VoteChain")
    const VoteChain = await VoteChainContract.deploy()
    await VoteChain.deployed()
    console.log(VoteChain.address)
  }

  
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
