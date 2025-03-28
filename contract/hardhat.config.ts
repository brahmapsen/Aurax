import * as dotenv from 'dotenv';
dotenv.config();

import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-deploy';

import { HardhatUserConfig } from 'hardhat/config';

// If not set, it uses the hardhat account 0 private key.
const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY ?? '';
// If not set, it uses ours Etherscan default API key.
const etherscanApiKey = process.env.ETHERSCAN_API_KEY || '';
// forking rpc url
const forkingURL = process.env.FORKING_URL || '';

const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL || '';

const BaseSepoliaRpcUrl = process.env.BASE_SEPOLIA_RPC_URL || '';

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.7.6',
      },
      {
        version: '0.8.20',
        settings: {
          optimizer: {
            enabled: true,
            // https://docs.soliditylang.org/en/latest/using-the-compiler.html#optimizer-options
            runs: 200,
          },
        },
      },
    ],
  },
  defaultNetwork: 'hardhat',
  namedAccounts: {
    deployer: {
      // By default, it will take the first Hardhat account as the deployer
      default: 0,
    },
  },
  networks: {
    // View the networks that are pre-configured.
    // If the network you are looking for is not here you can add new network settings
    hardhat: {
      chainId: 31337,
      // forking: {
      //   url: forkingURL,
      //   enabled: process.env.MAINNET_FORKING_ENABLED === 'true',
      //   blockNumber: 22082312,
      // },
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 5,
        accountsBalance: "10000000000000000000000",
      },
    },
    sepolia: {
      url: sepoliaRpcUrl,
      accounts: [deployerPrivateKey],
    },
    base: {
      url: 'https://mainnet.base.org',
      chainId: 8453,
      accounts: [deployerPrivateKey],
    },
    baseSepolia: {
      url: BaseSepoliaRpcUrl,
      accounts: [deployerPrivateKey],
    },
  },
  // configuration for harhdat-verify plugin
  etherscan: {
    apiKey: `${etherscanApiKey}`,
  },
  // configuration for etherscan-verify from hardhat-deploy plugin
  verify: {
    etherscan: {
      apiKey: `${etherscanApiKey}`,
    },
  },
  sourcify: {
    enabled: false,
  },
};

export default config;
