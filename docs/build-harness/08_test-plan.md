# 08 Test Plan & Verification Matrix

## Test Suite Overview

PulseGrid employs an exhaustive, zero-dependency specification and invariant test runner located in `test/run-tests.js`.

Execution Command:
```bash
node test/run-tests.js
```

Current Test Status: **12 Passed | 0 Failed (100% Pass Rate)**

---

## Complete Test Specification Matrix

| Suite | Test ID | Description / Invariant Tested | Expected Outcome / Error Code | Status |
|---|---|---|---|---|
| **PulseGridRegistry** | `REG-01` | Register new agent with correct tier and active status | Profile initialized with `Active` status & tier allowance | **PASS** |
| **PulseGridRegistry** | `REG-02` | Disallow duplicate agent registration | Reverts with `"Agent already registered"` | **PASS** |
| **PulseGridFirewall** | `FW-01` | Permit compliant transactions within tier spending ceiling | Returns `{ allowed: true, reason: "OK_COMPLIANT" }` | **PASS** |
| **PulseGridFirewall** | `FW-02` | Reject transactions exceeding max single-tx cap | Returns `{ allowed: false, reason: "ERR_MAX_SINGLE_TX_EXCEEDED" }` | **PASS** |
| **PulseGridFirewall** | `FW-03` | Block calls to unallowlisted destination addresses | Returns `{ allowed: false, reason: "ERR_TARGET_NOT_ALLOWLISTED" }` | **PASS** |
| **PulseGridFirewall** | `FW-04` | Enforce rolling hourly velocity window threshold | Returns `{ allowed: false, reason: "ERR_HOURLY_VELOCITY_BREACHED" }` | **PASS** |
| **PulseGridFirewall** | `FW-05` | Halt all actions when emergency circuit breaker is active | Returns `{ allowed: false, reason: "ERR_GLOBAL_EMERGENCY_HALT" }` | **PASS** |
| **PulseGridClearing** | `CLR-01` | Clear legitimate action, record volume, generate receipt | Clears execution, updates balance, outputs SHA-256 receipt | **PASS** |
| **PulseGridClearing** | `CLR-02` | Auto-quarantine compromised agent attempting rogue breach | Clears false, agent status mutated to `Quarantined`, zero loss | **PASS** |
| **PulseGridClearing** | `CLR-03` | Block further actions once placed in Quarantined status | Returns `{ allowed: false, reason: "ERR_AGENT_NOT_ACTIVE" }` | **PASS** |
| **PulseGridClearing** | `CLR-04` | Handle target revert without debiting phantom spend velocity | Returns `ERR_TARGET_CALL_REVERTED`, velocity preserved | **PASS** |
| **PulseGridClearing** | `CLR-05` | Prevent reentrancy attacks from malicious target contracts | Throws `"Reentrancy guard triggered"` via mutual exclusion | **PASS** |

---

## Deterministic Error Taxonomy

| Error Code | Trigger Condition | Mitigation Behavior |
|---|---|---|
| `ERR_MAX_SINGLE_TX_EXCEEDED` | `amount > policy.maxSingleTx` | Execution halted; agent quarantined; zero treasury contamination. |
| `ERR_TARGET_NOT_ALLOWLISTED` | `allowedTargets.has(target) === false` | External call aborted before execution; agent quarantined. |
| `ERR_HOURLY_VELOCITY_BREACHED` | `spent + amount > windowLimit` | Prevents high-frequency micro-draining; rolling spend preserved. |
| `ERR_GLOBAL_EMERGENCY_HALT` | `emergencyHalt === true` | Frozen fail-closed state across all clearing routes. |
| `ERR_AGENT_NOT_ACTIVE` | `status !== "Active"` | Instant rejection at registry gate for quarantined/deactivated bots. |
| `ERR_TARGET_CALL_REVERTED` | Low-level call to target reverts | Clean rollback; velocity not debited (no phantom spending). |
| `Reentrancy guard triggered` | Target reenters `executeAction` | Atomic revert via mutual exclusion lock. |
| `Agent already registered` | Re-registration attempt | Atomic revert preserving immutable operator bindings. |
