// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PriceCalculator} from "./libraries/PriceCalculator.sol";
import {DataTypes} from "./libraries/DataTypes.sol";
import {MemeCoin} from "./MemeCoin.sol";
import {IMemeCoinManager} from "./interfaces/IMemeCoinManager.sol";

contract MemeCoinFactory is OwnableUpgradeable {
    error InvaildParam();
    error ReservedTooMuch();
    error PreSaleDeadLineTooFar();
    error ContractAlreadyExist();
    error ZeroAddress();
    error CantCreateMemeCoin();
    error MaxPerWalletTooMuch();
    error MsgValueNotEnough();
    error SendETHFailed();

    event MemeCoinCreated(
        address indexed addr,
        address indexed creator,
        uint256 totalSupply,
        uint256 reserved,
        uint256 maxPerWallet,
        uint256 price,
        uint256 preSaleDeadLine,
        string name,
        string symbol
    );

    mapping(address => mapping(string => address)) public _memeCoinContract;
    DataTypes.CreateMemeCoinParameters private _parameters;
    address public _memeCoinManager;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address owner,
        address memeCoinManager
    ) public initializer {
        if (owner == address(0) || memeCoinManager == address(0)) {
            revert ZeroAddress();
        }
        __Ownable_init(owner);

        _memeCoinManager = memeCoinManager;
    }

    function createMemeCoin(
        DataTypes.CreateMemeCoinParameters calldata vars
    ) external payable returns (address memeCoin) {
        _checkParam(vars);

        _parameters = vars;
        uint256 price;
        if (vars.reserved > 0) {
            price = vars.reserved * vars.price;
            if (msg.value < price) {
                revert MsgValueNotEnough();
            }
        }
        if (msg.value > price) {
            (bool success, ) = payable(msg.sender).call{
                value: msg.value - price
            }("");
            if (!success) {
                revert SendETHFailed();
            }
        }
        memeCoin = address(
            new MemeCoin{
                salt: keccak256(
                    abi.encode(vars.name, vars.symbol, vars.creator)
                ),
                value: price
            }()
        );
        _memeCoinContract[vars.creator][vars.name] = memeCoin;
        IMemeCoinManager(_memeCoinManager).prePairMemeCoinEnv(
            memeCoin,
            vars.sqrtPriceX96,
            vars.sqrtPriceB96
        );
        delete _parameters;

        _emitCreateMemeCoinEvent(memeCoin, vars);
    }

    function setMemeCoinManager(address newAddr) public onlyOwner {
        if (newAddr == address(0)) {
            revert ZeroAddress();
        }
        _memeCoinManager = newAddr;
    }

    function parameters()
        external
        view
        returns (DataTypes.CreateMemeCoinParameters memory)
    {
        return _parameters;
    }

    function _checkParam(
        DataTypes.CreateMemeCoinParameters calldata vars
    ) internal view {
        (
            bool _canCreateMemeCoin,
            uint256 _maxPurchasePercentageForCreator,
            uint256 _maxPreSaleTime
        ) = IMemeCoinManager(_memeCoinManager).getCreatMemeCoinParam();

        if (!_canCreateMemeCoin) {
            revert CantCreateMemeCoin();
        }
        if (
            msg.sender != vars.creator ||
            vars.maxPerWallet == 0 ||
            vars.totalSupply == 0
        ) {
            revert InvaildParam();
        }
        if (
            vars.reserved >
            (vars.totalSupply * _maxPurchasePercentageForCreator) / 10000
        ) {
            revert ReservedTooMuch();
        }
        if (vars.maxPerWallet > (vars.totalSupply * 1) / 100) {
            revert MaxPerWalletTooMuch();
        }
        if (vars.preSaleDeadLine > block.timestamp + _maxPreSaleTime) {
            revert PreSaleDeadLineTooFar();
        }
        if (_memeCoinContract[vars.creator][vars.name] != address(0x0)) {
            revert ContractAlreadyExist();
        }

        uint256 mintPrice = PriceCalculator.getPrice(vars.sqrtPriceX96);
        uint256 x = vars.price > mintPrice
            ? vars.price - mintPrice
            : mintPrice - vars.price;
        if (x > 5) {
            revert InvaildParam();
        }

        uint256 mintPriceEth = PriceCalculator.getPrice(vars.sqrtPriceB96);
        uint256 priceEth = 10 ** 36 / vars.price;
        uint256 y = priceEth > mintPriceEth
            ? priceEth - mintPriceEth
            : mintPriceEth - priceEth;
        if (y > 5) {
            revert InvaildParam();
        }
    }

    function _emitCreateMemeCoinEvent(
        address memeCoin,
        DataTypes.CreateMemeCoinParameters calldata vars
    ) internal {
        emit MemeCoinCreated(
            memeCoin,
            vars.creator,
            vars.totalSupply,
            vars.reserved,
            vars.maxPerWallet,
            vars.price,
            vars.preSaleDeadLine,
            vars.name,
            vars.symbol
        );
    }
}
