
import { expect } from 'chai';
import {
    makeSuiteCleanRoom,
    user,
    userAddress,
    owner,
    memeCoinFactory,
    ownerAddress,
    userTwoAddress,
    memeCoinManagerAddr,
} from '../__setup.spec';
import { MemeCoin__factory } from '../../typechain-types';
import { ethers } from 'hardhat';
import { ERRORS } from '../helpers/errors';
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

makeSuiteCleanRoom('Mint ERC404', function () {

    const mintPrice = ethers.parseEther("0.01");
    const sqrtPriceX96 = encodePriceSqrt(ethers.parseEther("0.01"), ethers.parseEther("1"));
    const sqrtPriceB96 = encodePriceSqrt(ethers.parseEther("1"), ethers.parseEther("0.01"));
    let erc404Address: string
    let totalSupply = 10000
    let reserved0 = 0
    let reserved1 = 1000
    let maxPerWallet = 100
    let units = 1
    let price0 = 0
    let price1 = ethers.parseEther("0.2")
    let name = "memecoin"
    let symbol = "memecoin"
    const tomorrow = parseInt((new Date().getTime() / 1000 ).toFixed(0)) + 24 * 3600

    context('Generic', function () {
        beforeEach(async function () {
            
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
            ).to.be.not.reverted;
            erc404Address = await memeCoinFactory.connect(owner)._memeCoinContract(ownerAddress, name);

            let brc404Contract = MemeCoin__factory.connect(erc404Address, user);
            expect(await brc404Contract.balanceOf(memeCoinManagerAddr)).to.equal(totalSupply - reserved1);
        });

        context('Negatives', function () {
            it('Mint failed if mint amount is 0.',   async function () {
                let brc404Contract = MemeCoin__factory.connect(erc404Address, user);
                await expect(brc404Contract.mint(0)).to.be.revertedWithCustomError(brc404Contract, ERRORS.InvaildParam)
            });
            it('Mint failed if msg.valur less than you need to pay.',   async function () {
                let brc404Contract = MemeCoin__factory.connect(erc404Address, user);
                await expect(brc404Contract.mint(2, {
                    value: ethers.parseEther("0.01")
                })).to.be.revertedWithCustomError(brc404Contract, ERRORS.InvaildParam)
            });
            it('Mint failed if mint amount ReachMaxPerMint.',   async function () {
                
                let brc404Contract = MemeCoin__factory.connect(erc404Address, user);
                await expect(brc404Contract.mint(201, {
                    value: ethers.parseEther("200")
                })).to.be.revertedWithCustomError(brc404Contract, ERRORS.ReachMaxPerMint)
            });
        })

        context('Scenarios', function () {
            it('Get correct variable if mint Tomo-emoji success.',   async function () {
                let brc404Contract = MemeCoin__factory.connect(erc404Address, user);
                await expect(brc404Contract.mint(2, {
                    value: ethers.parseEther("0.4")
                })).to.not.be.reverted;

                expect( await brc404Contract.balanceOf(userAddress)).to.equal(2);
                await expect(brc404Contract.transfer(userTwoAddress, 
                    ethers.parseEther("0.4")
                )).to.be.revertedWithCustomError(brc404Contract, ERRORS.TradingNotEnable)
            });
        })
    })
})