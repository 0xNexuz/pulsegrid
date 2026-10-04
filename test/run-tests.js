const assert = require("node:assert");
const crypto = require("node:crypto");

console.log("\x1b[36m%s\x1b[0m", "\n=======================================================");
console.log("\x1b[1m\x1b[35m%s\x1b[0m", "   ⚡ PULSEGRID CONTRACT SPECIFICATION & UNIT TESTS");
console.log("\x1b[36m%s\x1b[0m", "=======================================================\n");

// --- In-Memory Exact Replica of Solidity Contract State Machine ---

class MockRegistry {
  constructor() {
    this.agents = new Map();
    this.operatorToAgent = new Map();
  }

  registerAgent(id, name, operator, vault, riskTier) {
    assert(!this.agents.has(id), "Agent already registered");
    assert(operator, "Invalid operator");
    assert(vault, "Invalid vault");

    const profile = {
      agentId: id,
      name,
      operator,
      vault,
      status: "Active",
      riskTier,
      totalActionsCleared: 0,
      registeredAt: Date.now()
    };
    this.agents.set(id, profile);
    this.operatorToAgent.set(operator, id);
    return profile;
  }

  setAgentStatus(id, newStatus) {
    const agent = this.agents.get(id);
    assert(agent, "Agent not found");
    agent.status = newStatus;
  }

  incrementCleared(id) {
    const agent = this.agents.get(id);
    assert(agent, "Agent not found");
    agent.totalActionsCleared += 1;
  }

  getAgent(id) {
    return this.agents.get(id);
  }
}

class MockFirewall {
  constructor(registry) {
    this.registry = registry;
    this.allowedTargets = new Set();
    this.emergencyHalt = false;
    this.velocity = new Map();

    this.tierDefaults = {
      1: { maxSingleTx: 500, windowLimit: 2500, windowDuration: 3600 },
      2: { maxSingleTx: 10000, windowLimit: 50000, windowDuration: 3600 },
      3: { maxSingleTx: 100000, windowLimit: 500000, windowDuration: 3600 }
    };
  }

  setTargetAllowed(target, allowed) {
    if (allowed) this.allowedTargets.add(target);
    else this.allowedTargets.delete(target);
  }

  toggleEmergencyHalt(halt) {
    this.emergencyHalt = halt;
  }

  verifyAction(agentId, target, amount) {
    if (this.emergencyHalt) {
      return { allowed: false, reason: "ERR_GLOBAL_EMERGENCY_HALT" };
    }

    const agent = this.registry.getAgent(agentId);
    if (!agent || agent.status !== "Active") {
      return { allowed: false, reason: "ERR_AGENT_NOT_ACTIVE" };
    }

    if (!this.allowedTargets.has(target)) {
      return { allowed: false, reason: "ERR_TARGET_NOT_ALLOWLISTED" };
    }

    const policy = this.tierDefaults[agent.riskTier];
    if (amount > policy.maxSingleTx) {
      return { allowed: false, reason: "ERR_MAX_SINGLE_TX_EXCEEDED" };
    }

    const currentSpent = this.velocity.get(agentId) || 0;
    if (currentSpent + amount > policy.windowLimit) {
      return { allowed: false, reason: "ERR_HOURLY_VELOCITY_BREACHED" };
    }

    return { allowed: true, reason: "OK_COMPLIANT" };
  }

  recordSpent(agentId, amount) {
    const current = this.velocity.get(agentId) || 0;
    this.velocity.set(agentId, current + amount);
  }

  getSpent(agentId) {
    return this.velocity.get(agentId) || 0;
  }
}

class MockClearing {
  constructor(registry, firewall) {
    this.registry = registry;
    this.firewall = firewall;
    this.totalClearedVolume = 0;
    this.totalProcessed = 0;
    this.totalQuarantined = 0;
    this._locked = false;
  }

  executeAction(agentId, target, amount, mockTargetBehavior = "success") {
    assert(!this._locked, "Reentrancy guard triggered");
    this._locked = true;

    try {
      this.totalProcessed++;
      const check = this.firewall.verifyAction(agentId, target, amount);

      const receiptHash = "0x" + crypto.createHash("sha256")
        .update(`${agentId}:${target}:${amount}:${this.totalProcessed}:${check.allowed}`)
        .digest("hex");

      if (!check.allowed) {
        this.totalQuarantined++;
        this.registry.setAgentStatus(agentId, "Quarantined");
        return { cleared: false, reason: check.reason, receiptHash };
      }

      if (mockTargetBehavior === "revert") {
        // Target call failed (e.g. slippage)
        return { cleared: false, reason: "ERR_TARGET_CALL_REVERTED", receiptHash };
      }

      if (mockTargetBehavior === "reenter") {
        // Malicious target attempts reentrancy
        this.executeAction(agentId, target, amount);
      }

      // Confirmed success: record velocity and volume
      this.firewall.recordSpent(agentId, amount);
      this.registry.incrementCleared(agentId);
      this.totalClearedVolume += amount;

      return { cleared: true, reason: "OK_COMPLIANT", receiptHash };
    } finally {
      this._locked = false;
    }
  }
}

// --- Test Suite Execution ---

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`\x1b[32m  ✓\x1b[0m ${name}`);
    passed++;
  } catch (err) {
    console.log(`\x1b[31m  ✗\x1b[0m ${name}`);
    console.error(`    -> ${err.message}`);
    failed++;
  }
}

console.log("Suite: PulseGridRegistry Specification");
const reg = new MockRegistry();
it("should register new agents with correct tier and active status", () => {
  const ag1 = reg.registerAgent("AG1", "Alpha Scalper", "0x111", "0xVault1", 1);
  assert.equal(ag1.name, "Alpha Scalper");
  assert.equal(ag1.riskTier, 1);
  assert.equal(ag1.status, "Active");
});

it("should disallow duplicate agent registration", () => {
  assert.throws(() => {
    reg.registerAgent("AG1", "Duplicate", "0x222", "0xVault2", 2);
  }, /already registered/);
});

console.log("\nSuite: PulseGridFirewall Deterministic Policy Rules");
const fw = new MockFirewall(reg);
fw.setTargetAllowed("0xMockDEX", true);

it("should permit compliant transactions within tier spending ceiling", () => {
  const res = fw.verifyAction("AG1", "0xMockDEX", 150);
  assert.equal(res.allowed, true);
  assert.equal(res.reason, "OK_COMPLIANT");
});

it("should deterministically reject transactions exceeding max single-tx cap", () => {
  const res = fw.verifyAction("AG1", "0xMockDEX", 1200); // Limit is 500
  assert.equal(res.allowed, false);
  assert.equal(res.reason, "ERR_MAX_SINGLE_TX_EXCEEDED");
});

it("should block calls to unauthorized unallowlisted target addresses", () => {
  const res = fw.verifyAction("AG1", "0xHackerContract", 50);
  assert.equal(res.allowed, false);
  assert.equal(res.reason, "ERR_TARGET_NOT_ALLOWLISTED");
});

it("should enforce rolling velocity window thresholds", () => {
  fw.recordSpent("AG1", 2400); // Near 2500 window limit
  const res = fw.verifyAction("AG1", "0xMockDEX", 200); // 2400 + 200 > 2500
  assert.equal(res.allowed, false);
  assert.equal(res.reason, "ERR_HOURLY_VELOCITY_BREACHED");
});

it("should halt all actions when emergency halt circuit breaker is active", () => {
  fw.toggleEmergencyHalt(true);
  const res = fw.verifyAction("AG1", "0xMockDEX", 50);
  assert.equal(res.allowed, false);
  assert.equal(res.reason, "ERR_GLOBAL_EMERGENCY_HALT");
  fw.toggleEmergencyHalt(false); // Reset
});

console.log("\nSuite: PulseGridClearing Execution, Security & Quarantine Mechanism");
const clearing = new MockClearing(reg, fw);
reg.registerAgent("AG2", "Beta Arbitrage", "0x333", "0xVault3", 2); // 10k limit

it("should clear legitimate action, record volume, and generate receipt", () => {
  const res = clearing.executeAction("AG2", "0xMockDEX", 2500);
  assert.equal(res.cleared, true);
  assert(res.receiptHash.startsWith("0x"));
  assert.equal(clearing.totalClearedVolume, 2500);
  assert.equal(reg.getAgent("AG2").totalActionsCleared, 1);
});

it("should auto-quarantine compromised agent attempting rogue breach", () => {
  const res = clearing.executeAction("AG2", "0xMockDEX", 50000); // Exceeds 10,000 max
  assert.equal(res.cleared, false);
  assert.equal(res.reason, "ERR_MAX_SINGLE_TX_EXCEEDED");
  assert.equal(reg.getAgent("AG2").status, "Quarantined");
});

it("should block further actions once agent is placed in Quarantined status", () => {
  const res = clearing.executeAction("AG2", "0xMockDEX", 10);
  assert.equal(res.cleared, false);
  assert.equal(res.reason, "ERR_AGENT_NOT_ACTIVE");
});

it("should handle downstream target revert without debiting phantom spend velocity", () => {
  reg.registerAgent("AG3", "Gamma Scalper", "0x444", "0xVault4", 2);
  const beforeSpent = fw.getSpent("AG3");
  const res = clearing.executeAction("AG3", "0xMockDEX", 1000, "revert");
  assert.equal(res.cleared, false);
  assert.equal(res.reason, "ERR_TARGET_CALL_REVERTED");
  assert.equal(fw.getSpent("AG3"), beforeSpent); // Velocity was not debited!
});

it("should prevent reentrancy attacks from malicious targets", () => {
  assert.throws(() => {
    clearing.executeAction("AG3", "0xMockDEX", 500, "reenter");
  }, /Reentrancy guard triggered/);
});

console.log("\n=======================================================");
console.log(`TEST RESULTS: ${passed} Passed | ${failed} Failed`);
console.log("=======================================================\n");

if (failed > 0) process.exit(1);
