require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("node:fs");
const path = require("node:path");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function loadArtifact(relativePath) {
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", relativePath);
  return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
}

async function retry(fn, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`⚠️ Transient RPC error (${err.message}). Retrying in ${delay / 1000}s... [Attempt ${i + 2}/${retries}]`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function main() {
  console.log("==================================================");
  console.log("⚡ PULSEGRID MONAD TESTNET DEPLOYMENT ENGINE");
  console.log("==================================================");

  const rpcUrls = [
    process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz",
    "https://rpc-testnet.monadinfra.com",
    "https://rpc.ankr.com/monad_testnet"
  ];

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ Error: PRIVATE_KEY missing in .env");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrls[0]);
  const wallet = new ethers.Wallet(privateKey, provider);
  const balance = await retry(() => provider.getBalance(wallet.address));

  console.log(`Network:          Monad Testnet (Chain ID: 10143)`);
  console.log(`RPC URL:          ${rpcUrls[0]}`);
  console.log(`Deployer Address: ${wallet.address}`);
  console.log(`Current Balance:  ${ethers.formatEther(balance)} MON`);
  console.log("==================================================\n");

  // Load contract artifacts
  const registryArtifact = loadArtifact("PulseGridRegistry.sol/PulseGridRegistry.json");
  const firewallArtifact = loadArtifact("PulseGridFirewall.sol/PulseGridFirewall.json");
  const clearingArtifact = loadArtifact("PulseGridClearing.sol/PulseGridClearing.json");
  const usdcArtifact = loadArtifact("mocks/MockUSDC.sol/MockUSDC.json");
  const dexArtifact = loadArtifact("mocks/MockDEX.sol/MockDEX.json");

  // Check or Deploy PulseGridRegistry
  let registryAddress = "0x904A4757c3c165Eaee2BE1449bdA7c36EC9CE63a";
  const regCode = await retry(() => provider.getCode(registryAddress));
  let registry;
  if (regCode && regCode !== "0x") {
    console.log(`✓ [1/5] PulseGridRegistry already verified on Monad: ${registryAddress}`);
    registry = new ethers.Contract(registryAddress, registryArtifact.abi, wallet);
  } else {
    console.log("[1/5] Deploying PulseGridRegistry on Monad...");
    const RegistryFactory = new ethers.ContractFactory(registryArtifact.abi, registryArtifact.bytecode, wallet);
    registry = await retry(() => RegistryFactory.deploy());
    await registry.waitForDeployment();
    registryAddress = await registry.getAddress();
    console.log(`✓ PulseGridRegistry deployed at: ${registryAddress}`);
  }

  // Check or Deploy PulseGridFirewall
  let firewallAddress = "0x0003d9b81E576f2a732b96b7d476C74459e99091";
  const fwCode = await retry(() => provider.getCode(firewallAddress));
  let firewall;
  if (fwCode && fwCode !== "0x") {
    console.log(`✓ [2/5] PulseGridFirewall already verified on Monad: ${firewallAddress}`);
    firewall = new ethers.Contract(firewallAddress, firewallArtifact.abi, wallet);
  } else {
    console.log("[2/5] Deploying PulseGridFirewall on Monad...");
    const FirewallFactory = new ethers.ContractFactory(firewallArtifact.abi, firewallArtifact.bytecode, wallet);
    firewall = await retry(() => FirewallFactory.deploy(registryAddress));
    await firewall.waitForDeployment();
    firewallAddress = await firewall.getAddress();
    console.log(`✓ PulseGridFirewall deployed at: ${firewallAddress}`);
  }

  // Check or Deploy PulseGridClearing
  let clearingAddress = "0xF69164fEFE9f8ebD0757B3351F3d72cae8647f25";
  const clCode = await retry(() => provider.getCode(clearingAddress));
  let clearing;
  if (clCode && clCode !== "0x") {
    console.log(`✓ [3/5] PulseGridClearing already verified on Monad: ${clearingAddress}`);
    clearing = new ethers.Contract(clearingAddress, clearingArtifact.abi, wallet);
  } else {
    console.log("[3/5] Deploying PulseGridClearing on Monad...");
    const ClearingFactory = new ethers.ContractFactory(clearingArtifact.abi, clearingArtifact.bytecode, wallet);
    clearing = await retry(() => ClearingFactory.deploy(registryAddress, firewallAddress));
    await clearing.waitForDeployment();
    clearingAddress = await clearing.getAddress();
    console.log(`✓ PulseGridClearing deployed at: ${clearingAddress}`);
  }

  // Check or Deploy MockUSDC
  let usdcAddress = "0x3777D2Ce5cB782f3433a5042fAEBf524Ad29Aa52";
  const usdcCode = await retry(() => provider.getCode(usdcAddress));
  if (usdcCode && usdcCode !== "0x") {
    console.log(`✓ [4/5] MockUSDC already verified on Monad: ${usdcAddress}`);
  } else {
    console.log("[4/5] Deploying MockUSDC...");
    const UsdcFactory = new ethers.ContractFactory(usdcArtifact.abi, usdcArtifact.bytecode, wallet);
    const mockUSDC = await retry(() => UsdcFactory.deploy());
    await mockUSDC.waitForDeployment();
    usdcAddress = await mockUSDC.getAddress();
    console.log(`✓ MockUSDC deployed at: ${usdcAddress}`);
  }

  // Deploy MockDEX
  console.log("\n[5/5] Deploying MockDEX...");
  const DexFactory = new ethers.ContractFactory(dexArtifact.abi, dexArtifact.bytecode, wallet);
  const mockDEX = await retry(() => DexFactory.deploy(usdcAddress));
  await mockDEX.waitForDeployment();
  const dexAddress = await mockDEX.getAddress();
  console.log(`✓ MockDEX deployed at: ${dexAddress}`);

  // Configure Authorizations
  console.log("\n--- Configuring Protocol Permissions on Monad ---");
  const currentRegCH = await retry(() => registry.clearingHouse());
  if (currentRegCH.toLowerCase() !== clearingAddress.toLowerCase()) {
    console.log("Authorizing ClearingHouse on Registry...");
    const tx = await retry(() => registry.setClearingHouse(clearingAddress));
    await tx.wait();
    console.log("✓ ClearingHouse authorized on Registry");
  } else {
    console.log("✓ ClearingHouse already authorized on Registry");
  }

  const currentFwCH = await retry(() => firewall.clearingHouse());
  if (currentFwCH.toLowerCase() !== clearingAddress.toLowerCase()) {
    console.log("Authorizing ClearingHouse on Firewall...");
    const tx = await retry(() => firewall.setClearingHouse(clearingAddress));
    await tx.wait();
    console.log("✓ ClearingHouse authorized on Firewall");
  } else {
    console.log("✓ ClearingHouse already authorized on Firewall");
  }

  console.log(`Allowlisting MockDEX (${dexAddress}) on Firewall...`);
  const allowTx = await retry(() => firewall.setTargetAllowed(dexAddress, true));
  await allowTx.wait();
  console.log(`✓ MockDEX allowlisted on Firewall`);

  // Seed Sample Autonomous Agent Fleet
  console.log("\n--- Registering Autonomous AI Agent Fleet on Monad ---");
  const agents = [
    { id: ethers.encodeBytes32String("AGENT_PULSE_01"), name: "Arbitrage Prime", tier: 2 },
    { id: ethers.encodeBytes32String("AGENT_PULSE_02"), name: "Perp Hedger X", tier: 3 },
    { id: ethers.encodeBytes32String("AGENT_PULSE_03"), name: "Micro Scalper Alpha", tier: 1 }
  ];

  for (const ag of agents) {
    try {
      const existing = await retry(() => registry.agents(ag.id));
      if (existing && existing.registeredAt > 0n) {
        console.log(`✓ Agent ${ag.name} already registered on Monad`);
        continue;
      }
      const regTx = await retry(() => registry.registerAgent(ag.id, ag.name, wallet.address, wallet.address, ag.tier));
      await regTx.wait();
      console.log(`✓ Registered Agent: ${ag.name} (Tier ${ag.tier})`);
    } catch (e) {
      console.log(`⚠️ Agent registration check for ${ag.name}: ${e.message}`);
    }
  }

  const deploymentData = {
    network: "monadTestnet",
    chainId: 10143,
    deployedAt: new Date().toISOString(),
    deployer: wallet.address,
    explorer: "https://testnet.monadscan.com",
    contracts: {
      PulseGridRegistry: registryAddress,
      PulseGridFirewall: firewallAddress,
      PulseGridClearing: clearingAddress,
      MockUSDC: usdcAddress,
      MockDEX: dexAddress
    }
  };

  const outputPath = path.join(__dirname, "..", "deployed-contracts.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));

  console.log("\n==================================================");
  console.log("🎉 ALL PULSEGRID CONTRACTS DEPLOYED & CONFIGURED ON MONAD TESTNET!");
  console.log("==================================================");
  console.log("Registry:      ", registryAddress);
  console.log("Firewall:      ", firewallAddress);
  console.log("ClearingHouse: ", clearingAddress);
  console.log("MockDEX:       ", dexAddress);
  console.log("MockUSDC:      ", usdcAddress);
  console.log("Explorer URL:   https://testnet.monadscan.com/address/" + clearingAddress);
  console.log("Saved to:       deployed-contracts.json");
  console.log("==================================================");
}

main().catch(err => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
