require("dotenv").config()
require("hardhat-gas-reporter")
require("@nomiclabs/hardhat-waffle")
require("solidity-coverage")
require("hardhat-deploy")

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "hardhat",
    network: {
        hardhat: {
            chainId: 31337,
        },
        sepolia: {
            url: SEPOLIA_RPC_URL,
            account: [PRIVATE_KEY],
            chainId: 11155111,
            blockConfirmations: 6,
        },
        gasReporter: {
            enabled: true,
            currency: "USD",
            outputFile: "gas-report.txt",
            noColors: false,
            //coinmarketcap: COINMARKETCAP_API_KEY,
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.27",
            },
            {
                version: "0.8.7",
            },
            {
                version: "0.6.6",
            },
        ],
    },
    namedAccounts: {
        deployer: {
            default: 0,
            1: 0,
        },
    },
    mocha: {
        timeout: 500000,
    },
}
