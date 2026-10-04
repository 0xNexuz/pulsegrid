require("dotenv").config();
const { ethers } = require("ethers");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function main() {
  const rpcUrl = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
  const address = process.env.DEPLOYER_ADDRESS || "0x4203A9A0bF96d007939eBFD08b33c23AD7DE1683";

  console.log("==========================================");
  console.log("⚡ Monad Testnet Deployer Balance Monitor");
  console.log("==========================================");
  console.log(`Network:     Monad Testnet (Chain ID: 10143)`);
  console.log(`RPC URL:     ${rpcUrl}`);
  console.log(`Address:     ${address}`);
  console.log(`Explorer:    https://testnet.monadscan.com/address/${address}`);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const block = await provider.getBlockNumber();
  const balance = await provider.getBalance(address);

  console.log(`Current Block: ${block}`);
  console.log(`Balance:       ${ethers.formatEther(balance)} MON`);
  console.log("==========================================");

  if (balance > 0n) {
    console.log("✓ Account is funded! Ready for deployment.");
  } else {
    console.log("⏳ Awaiting funding from faucet: https://faucet.monad.xyz");
  }
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
