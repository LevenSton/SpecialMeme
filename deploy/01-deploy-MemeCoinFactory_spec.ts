/* Imports: Internal */
import { DeployFunction } from 'hardhat-deploy/dist/types'

import { ethers, upgrades } from 'hardhat';

const deployFn: DeployFunction = async (hre) => {
  
  const { deployer } = await hre.getNamedAccounts()

  const memeCoinManagerAddr = ""

  const MemeCoinFactory = await ethers.getContractFactory("MemeCoinFactory");
  const proxy = await upgrades.deployProxy(MemeCoinFactory, [deployer, memeCoinManagerAddr]);
  const proxyAddress = await proxy.getAddress()
  await proxy.waitForDeployment()
  
  console.log("proxy address: ", proxyAddress)
  console.log("admin address: ", await upgrades.erc1967.getAdminAddress(proxyAddress))
  console.log("implement address: ", await upgrades.erc1967.getImplementationAddress(proxyAddress))
}

// This is kept during an upgrade. So no upgrade tag.
deployFn.tags = ['DeployMemeCoinFactory']

export default deployFn
