const { assert, expect } = require("chai") // 引入 Chai 库中的 assert 和 expect 方法用于断言
const { network, deployments, ethers } = require("hardhat") // 引入 Hardhat 中的 network, deployments 和 ethers
const { developmentChains } = require("../../helper-hardhat-config") // 从配置文件引入 developmentChains 数组

// 判断当前网络是否在 developmentChains 中，如果不在，则跳过测试
!developmentChains.includes(network.name)
    ? describe.skip // 如果网络不是开发链，跳过测试
    : describe("FundMe", function () {
          // 如果是开发链，则执行测试
          let fundMe // 定义变量 fundMe 用于存储合约实例
          let mockV3Aggregator // 定义变量 mockV3Aggregator 用于存储 Mock Aggregator 合约实例
          let deployer // 定义变量 deployer 用于存储部署者地址
          const sendValue = ethers.utils.parseEther("1") // 定义常量 sendValue，将 1 ETH 转换为 Wei

          beforeEach(async () => {
              // const accounts = await ethers.getSigners()
              // deployer = accounts[0] // 获取部署者地址，可以使用 getSigners 方法
              deployer = (await getNamedAccounts()).deployer // 从已命名的账户中获取部署者
              await deployments.fixture(["all"]) // 部署所有带有 "all" 标签的合约
              fundMe = await ethers.getContract("FundMe", deployer) // 获取已部署的 FundMe 合约实例
              mockV3Aggregator = await ethers.getContract(
                  // 获取 MockV3Aggregator 合约实例
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", function () {
              // 测试合约构造函数
              it("sets the aggregator addresses correctly", async () => {
                  // 测试价格聚合器地址是否设置正确
                  const response = await fundMe.getPriceFeed() // 调用合约的 getPriceFeed 方法获取价格聚合器地址
                  assert.equal(response, mockV3Aggregator.address) // 断言返回的地址与 mockV3Aggregator 的地址一致
              })
          })

          describe("fund", function () {
              // 测试 fund 函数
              it("Fails if you don't send enough ETH", async () => {
                  // 测试如果发送的 ETH 不足时，交易会失败
                  await expect(fundMe.fund()).to.be.revertedWith(
                      // 如果没有发送足够的 ETH，期望交易回滚
                      "You need to spend more ETH!" // 错误信息提示需要发送更多 ETH
                  )
              })

              it("Updates the amount funded data structure", async () => {
                  // 测试资助数据结构的更新
                  await fundMe.fund({ value: sendValue }) // 调用 fund 方法并发送 sendValue
                  const response = await fundMe.getAddressToAmountFunded(
                      // 获取资助金额
                      deployer // 使用部署者地址作为参数
                  )
                  assert.equal(response.toString(), sendValue.toString()) // 断言资助金额与发送的值相等
              })

              it("Adds funder to array of funders", async () => {
                  // 测试将资助者添加到资助者数组
                  await fundMe.fund({ value: sendValue }) // 调用 fund 方法并发送 sendValue
                  const response = await fundMe.getFunder(0) // 获取资助者数组中的第一个资助者
                  assert.equal(response, deployer) // 断言资助者为部署者地址
              })
          })

          describe("withdraw", function () {
              // 测试 withdraw 函数
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue }) // 每次测试之前，调用 fund 方法发送 ETH
              })

              it("withdraws ETH from a single funder", async () => {
                  // 测试从单个资助者处提款
                  // 准备
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address) // 获取合约初始余额
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) // 获取部署者初始余额

                  // 执行提款操作
                  const transactionResponse = await fundMe.withdraw() // 调用 withdraw 方法
                  const transactionReceipt = await transactionResponse.wait() // 等待交易确认
                  const { gasUsed, effectiveGasPrice } = transactionReceipt // 获取使用的 gas 和有效的 gas 价格
                  const gasCost = gasUsed.mul(effectiveGasPrice) // 计算 gas 成本

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  ) // 获取合约的最终余额
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) // 获取部署者的最终余额

                  // 断言
                  assert.equal(endingFundMeBalance, 0) // 断言合约余额为 0
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString() // 断言资金总和没有变化，只扣除了 gas 成本
                  )
              })

              it("is allows us to withdraw with multiple funders", async () => {
                  // 测试从多个资助者处提款
                  // 准备
                  const accounts = await ethers.getSigners() // 获取所有账户
                  for (i = 1; i < 6; i++) {
                      // 使用多个账户进行资助
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      ) // 连接不同的账户
                      await fundMeConnectedContract.fund({ value: sendValue }) // 调用 fund 方法进行资助
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address) // 获取合约初始余额
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) // 获取部署者初始余额

                  // 执行提款操作
                  const transactionResponse = await fundMe.cheaperWithdraw() // 使用更省 gas 的提款方法
                  const transactionReceipt = await transactionResponse.wait() // 等待交易确认
                  const { gasUsed, effectiveGasPrice } = transactionReceipt // 获取使用的 gas 和有效的 gas 价格
                  const withdrawGasCost = gasUsed.mul(effectiveGasPrice) // 计算提款时的 gas 成本
                  console.log(`GasCost: ${withdrawGasCost}`) // 输出 gas 成本
                  console.log(`GasUsed: ${gasUsed}`) // 输出使用的 gas 量
                  console.log(`GasPrice: ${effectiveGasPrice}`) // 输出 gas 价格
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  ) // 获取合约的最终余额
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) // 获取部署者的最终余额

                  // 断言
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(withdrawGasCost).toString() // 断言资金总和没有变化，只扣除了 gas 成本
                  )
                  // 确保资助者数组清空
                  await expect(fundMe.getFunder(0)).to.be.reverted // 断言获取资助者时回滚

                  for (i = 1; i < 6; i++) {
                      // 断言每个资助者的资助金额为 0
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("Only allows the owner to withdraw", async function () {
                  // 测试只有合约所有者可以提款
                  const accounts = await ethers.getSigners() // 获取所有账户
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1]
                  ) // 使用非所有者账户连接合约
                  await expect(
                      fundMeConnectedContract.withdraw() // 尝试提款
                  ).to.be.revertedWith("FundMe__NotOwner") // 断言交易回滚，提示不是合约所有者
              })
          })
      })
