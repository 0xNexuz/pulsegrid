const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PulseGrid Autonomous Agent Risk Firewall & Clearing Mesh", function () {
  let owner, agentAlphaOp, agentBetaOp, rogueOp, vault;
  let registry, firewall, clearing, mockUSDC, mockDEX;

  const agentAlphaId = ethers.encodeBytes32String("AGENT_ALPHA_01");
  const agentBetaId = ethers.encodeBytes32String("AGENT_BETA_02");
  const rogueAgentId = ethers.encodeBytes32String("AGENT_ROGUE_99");

  beforeEach(async function () {
    [owner, agentAlphaOp, agentBetaOp, rogueOp, vault] = await ethers.getSigners();

    // 1. Deploy Core Infrastructure
    const RegistryFactory = await ethers.getContractFactory("PulseGridRegistry");
    registry = await RegistryFactory.deploy();
    await registry.waitForDeployment();

    const FirewallFactory = await ethers.getContractFactory("PulseGridFirewall");
    firewall = await FirewallFactory.deploy(await registry.getAddress());
    await firewall.waitForDeployment();

    const ClearingFactory = await ethers.getContractFactory("PulseGridClearing");
    clearing = await ClearingFactory.deploy(await registry.getAddress(), await firewall.getAddress());
    await clearing.waitForDeployment();

    // 2. Deploy Mocks
    const USDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await USDCFactory.deploy();
    await mockUSDC.waitForDeployment();

    const DEXFactory = await ethers.getContractFactory("MockDEX");
    mockDEX = await DEXFactory.deploy(await mockUSDC.getAddress());
    await mockDEX.waitForDeployment();

    // 3. Configure Authorizations & Targets
    await registry.setClearingHouse(await clearing.getAddress());
    await firewall.setClearingHouse(await clearing.getAddress());
    await firewall.setTargetAllowed(await mockDEX.getAddress(), true);

    // 4. Register Agents
    // Agent Alpha: Tier 1 (Low Risk, Max Single Tx: 500 USDC)
    await registry.registerAgent(
      agentAlphaId,
      "Alpha Quant Scalper",
      agentAlphaOp.address,
      vault.address,
      1 // Tier 1
    );

    // Agent Beta: Tier 2 (Standard Trading, Max Single Tx: 10,000 USDC)
    await registry.registerAgent(
      agentBetaId,
      "Beta Arbitrageur",
      agentBetaOp.address,
      vault.address,
      2 // Tier 2
    );
  });

  describe("Agent Registration & Registry", function () {
    it("should correctly record agent profiles and active status", async function () {
      const profile = await registry.getAgent(agentAlphaId);
      expect(profile.name).to.equal("Alpha Quant Scalper");
      expect(profile.operator).to.equal(agentAlphaOp.address);
      expect(profile.riskTier).to.equal(1n);
      expect(profile.status).to.equal(1n); // Active = 1
    });

    it("should return the total registered agent count", async function () {
      const allIds = await registry.getAllAgentIds();
      expect(allIds.length).to.equal(2);
      expect(await registry.totalAgents()).to.equal(2n);
    });
  });

  describe("Deterministic Policy Enforcement", function () {
    it("should clear compliant trades and emit verified receipts", async function () {
      const tradeAmount = 100n * 10n ** 6n; // 100 USDC (under 500 USDC limit)
      const swapCalldata = mockDEX.interface.encodeFunctionData("swap", [
        await mockUSDC.getAddress(),
        ethers.ZeroAddress,
        tradeAmount,
        (tradeAmount * 99n) / 100n
      ]);

      const tx = await clearing.executeAction(
        agentAlphaId,
        await mockDEX.getAddress(),
        tradeAmount,
        swapCalldata
      );

      await expect(tx)
        .to.emit(clearing, "ActionCleared")
        .withArgs(
          (receiptHash) => receiptHash !== ethers.ZeroHash,
          agentAlphaId,
          await mockDEX.getAddress(),
          tradeAmount,
          (blockNum) => blockNum > 0n,
          (timestamp) => timestamp > 0n
        );

      const updatedProfile = await registry.getAgent(agentAlphaId);
      expect(updatedProfile.totalActionsCleared).to.equal(1n);
      expect(await clearing.totalVolumeCleared()).to.equal(tradeAmount);
    });

    it("should deterministically intercept single-tx spending limit breach and quarantine agent", async function () {
      const excessiveAmount = 2500n * 10n ** 6n; // 2,500 USDC (exceeds Tier 1 limit of 500 USDC)
      const swapCalldata = mockDEX.interface.encodeFunctionData("swap", [
        await mockUSDC.getAddress(),
        ethers.ZeroAddress,
        excessiveAmount,
        0
      ]);

      const tx = await clearing.executeAction(
        agentAlphaId,
        await mockDEX.getAddress(),
        excessiveAmount,
        swapCalldata
      );

      await expect(tx)
        .to.emit(clearing, "ActionQuarantined")
        .withArgs(
          (receiptHash) => receiptHash !== ethers.ZeroHash,
          agentAlphaId,
          await mockDEX.getAddress(),
          excessiveAmount,
          "ERR_MAX_SINGLE_TX_EXCEEDED",
          (timestamp) => timestamp > 0n
        );

      // Verify agent is automatically placed in Quarantined status (status = 2)
      const quarantinedProfile = await registry.getAgent(agentAlphaId);
      expect(quarantinedProfile.status).to.equal(2n); // Quarantined
      expect(await clearing.totalActionsQuarantined()).to.equal(1n);
    });

    it("should intercept unauthorized target contracts not on the allowlist", async function () {
      const unverifiedProtocol = "0x1111111111111111111111111111111111111111";
      const dummyAmount = 50n * 10n ** 6n;

      const tx = await clearing.executeAction(
        agentBetaId,
        unverifiedProtocol,
        dummyAmount,
        "0x"
      );

      await expect(tx)
        .to.emit(clearing, "ActionQuarantined")
        .withArgs(
          (receiptHash) => receiptHash !== ethers.ZeroHash,
          agentBetaId,
          unverifiedProtocol,
          dummyAmount,
          "ERR_TARGET_NOT_ALLOWLISTED",
          (timestamp) => timestamp > 0n
        );
    });
  });

  describe("Parallel Batch Clearing", function () {
    it("should process concurrent multi-agent batch actions in a single block transaction", async function () {
      const actions = [
        {
          agentId: agentBetaId,
          target: await mockDEX.getAddress(),
          amount: 500n * 10n ** 6n,
          callData: mockDEX.interface.encodeFunctionData("swap", [
            await mockUSDC.getAddress(),
            ethers.ZeroAddress,
            500n * 10n ** 6n,
            0
          ])
        },
        {
          agentId: agentBetaId,
          target: await mockDEX.getAddress(),
          amount: 750n * 10n ** 6n,
          callData: mockDEX.interface.encodeFunctionData("swap", [
            await mockUSDC.getAddress(),
            ethers.ZeroAddress,
            750n * 10n ** 6n,
            0
          ])
        },
        {
          agentId: agentBetaId,
          target: await mockDEX.getAddress(),
          amount: 1000n * 10n ** 6n,
          callData: mockDEX.interface.encodeFunctionData("swap", [
            await mockUSDC.getAddress(),
            ethers.ZeroAddress,
            1000n * 10n ** 6n,
            0
          ])
        }
      ];

      const tx = await clearing.executeBatch(actions);
      const receipt = await tx.wait();

      expect(receipt.status).to.equal(1);
      expect(await clearing.totalActionsProcessed()).to.equal(3n);
      expect(await clearing.totalVolumeCleared()).to.equal(2250n * 10n ** 6n);
    });
  });
});
