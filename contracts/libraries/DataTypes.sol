// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

/**
 * @title DataTypes
 * @author Leven
 *
 * @notice A standard library of data types used throughout the XRGB.
 */
library DataTypes {
    struct CreateMemeCoinParameters {
        address creator;
        uint256 totalSupply;
        uint256 reserved;
        uint256 maxPerWallet;
        uint256 price;
        uint256 preSaleDeadLine;
        uint160 sqrtPriceX96;
        uint160 sqrtPriceB96;
        string name;
        string symbol;
    }

    struct SwapRouter {
        address routerAddr;
        address uniswapV3NonfungiblePositionManager;
    }
}
