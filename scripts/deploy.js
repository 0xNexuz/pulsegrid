const hre = require("hardhat");

async function main() {
  console.log("=== PulseGrid Deployment Sequence ===");
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  console.log(`Network: ${hre.network.name} (Chain ID: ${hre.network.config.chainId || "local"})`);

  // 1. Deploy PulseGridRegistry
  console.log("\n[1/5] Deploying PulseGridRegistry...");
  const Registry = await hre.ethers.getContractFactory("PulseGridRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`✓ PulseGridRegistry deployed at: ${registryAddress}`);

  // 2. Deploy PulseGridFirewall
  console.log("\n[2/5] Deploying PulseGridFirewall...");
  const Firewall = await hre.ethers.getContractFactory("PulseGridFirewall");
  const firewall = await Firewall.deploy(registryAddress);
  await firewall.waitForDeployment();
  const firewallAddress = await firewall.getAddress();
  console.log(`✓ PulseGridFirewall deployed at: ${firewallAddress}`);

  // 3. Deploy PulseGridClearing
  console.log("\n[3/5] Deploying PulseGridClearing...");
  const Clearing = await hre.ethers.getContractFactory("PulseGridClearing");
  const clearing = await Clearing.deploy(registryAddress, firewallAddress);
  await clearing.waitForDeployment();
  const clearingAddress = await clearing.getAddress();
  console.log(`✓ PulseGridClearing deployed at: ${clearingAddress}`);

  // 4. Deploy MockUSDC & MockDEX for testing/demo
  console.log("\n[4/5] Deploying Mock Liquidity Infrastructure (MockUSDC & MockDEX)...");
  const USDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUSDC = await USDC.deploy();
  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log(`✓ MockUSDC deployed at: ${usdcAddress}`);

  const DEX = await hre.ethers.getContractFactory("MockDEX");
  const mockDEX = await DEX.deploy(usdcAddress);
  await mockDEX.waitForDeployment();
  const dexAddress = await mockDEX.getAddress();
  console.log(`✓ MockDEX deployed at: ${dexAddress}`);

  // 5. Configure Authorizations
  console.log("\n[5/5] Wiring Permissions & Allowlisted Protocols...");
  let tx = await registry.setClearingHouse(clearingAddress);
  await tx.wait();
  console.log("✓ ClearingHouse authorized on Registry");

  tx = await firewall.setClearingHouse(clearingAddress);
  await tx.wait();
  console.log("✓ ClearingHouse authorized on Firewall");

  tx = await firewall.setTargetAllowed(dexAddress, true);
  await tx.wait();
  console.log(`✓ MockDEX (${dexAddress}) added to Firewall allowlist`);

  // Seed initial sample agents
  console.log("\n--- Seeding Initial Agent Fleet ---");
  const agents = [
    {
      id: hre.ethers.encodeBytes32String("AGENT_PULSE_01"),
      name: "Arbitrage Prime",
      tier: 2 // 10k max
    },
    {
      id: hre.ethers.encodeBytes32String("AGENT_PULSE_02"),
      name: "Perp Hedger X",
      tier: 3 // 100k max
    },
    {
      id: hre.ethers.encodeBytes32String("AGENT_PULSE_03"),
      name: "Micro Scalper Alpha",
      tier: 1 // 500 max
    }
  ];

  for (const ag of agents) {
    const regTx = await registry.registerAgent(
      ag.id,
      ag.name,
      deployer.address,
      deployer.address,
      ag.tier
    );
    await regTx.wait();
    console.log(`✓ Registered Agent: ${ag.name} (Tier ${ag.tier})`);
  }

  console.log("\n==================================================");
  console.log("PulseGrid Infrastructure Successfully Deployed!");
  console.log("Registry:        ", registryAddress);
  console.log("Firewall:        ", firewallAddress);
  console.log("ClearingHouse:   ", clearingAddress);
  console.log("MockDEX:         ", dexAddress);
  console.log("MockUSDC:        ", usdcAddress);
  console.log("==================================================");

  // Output config for UI & simulator
  const fs = require("fs");
  const config = {
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    registryAddress,
    firewallAddress,
    clearingAddress,
    dexAddress,
    usdcAddress
  };
  fs.writeFileSync("pulsegrid-deployed.json", JSON.stringify(config, null, 2));
  console.log("Configuration exported to pulsegrid-deployed.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
