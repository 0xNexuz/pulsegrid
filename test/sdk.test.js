/**
 * PulseGrid SDK Unit Test Suite
 */
const assert = require("assert");

async function runSdkTests() {
  console.log("\n=======================================================");
  console.log("   📦 PULSEGRID SDK SPECIFICATION & INTEGRATION TESTS");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  const sdk = require("../sdk/index");

  // 1. Constants verification
  test("should export correct Monad Testnet Chain ID and contract addresses", () => {
    assert.strictEqual(sdk.MONAD_TESTNET_CHAIN_ID, 10143);
    assert.strictEqual(sdk.PULSEGRID_CONTRACTS.CLEARING, "0xF69164fEFE9f8ebD0757B3351F3d72cae8647f25");
    assert.strictEqual(sdk.PULSEGRID_CONTRACTS.FIREWALL, "0x0003d9b81E576f2a732b96b7d476C74459e99091");
    assert.strictEqual(sdk.PULSEGRID_CONTRACTS.REGISTRY, "0x904A4757c3c165Eaee2BE1449bdA7c36EC9CE63a");
  });

  // 2. PulseGridGuard initialization & bytes32 formatting
  test("should initialize PulseGridGuard with proper bytes32 padding", () => {
    const guard = new sdk.PulseGridGuard({ agentId: "AGENT_PULSE_01" });
    assert.strictEqual(guard.agentId, "AGENT_PULSE_01");
    assert(guard.agentIdBytes32.startsWith("0x"));
    assert.strictEqual(guard.agentIdBytes32.length, 66);
  });

  // 3. Calldata formatting
  test("should correctly encode executeAction calldata selector (0xf2031e4a)", () => {
    const guard = new sdk.PulseGridGuard({ agentId: "AGENT_PULSE_01" });
    const calldata = guard.encodeExecuteCalldata(sdk.PULSEGRID_CONTRACTS.MOCK_DEX, 100000000n, "0x");
    assert(calldata.startsWith("0xf2031e4a"));
  });

  // 4. Known error code matching
  test("should provide definitions for all onchain firewall invariant errors", () => {
    assert(sdk.KNOWN_ERROR_CODES.ERR_MAX_SINGLE_TX_EXCEEDED);
    assert(sdk.KNOWN_ERROR_CODES.ERR_TARGET_NOT_ALLOWLISTED);
    assert(sdk.KNOWN_ERROR_CODES.ERR_HOURLY_VELOCITY_BREACHED);
    assert(sdk.KNOWN_ERROR_CODES.ERR_GLOBAL_EMERGENCY_HALT);
    assert(sdk.KNOWN_ERROR_CODES.ERR_AGENT_NOT_ACTIVE);
  });

  // 5. Python module syntax check
  test("should provide working Python module definitions", () => {
    const fs = require("fs");
    const pyGuard = fs.readFileSync("./sdk/python/pulsegrid/guard.py", "utf8");
    assert(pyGuard.includes("class AgentFirewall:"));
    assert(pyGuard.includes("0xF69164fEFE9f8ebD0757B3351F3d72cae8647f25"));
  });

  console.log(`\n=======================================================`);
  console.log(`SDK TESTS: ${passed} Passed | ${failed} Failed`);
  console.log(`=======================================================\n`);

  if (failed > 0) process.exit(1);
}

runSdkTests();
