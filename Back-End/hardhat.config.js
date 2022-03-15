require("@nomiclabs/hardhat-waffle");
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
  solidity: "0.8.4",
  networks: {
    //Moonbase Alpha network 
    moonbase: {
      url: 'https://rpc.testnet.moonbeam.network',
      chainId: 1287, 
      accounts: ["a6d5460cdb06a99dc098858ad58364fdaa7cf7a47989c0bca8784eb0abbde933"]
    }
  }
};

