import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { network } from "hardhat"
import { ethers } from "ethers";

import fs from "fs";
import path from "path";

const deployHelloWorld: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  // Extract required utilities from Hardhat Runtime Environment
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;

  // Fetch named accounts
  const namedAccounts = await getNamedAccounts();
  const deployer = namedAccounts.deployer; // Assign deployer address

  // Deploy the HelloWorld contract
  const auraxToken = await deploy('AuraxToken', {
    from: deployer,
    args: [], // Pass constructor arguments
    log: true,
    autoMine: true, // Ensures transaction is mined immediately
  });

  // Log the deployed contract address
  log(`AuraxToken deployed at ${auraxToken.address}`);

  // Get the contract factory and instance
  const AuraxToken = await hre.ethers.getContractFactory('AuraxToken');
  const auraxTokenContract = await AuraxToken.attach(auraxToken.address);
  
  // Save contract details
  const contractData = {
    address: auraxToken.address,
    abi: auraxTokenContract.interface.format(),
    owner: deployer
  };

  const contractsDir = path.join(__dirname, "../..", "app", "src", "app", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(contractsDir, "AuraxToken.json"),
    JSON.stringify(contractData, null, 2)
  );
};

// Export the deployment function for Hardhat Deploy
export default deployHelloWorld;
deployHelloWorld.tags = ['AT'];

