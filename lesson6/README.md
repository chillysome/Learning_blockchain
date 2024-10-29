## 概述

**Hardhat是一个编译、部署、测试和调试以太坊应用的开发环境。它可以帮助开发人员管理和自动化构建智能合约和dApps过程中固有的重复性任务，并围绕这一工作流程轻松引入更多功能。这意味着hardhat在最核心的地方是编译、运行和测试智能合约。**

Hardhat内置了Hardhat网络，这是一个专为开发设计的本地以太坊网络。主要功能有Solidity调试，跟踪调用堆栈、`console.log()`和交易失败时的明确错误信息提示等。

Hardhat Runner是与Hardhat交互的CLI命令，是一个可扩展的任务运行器。它是围绕**任务**和**插件**的概念设计的。每次你从CLI运行Hardhat时，你都在运行一个任务。例如，`npx hardhat compile`运行的是内置的`compile`任务。任务可以调用其他任务，允许定义复杂的工作流程。用户和插件可以覆盖现有的任务，从而定制和扩展工作流程。

Hardhat的很多功能都来自于插件，而作为开发者，你可以自由选择想使用的插件。Hardhat不限制使用什么工具的，但它确实有一些内置的默认值。所有这些都可以覆盖。

### 安装

Hardhat是通过本地安装在项目中使用的。这样你的环境就可以重现，也可以避免未来的版本冲突。

要安装它，你需要创建一个npm项目，进入一个空文件夹，运行`npm init`。 并遵循其指示操作。项目初始化之后，运行：

```text
npm install --save-dev hardhat
```

### 部署环境

`yarn init`

`yarn add --dev hardhat`

`yarn hardhat`

默认配置即可。

`yarn add --dev prettier prettier-plugin-solidity`

`const { ethers } = require("hardhat")`

hardhat包中内置了ethers，允许在不同脚本和其他情况下追踪不同的部署。

而且毕竟是hardhat框架，使用普通的ethers并不能知道该框架下所有文件夹的含义

```json
{
    "name": "lesson6",
    "version": "1.0.0",
    "main": "index.js",
    "license": "MIT",
    "devDependencies": {
        "@nomicfoundation/hardhat-chai-matchers": "^2.0.0",
        "@nomicfoundation/hardhat-ethers": "^3.0.0",
        "@nomicfoundation/hardhat-ignition": "^0.15.0",
        "@nomicfoundation/hardhat-ignition-ethers": "^0.15.0",
        "@nomicfoundation/hardhat-network-helpers": "^1.0.0",
        "@nomicfoundation/hardhat-toolbox": "^5.0.0",
        "@nomicfoundation/hardhat-verify": "^2.0.0",
        "@typechain/ethers-v6": "^0.5.0",
        "@typechain/hardhat": "^9.0.0",
        "chai": "^4.2.0",
        "ethers": "^6.4.0",
        "hardhat": "^2.22.15",
        "hardhat-gas-reporter": "^1.0.8",
        "prettier": "^3.3.3",
        "prettier-plugin-solidity": "^1.4.1",
        "solidity-coverage": "^0.8.0",
        "typechain": "^8.3.0"
    }
}

```

### 运行

`yarn hardhat run scripts/deploy.js`

`yarn hardhat run scripts/deploy.js --network hardhat`

### 添加其他网络

```json
require("dotenv").config()
// ...
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
// ...
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {},
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
        }
    }
}
```

同时我们需要添加.env文件，省流。

我们在词就可以部署到测试网上了

### 编程方式验证合约 @nomicfoundation/hardhat-verify

需要用到etherscan的apikey

![image-20241027102958215](assets/image-20241027102958215.png)

```json
//hardhat.config.js    
etherscan: {
    apiKey: ETHERSCAN_API_KEY,
},
```

当我们运行yarn hardhat的时候，它会去检查`hardhat.config.js`中所有的插件，如果有新插件的话，它会将其作为新的任务添加进来以便我们能够使用。

<img src="assets/image-20241027103524555.png" alt="image-20241027103524555" style="zoom: 50%;" />

我们使用hardhat所有任务需要用到`run`包。

```json
const { ethers, run } = require("hardhat")
```

至此，我们可以添加verify函数

```json
const verify = async (contractAddress, args) => {
    console.log("Verifying contract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already Verified!")
        } else {
            console.log(e)
        }
    }
}
```

如果我们在本地hardhat网络上，那我们不需要verify

```json
// main  
const { ethers, run, network } = require("hardhat")
// ...
if (network.config.chainId === 11155111 && process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations...")
    await simpleStorage.deploymentTransaction().wait(6)
    await verify(simpleStorage.target, [])
  }
```



### 与合约交互

```json
const currentValue = await simpleStorage.retrieve()
console.log(`Current Value is: ${currentValue}`)

// Update the current value
const transactionResponse = await simpleStorage.store(7)
await transactionResponse.wait(1)
const updatedValue = await simpleStorage.retrieve()
console.log(`Updated Value is: ${updatedValue}`)
```

### 添加插件

```c++
// ./tasks/block-number.js
const { task } = require("hardhat/config")

task("block-number", "Prints the current block number").setAction(
  // const blockTask = async function() => {}
  // async function blockTask() {}
  async (taskArgs, hre) => {
    const blockNumber = await hre.ethers.provider.getBlockNumber()
    console.log(`Current block number: ${blockNumber}`)
  }
)

module.exports = {}

```

将插件添加到hardhat.config.js，每次hardhat运行都会检查hardhat.config.js的配置并加载其中的插件

```json
// hardhat.config.js
require("./tasks/block-number")
```

使用以下命令即可

`yarn hardhat block-number --network sepolia`

### 运行hardhat网络

因此以上代码运行的时候hardhat网络会随程序的结束而结束，从而没有办法与合约交互，所以我们需要一个持续性的类似Ganache Network那样的Hardhat Network

`yarn hardhat node`

这条命令会在本地运行一个网络，运行在我们的终端里。

我们用一个新的终端使用此命令，让其网络一直在运行，然后在本终端中与合约交互。

```c++
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {},
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
        },
        // 添加如下
        localhost: {
            url: "http://localhost:8545",
            chainId: 31337,
        },
    }
}
```

我们需要配置一下hardhat网络作为本地网络

`yarn hardhat run scripts/deploy.js --network localhost`

### 测试

`yarn hardhat test`

```json
// /test/test-deploy.js
const { ethers } = require("hardhat")
const { expect, assert } = require("chai")

// describe("SimpleStorage", () => {})
describe("SimpleStorage", function () {
  // let simpleStorageFactory
  // let simpleStorage
  let simpleStorageFactory, simpleStorage
  beforeEach(async function () {
    simpleStorageFactory = await ethers.getContractFactory("SimpleStorage")
    simpleStorage = await simpleStorageFactory.deploy()
  })

  it("Should start with a favorite number of 0", async function () {
    const currentValue = await simpleStorage.retrieve()
    const expectedValue = "0"
    // assert
    // expect
    assert.equal(currentValue.toString(), expectedValue)
    // expect(currentValue.toString()).to.equal(expectedValue)
  })
  it("Should update when we call store", async function () {
    const expectedValue = "7"
    const transactionResponse = await simpleStorage.store(expectedValue)
    await transactionResponse.wait(1)

    const currentValue = await simpleStorage.retrieve()
    assert.equal(currentValue.toString(), expectedValue)
  })

  // Extra - this is not in the video
  it("Should work correctly with the people struct and array", async function () {
    const expectedPersonName = "Patrick"
    const expectedFavoriteNumber = "16"
    const transactionResponse = await simpleStorage.addPerson(
      expectedPersonName,
      expectedFavoriteNumber
    )
    await transactionResponse.wait(1)
    const { favoriteNumber, name } = await simpleStorage.people(0)
    // We could also do it like this
    // const person = await simpleStorage.people(0)
    // const favNumber = person.favoriteNumber
    // const pName = person.name

    assert.equal(name, expectedPersonName)
    assert.equal(favoriteNumber, expectedFavoriteNumber)
  })
})

```

### gas-report

`yarn add --dev hardhat-gas-reporter`

`require("hardhat-gas-reporter")`

```json
// hardhat.config.js    
gasReporter: {
    enabled: true,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    // coinmarketcap: COINMARKETCAP_API_KEY,
},
```

![image-20241027162043593](assets/image-20241027162043593.png)

### solidity-coverage

`yarn add --dev solidity-coverage`

### hardhat-waffle

[Ethereum Waffle](https://ethereum-waffle.readthedocs.io/en/latest/index.html) 是以太坊智能合约的轻量级测试运行器。 Waffle内置了一些非常不错的测试工具函数，例如用于以太坊地址，哈希和BigNumbers的Chai匹配器，Waffle使用原生Typescript，与Ethers.js配合非常好。