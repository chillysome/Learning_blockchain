const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config") // 引入网络配置和开发链的配置
const { verify } = require("../utils/verify") // 引入 verify 工具，用于验证合约
require("dotenv").config() // 加载环境变量

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let ethUsdPriceFeedAddress

    if (chainId == 31337) {
        const ethUsdAggrgator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggrgator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"] // 从网络配置中获取对应网络的价格预言机地址
    }

    log("----------------------------------------------------")
    log("Deploying FundMe and waiting for confirmations...")
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1, // 等待区块确认数，默认值为 1
    })
    log(`FundMe deployed at ${fundMe.address}`) // 打印 FundMe 部署完成的地址

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, [ethUsdPriceFeedAddress])
    }
}

module.exports.tags = ["all", "fundme"] // 为该模块添加标签，方便部署时根据标签过滤
