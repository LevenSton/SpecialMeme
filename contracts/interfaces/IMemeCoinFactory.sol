// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import {DataTypes} from "../libraries/DataTypes.sol";

interface IMemeCoinFactory {
    function parameters()
        external
        view
        returns (DataTypes.CreateMemeCoinParameters memory);

    function _memeCoinContract(
        address creator,
        string calldata name
    ) external view returns (address);

    function _memeCoinManager() external view returns (address);
}
