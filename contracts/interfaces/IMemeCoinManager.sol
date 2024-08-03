// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import {DataTypes} from "../libraries/DataTypes.sol";

interface IMemeCoinManager {
    function getSwapRouter() external view returns (address, address);

    function prePairMemeCoinEnv(
        address memeCoinAddr,
        uint160 sqrtPriceX96,
        uint160 sqrtPriceB96
    ) external returns (address);

    function addLiquidityForMemeCoin(
        address memeCoinAddr,
        uint256 tokenAmount
    ) external payable returns (bool);

    function removeLiquidityForEmergece(
        uint256 tokenId,
        uint128 liquidity,
        address receiptAddress
    ) external payable returns (bool);

    function getCreatMemeCoinParam()
        external
        view
        returns (bool, uint256, uint256);
}
