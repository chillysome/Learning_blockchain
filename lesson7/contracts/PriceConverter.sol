// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

// 导入 Chainlink 的价格聚合器接口
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    // 获取 ETH/USD 的最新价格
    function getPrice(
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        // 调用 Chainlink 聚合器的 latestRoundData 函数获取最新的价格数据
        (, int256 answer, , , ) = priceFeed.latestRoundData();
        // 将价格调整为18位小数，ETH/USD 汇率返回值带有8位小数
        return uint256(answer * 10000000000); // 将答案转换为 uint256 类型并乘以 10^10
    }

    // 获取 ETH 金额转换为 USD 的汇率
    // 调用时根据特定聚合器的返回数据，这里假设聚合器返回 ETH/USD 的汇率，含18位小数
    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed); // 获取 ETH 的价格
        // 将 ETH 金额转换为 USD，结果包含18位小数，因此需进行除法运算来校正精度
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1000000000000000000;
        // 返回实际的 ETH/USD 转换率，已调整额外的零
        return ethAmountInUsd;
    }
}
