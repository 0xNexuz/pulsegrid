# 05 Core Invariants

The following properties are mathematically and deterministically guaranteed by PulseGrid contracts across all valid transaction states.

---

### INV-001: Strict Single-Transaction Spending Ceiling
- **Statement:** For any agent $A$, no transaction $T$ with volume $V$ shall clear if $V > \text{MaxSingleTx}(A)$.
- **Enforcement:** `PulseGridFirewall.verifyAction()`
- **Failure Code:** `ERR_MAX_SINGLE_TX_EXCEEDED`
- **Verification Test:** `test/run-tests.js` (Test #4)
- **Status:** **VERIFIED**

---

### INV-002: Monotonic Rolling Velocity Window
- **Statement:** The sum of all cleared volumes for agent $A$ within time window $[W_{\text{start}}, W_{\text{start}} + \Delta t]$ shall not exceed $\text{WindowSpendLimit}(A)$.
- **Enforcement:** `PulseGridFirewall.recordSpent()` & `verifyAction()`
- **Failure Code:** `ERR_HOURLY_VELOCITY_BREACHED`
- **Verification Test:** `test/run-tests.js` (Test #6)
- **Status:** **VERIFIED**

---

### INV-003: Closed-Set Protocol Allowlist
- **Statement:** No call shall be dispatched to target address $D$ unless $\text{allowedTargets}[D] == \text{true}$.
- **Enforcement:** `PulseGridFirewall.verifyAction()`
- **Failure Code:** `ERR_TARGET_NOT_ALLOWLISTED`
- **Verification Test:** `test/run-tests.js` (Test #5)
- **Status:** **VERIFIED**

---

### INV-004: Fail-Closed Quarantine Isolation
- **Statement:** Once agent $A$ is flagged with status `Quarantined`, all subsequent execution calls must fail immediately without state modification.
- **Enforcement:** `PulseGridRegistry.agents[A].status == AgentStatus.Quarantined` checked at step 1 of `verifyAction()`.
- **Failure Code:** `ERR_AGENT_NOT_ACTIVE`
- **Verification Test:** `test/run-tests.js` (Test #9)
- **Status:** **VERIFIED**

---

### INV-005: Cryptographic Audit Receipt Integrity
- **Statement:** Every processed action must emit an execution receipt whose `receiptHash` is the deterministic preimage hash:
  $$\text{receiptHash} = \text{Keccak256}(\text{agentId} \parallel \text{target} \parallel \text{amount} \parallel \text{timestamp} \parallel \text{blockNumber} \parallel \text{totalProcessed} \parallel \text{allowed})$$
- **Enforcement:** `PulseGridClearing._processAction()`
- **Verification Test:** `test/run-tests.js` (Test #7)
- **Status:** **VERIFIED**

---

### INV-006: Re-entrancy Invariance
- **Statement:** An active execution call cannot re-enter `PulseGridClearing` before all state updates (velocity, counters, and receipts) are committed.
- **Enforcement:** Non-reentrant lock guard on `PulseGridClearing`.
- **Status:** **VERIFIED**

---

## Invariant Coverage Summary
| Invariant ID | Name | Contract Location | Test Reference | Status |
|---|---|---|---|---|
| **INV-001** | Max Single-Tx Ceiling | `PulseGridFirewall.sol:112` | `run-tests.js:145` | **VERIFIED** |
| **INV-002** | Hourly Velocity Limit | `PulseGridFirewall.sol:123` | `run-tests.js:157` | **VERIFIED** |
| **INV-003** | Protocol Allowlist | `PulseGridFirewall.sol:108` | `run-tests.js:151` | **VERIFIED** |
| **INV-004** | Quarantine Isolation | `PulseGridRegistry.sol:72` | `run-tests.js:179` | **VERIFIED** |
| **INV-005** | Cryptographic Receipt | `PulseGridClearing.sol:98` | `run-tests.js:168` | **VERIFIED** |
| **INV-006** | Re-entrancy Invariance| `PulseGridClearing.sol:52` | `run-tests.js:185` | **VERIFIED** |
