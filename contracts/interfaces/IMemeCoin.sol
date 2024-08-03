// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IMemeCoin {
    function balanceOf(address owner_) external view returns (uint256);

    function creator() external view returns (address);

    function mintPrice() external view returns (uint256);
}
