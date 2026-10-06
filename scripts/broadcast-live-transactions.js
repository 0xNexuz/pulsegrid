require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("node:fs");
const path = require("node:path");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function retry(fn, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`⚠️ Transient RPC error (${err.message}). Retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function main() {
  console.log("===============================================================");
  console.log("⚡ BROADCASTING REAL ONCHAIN TRANSACTIONS TO MONAD TESTNET");
  console.log("===============================================================");

  const deployed = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployed-contracts.json"), "utf8"));
  const rpcUrl = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer / Operator: ${wallet.address}`);
  console.log(`MON Balance:         ${ethers.formatEther(balance)} MON`);
  console.log(`ClearingHouse:       ${deployed.contracts.PulseGridClearing}`);
  console.log(`Explorer Link:       https://testnet.monadscan.com/address/${deployed.contracts.PulseGridClearing}\n`);

  const clearingArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "artifacts", "contracts", "PulseGridClearing.sol", "PulseGridClearing.json"), "utf8"));
  const clearing = new ethers.Contract(deployed.contracts.PulseGridClearing, clearingArtifact.abi, wallet);

  const agent1 = ethers.encodeBytes32String("AGENT_PULSE_01");
  const agent2 = ethers.encodeBytes32String("AGENT_PULSE_02");
  const agent3 = ethers.encodeBytes32String("AGENT_PULSE_03");
  const dex = deployed.contracts.MockDEX;

  console.log("1. Sending Real Onchain Action for Agent 1 (Arbitrage Prime)...");
  const tx1 = await retry(() => clearing.executeAction(agent1, dex, ethers.parseUnits("350", 6), "0x"));
  console.log(`   Tx Submitted! Hash: ${tx1.hash}`);
  const rc1 = await tx1.wait();
  console.log(`   ✓ Confirmed in Block #${rc1.blockNumber} (Gas Used: ${rc1.gasUsed.toString()})\n`);

  console.log("2. Sending Real Onchain Action for Agent 2 (Perp Hedger X)...");
  const tx2 = await retry(() => clearing.executeAction(agent2, dex, ethers.parseUnits("1200", 6), "0x"));
  console.log(`   Tx Submitted! Hash: ${tx2.hash}`);
  const rc2 = await tx2.wait();
  console.log(`   ✓ Confirmed in Block #${rc2.blockNumber} (Gas Used: ${rc2.gasUsed.toString()})\n`);

  console.log("3. Sending Real Onchain Action for Agent 3 (Micro Scalper Alpha)...");
  const tx3 = await retry(() => clearing.executeAction(agent3, dex, ethers.parseUnits("85", 6), "0x"));
  console.log(`   Tx Submitted! Hash: ${tx3.hash}`);
  const rc3 = await tx3.wait();
  console.log(`   ✓ Confirmed in Block #${rc3.blockNumber} (Gas Used: ${rc3.gasUsed.toString()})\n`);

  console.log("4. Sending Real Batch Clearing Execution (Parallel EVM Slot)...");
  const batchActions = [
    { agentId: agent1, target: dex, amount: ethers.parseUnits("150", 6), callData: "0x" },
    { agentId: agent2, target: dex, amount: ethers.parseUnits("400", 6), callData: "0x" }
  ];
  const tx4 = await retry(() => clearing.executeBatch(batchActions));
  console.log(`   Batch Tx Submitted! Hash: ${tx4.hash}`);
  const rc4 = await tx4.wait();
  console.log(`   ✓ Confirmed in Block #${rc4.blockNumber} (Gas Used: ${rc4.gasUsed.toString()})\n`);

  console.log("===============================================================");
  console.log("🎉 ALL REAL ONCHAIN TRANSACTIONS MINED ON MONAD TESTNET!");
  console.log("Check MonadScan now:");
  console.log(`https://testnet.monadscan.com/address/${deployed.contracts.PulseGridClearing}`);
  console.log("===============================================================");
}

main().catch(err => {
  console.error("Execution failed:", err);
  process.exit(1);
});
