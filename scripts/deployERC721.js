const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const tokenERC721Contract = await hre.ethers.getContractFactory("TokenERC721")
    const tokenERC721 = await tokenERC721Contract.deploy()
    await tokenERC721.deployed()
    console.log(tokenERC721.address)
}
  
  
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});
  