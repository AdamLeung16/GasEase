// Hardhat部署脚本示例
// 需要先安装: npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const GaslessTransfer = await ethers.getContractFactory("GaslessTransfer");
  const gaslessTransfer = await GaslessTransfer.deploy();

  await gaslessTransfer.waitForDeployment();

  console.log("GaslessTransfer deployed to:", await gaslessTransfer.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

