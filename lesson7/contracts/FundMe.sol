// SPDX-License-Identifier:MIT
// 1. Pragma
pragma solidity ^0.8.7;

// 2. Imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol"; // 导入Chainlink的价格聚合器接口
import "./PriceConverter.sol"; // 导入自定义的价格转换库

// 3. Error
error FundMe__NotOwner();

// 4 Contracts

contract FundMe {
    using PriceConverter for uint256; // 使用PriceConverter库中的函数处理uint256类型

    uint256 public constant MINIMUM_USD = 50 * 10 ** 18; // 设置最小捐款金额为50美元
    address private immutable i_owner;
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    AggregatorV3Interface private s_priceFeed; // 链接到Chainlink价格聚合器的接口

    modifier onlyOwner() {
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    constructor(address priceFeed) {
        s_priceFeed = AggregatorV3Interface(priceFeed); // 初始化价格聚合器接口
        i_owner = msg.sender;
    }

    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD, //getConversionRate第一个参数是msg.value,第二个参数是s_priceFeed
            "You need to spend more ETH!" // 检查捐款金额是否至少达到最低USD要求
        );
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    function cheaperWithdraw() public onlyOwner {
        address[] memory funders = s_funders;
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    function getAddressToAmountFunded(
        address fundingAddress
    ) public view returns (uint256) {
        // 返回某个地址的捐款金额
        return s_addressToAmountFunded[fundingAddress];
    }

    function getVersion() public view returns (uint256) {
        // 返回Chainlink价格聚合器的版本号
        return s_priceFeed.version();
    }

    function getFunder(uint256 index) public view returns (address) {
        // 根据索引返回某个捐款者的地址
        return s_funders[index];
    }

    function getOwner() public view returns (address) {
        // 返回合约所有者的地址
        return i_owner;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        // 返回当前使用的价格聚合器接口
        return s_priceFeed;
    }
}
