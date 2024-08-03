
import {
    makeSuiteCleanRoom, owner, memeCoinFactory,ownerAddress, user, memeCoinManager, memeCoinManagerAddr
} from '../__setup.spec';
import { expect } from 'chai';
import { ERRORS } from '../helpers/errors';
import { MemeCoin__factory } from '../../typechain-types';
import { ethers } from 'hardhat';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber'

import bn from 'bignumber.js'
bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 })
// returns the sqrt price as a 64x96
function encodePriceSqrt(reserve1: BigNumberish, reserve0: BigNumberish): BigNumber {
  return BigNumber.from(
    new bn(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      .multipliedBy(new bn(2).pow(96))
      .integerValue(3)
      .toString()
  )
}

const tomorrow = parseInt((new Date().getTime() / 1000 ).toFixed(0)) + 24 * 3600

makeSuiteCleanRoom('create ERC404', function () {
    const mintPrice = ethers.parseEther("0.01");
    const sqrtPriceX96 = encodePriceSqrt(ethers.parseEther("0.01"), ethers.parseEther("1"));
    const sqrtPriceB96 = encodePriceSqrt(ethers.parseEther("1"), ethers.parseEther("0.01"));
    context('Generic', function () {
        context('Negatives', function () {
            it('User should fail to create if reserved large than supply.',   async function () {
                
                await expect(memeCoinFactory.connect(owner).createMemeCoin({
                    creator: ownerAddress, 
                    totalSupply: 10000,
                    reserved: 10001,
                    maxPerWallet: 100,
                    price: mintPrice,
                    preSaleDeadLine: tomorrow,
                    sqrtPriceX96: sqrtPriceX96.toBigInt(),
                    sqrtPriceB96: sqrtPriceB96.toBigInt(),
                    name: "MoMo", 
                    symbol: "Momo"
                })).to.be.revertedWithCustomError(memeCoinFactory, ERRORS.ReservedTooMuch)
            });

            it('User should fail to create twice using same param.',   async function () {
                await expect(memeCoinFactory.connect(owner).createMemeCoin({
                    creator: ownerAddress, 
                    totalSupply: 10000,
                    reserved: 0,
                    maxPerWallet: 100,
                    price: mintPrice,
                    preSaleDeadLine: tomorrow,
                    sqrtPriceX96: sqrtPriceX96.toBigInt(),
                    sqrtPriceB96: sqrtPriceB96.toBigInt(),
                    name: "MoMo", 
                    symbol: "Momo"
                })).to.be.not.reverted;
                await expect(memeCoinFactory.connect(owner).createMemeCoin({
                    creator: ownerAddress, 
                    totalSupply: 10000,
                    reserved: 0,
                    maxPerWallet: 100,
                    price: mintPrice,
                    preSaleDeadLine: tomorrow,
                    sqrtPriceX96: sqrtPriceX96.toBigInt(),
                    sqrtPriceB96: sqrtPriceB96.toBigInt(),
                    name: "MoMo", 
                    symbol: "Momo"
                })).to.be.revertedWithCustomError(memeCoinFactory, ERRORS.ContractAlreadyExist);
            });
        })

        context('Scenarios', function () {
            it('Create meme collection if pass correct param.',   async function () {
                await expect(memeCoinFactory.connect(owner).createMemeCoin({
                    creator: ownerAddress, 
                    totalSupply: 10000,
                    reserved: 100,
                    maxPerWallet: 100,
                    price: mintPrice,
                    preSaleDeadLine: tomorrow,
                    sqrtPriceX96: sqrtPriceX96.toBigInt(),
                    sqrtPriceB96: sqrtPriceB96.toBigInt(),
                    name: "MoMo", 
                    symbol: "Momo"
                }, {value: ethers.parseEther("1")})).to.not.be.reverted;
            })
            it('Get correct variable emoji collection if pass correct param.',     async function () {
                
                let erc404Address: string
                let totalSupply = 10000
                let reserved0 = 0
                let reserved1 = 1000
                let maxPerWallet = 100
                let price0 = 0
                let price1 = mintPrice
                let name = "MemeCoin"
                let symbol = "MemeCoin"
                
                await expect(memeCoinFactory.connect(owner).createMemeCoin({
                        creator: ownerAddress, 
                        totalSupply: totalSupply,
                        reserved: reserved1,
                        maxPerWallet: maxPerWallet,
                        price: mintPrice,
                        preSaleDeadLine: tomorrow,
                        sqrtPriceX96: sqrtPriceX96.toBigInt(),
                        sqrtPriceB96: sqrtPriceB96.toBigInt(),
                        name: name, 
                        symbol: symbol
                    }, {value: ethers.parseEther("15")})
                ).to.not.be.reverted;

                erc404Address = await memeCoinFactory.connect(owner)._memeCoinContract(ownerAddress, name);
    
                let brc404Contract = MemeCoin__factory.connect(erc404Address, user);
                expect(await brc404Contract.balanceOf(memeCoinManagerAddr)).to.equal(totalSupply-reserved1);
                expect(await brc404Contract.balanceOf(ownerAddress)).to.equal(reserved1);

                expect(await ethers.provider.getBalance(erc404Address)).to.equal(ethers.parseEther("10"));
            })
        })
    })
})