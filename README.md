# ⚡ PulseGrid: High-Frequency Autonomous Agent Risk Firewall & Clearing Mesh

> **Built for the Monad Metropolis Hackathon ($250,000+ Prize Pool)**  
> **Primary Track:** Trust, Identity, and AI Infrastructure  
> **Secondary Track:** Onchain Finance & Trading  
> **Live Production Dashboard:** [https://pulsegrid-phi.vercel.app](https://pulsegrid-phi.vercel.app)  
> **Interactive Documentation:** [https://pulsegrid-phi.vercel.app/docs](https://pulsegrid-phi.vercel.app/docs)  
> **GitHub Repository:** [https://github.com/0xNexuz/pulsegrid](https://github.com/0xNexuz/pulsegrid)  
> **Target Network:** Monad Parallel EVM (Chain ID: 143 · 10,000 TPS · 1-Second Block Time · Single-Slot Finality)

---

## 💡 Overview

As autonomous AI agents execute high-frequency arbitrage, perp hedging, and automated liquidation onchain, they operate at millisecond velocities far exceeding human oversight. A single prompt injection, parameter hallucination, or private key leak can drain an entire multi-million dollar agent treasury in seconds before traditional risk dashboards can even render an alert.

**PulseGrid** is an onchain deterministic risk firewall and high-throughput clearing mesh engineered natively for Monad. By leveraging Monad's parallel transaction execution and decoupled consensus, PulseGrid validates deterministic spending caps, tracks rolling hourly velocity windows, checks protocol target allowlists, and settles concurrent multi-agent transactions in single 1-second blocks with **zero treasury contamination**.

---

## 🏛️ System Architecture

```
                        ┌────────────────────────────────────────────────────────┐
                        │      Autonomous AI Agent Fleet (Real Concurrent Async) │
                        └──────────────────────────┬─────────────────────────────┘
                                                   │ Signed Execution Requests
                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PULSEGRID PROTOCOL                                     │
│                                                                                        │
│  ┌───────────────────────┐    ┌─────────────────────────┐    ┌──────────────────────┐  │
│  │   PulseGridRegistry   │───▶│    PulseGridFirewall    │───▶│   PulseGridClearing  │  │
│  │  - Agent Identity     │    │  - Max Single Tx Cap    │    │  - Concurrent Batch  │  │
│  │  - Risk Tiers (1/2/3) │    │  - Hourly Velocity      │    │  - Target Call       │  │
│  │  - Active/Quarantine  │    │  - Allowlist Protocol   │    │  - SHA-256 Receipts  │  │
│  └───────────────────────┘    └─────────────────────────┘    └──────────────────────┘  │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
          [Compliant Action]                            [Malicious / Anomaly]
                    │                                             │
                    ▼                                             ▼
       ┌────────────────────────┐                    ┌────────────────────────┐
       │   MockDEX / Target     │                    │  Deterministic Rollback│
       │  Sub-second Settlement │                    │  Auto-Quarantine State │
       │  Emits Verified Receipt│                    │  Zero Treasury Loss    │
       └────────────────────────┘                    └────────────────────────┘
```

---

## 🔬 Real Concurrency & Cryptographic Hash Guarantees

Unlike cosmetic demos that simulate delays using static timers or generate pseudo-random strings, PulseGrid implements authentic high-performance execution primitives:

| Feature Dimension | Simulated / Mock Approach | **PulseGrid Real Engine Guarantee** |
| :--- | :--- | :--- |
| **Agent Concurrency** | Serial loop with `setTimeout` delays | **Real asynchronous multi-agent bursts** using `Promise.all()` parallel task execution across disjoint agent workers. |
| **Receipt Hashes** | `Math.random().toString(16)` mock hex strings | **100% Real SHA-256 cryptographic hashes** computed via the native Web Crypto API (`crypto.subtle.digest("SHA-256")`) and Node.js `node:crypto`. |
| **Preimage Verifiability** | Synthetic unlinked data | Every receipt stores its raw deterministic preimage (`agentId\|target\|amount\|block\|nonce\|status`), allowing instant live re-computation and verification in the UI modal. |
| **State Mutation** | Cosmetic visual counters | Authentic state machine mutating live velocity buckets, cumulative cleared volume, and quarantine statuses in real time. |
| **Error Handling** | Generic UI alert popups | **Deterministic onchain exception codes** that abort execution frames, reverse state mutations, and isolate rogue agent identities. |

---

## 🚀 Why Monad is Load-Bearing

On conventional EVM networks (Ethereum, Arbitrum, Base), executing high-frequency risk evaluations and clearing dozens of concurrent agent actions sequentially creates:
1. **State Lock Contention:** Sequential execution locks state, causing dramatic latency spikes.
2. **Prohibitive Gas Costs:** 50 risk evaluations per second would cost thousands of dollars per hour.
3. **Delayed Rollbacks:** Multi-second block times allow rogue arbitrageurs to exploit stale balances.

**PulseGrid requires Monad:**
- **Parallel EVM:** Processes disjoint agent state updates simultaneously in the same block without transaction pipeline stalling.
- **MonadDb:** Eliminates disk I/O bottlenecks during concurrent state reads/writes.
- **1-Second Finality:** Delivers sub-second trade confirmations and instant onchain quarantine containment.

---

## 📦 Project Structure

```
pulsegrid/
├── contracts/
│   ├── PulseGridRegistry.sol    # Agent identity & risk tier management
│   ├── PulseGridFirewall.sol    # Deterministic spending & velocity policy engine
│   ├── PulseGridClearing.sol    # Concurrent batch execution & receipt issuer
│   └── mocks/
│       ├── MockUSDC.sol         # Settlement ERC20 token
│       └── MockDEX.sol          # Simulated orderbook & swap venue
├── test/
│   ├── run-tests.js             # Zero-dependency specification & unit test suite (12 tests)
│   └── pulsegrid.test.js        # Hardhat integration tests
├── agent-fleet/
│   └── fleet-simulator.js       # Real multi-agent concurrent async burst engine
├── dashboard/
│   ├── index.html               # Interactive cybernetic judge demonstration UI
│   └── docs.html                # Neoclassical protocol documentation page
├── public/
│   ├── index.html               # Deployed dashboard production entrypoint
│   ├── docs.html                # Deployed docs page entrypoint
│   └── docs/index.html          # Clean-URL docs route support
├── scripts/
│   └── deploy.js                # Monad Testnet deployment pipeline
├── server.js                    # Zero-dependency local web server with clean routing
├── vercel.json                  # Production Vercel edge deployment configuration
└── package.json
```

---

## 🧪 Verification & Test Suite (12 / 12 Passing)

PulseGrid includes an exhaustive, zero-dependency specification test suite (`test/run-tests.js`) that validates every protocol invariant, edge-case exception, and threat vector.

Run the test suite directly:
```bash
node test/run-tests.js
```

### Complete Test Catalog

#### Suite 1: `PulseGridRegistry` Specification
1. **`should register new agents with correct tier and active status`**
   - Validates that new agents are provisioned with their designated risk tier (Tier 1, 2, or 3), valid operator/vault addresses, and initialized in the `Active` state with zero cleared volume.
2. **`should disallow duplicate agent registration`**
   - Validates that attempting to re-register an existing `agentId` reverts with `Agent already registered`, guaranteeing immutable agent identity bindings.

#### Suite 2: `PulseGridFirewall` Deterministic Policy Rules
3. **`should permit compliant transactions within tier spending ceiling`**
   - Asserts that a standard trade ($150 on Tier 1 limit of $500) against an allowlisted target returns `{ allowed: true, reason: "OK_COMPLIANT" }`.
4. **`should deterministically reject transactions exceeding max single-tx cap`**
   - Asserts that an over-limit transaction ($1,200 on Tier 1 limit of $500) is deterministically rejected with `ERR_MAX_SINGLE_TX_EXCEEDED`.
5. **`should block calls to unauthorized unallowlisted target addresses`**
   - Asserts that attempting to route execution to an unverified target (`0xHackerContract`) is blocked with `ERR_TARGET_NOT_ALLOWLISTED`.
6. **`should enforce rolling velocity window thresholds`**
   - Asserts that when cumulative rolling spend approaches the hourly ceiling ($2,400 spent of $2,500 limit), an incremental $200 trade is rejected with `ERR_HOURLY_VELOCITY_BREACHED`.
7. **`should halt all actions when emergency halt circuit breaker is active`**
   - Asserts that when `emergencyHalt` is triggered, even compliant trades from active agents are rejected with `ERR_GLOBAL_EMERGENCY_HALT`.

#### Suite 3: `PulseGridClearing` Execution, Security & Quarantine Mechanism
8. **`should clear legitimate action, record volume, and generate receipt`**
   - Asserts that compliant orders settle successfully, increment total protocol volume, update the agent's cleared count, and emit a valid cryptographic receipt hash.
9. **`should auto-quarantine compromised agent attempting rogue breach`**
   - Asserts that when an agent attempts an unauthorized breach ($50,000 on Tier 2 cap of $10,000), the clearing engine blocks execution, transitions the agent to `Quarantined`, and prevents treasury drainage.
10. **`should block further actions once agent is placed in Quarantined status`**
    - Asserts that once quarantined, subsequent actions—even micro-transactions as small as $10—are rejected with `ERR_AGENT_NOT_ACTIVE`.
11. **`should handle downstream target revert without debiting phantom spend velocity`**
    - Asserts that when downstream target execution reverts (e.g., DEX slippage breach), the agent's velocity balance is **not** debited, preventing false exhaustion of the hourly ceiling.
12. **`should prevent reentrancy attacks from malicious targets`**
    - Asserts that recursive calls back into `executeAction` during target execution trigger the reentrancy guard (`Reentrancy guard triggered`), preventing cross-function drainage.

---

## 🚨 Documented Error Reference & Failure Modes

PulseGrid defines explicit, deterministic error codes for all security and policy violations. Below is the comprehensive error taxonomy:

| Error Code | Trigger Condition | System Behavior & Remediation | Test Verification |
| :--- | :--- | :--- | :--- |
| **`ERR_MAX_SINGLE_TX_EXCEEDED`** | `amount > policy.maxSingleTx` | Execution halted; zero balance debited. Agent status mutated to `Quarantined`. Cryptographic receipt emitted with failure preimage. | `run-tests.js` (Test #4, #9) |
| **`ERR_TARGET_NOT_ALLOWLISTED`** | `allowedTargets.has(target) === false` | Low-level external call is blocked before execution. Agent quarantined for attempting interaction with unverified address. | `run-tests.js` (Test #5) |
| **`ERR_HOURLY_VELOCITY_BREACHED`** | `currentSpent + amount > policy.windowLimit` | Transaction rejected to prevent high-frequency micro-draining. Spent velocity preserved. Agent may resume once the rolling window decays. | `run-tests.js` (Test #6) |
| **`ERR_GLOBAL_EMERGENCY_HALT`** | `emergencyHalt === true` | Global protocol circuit breaker triggered by multisig or automated monitor. 100% of clearing routes frozen until disarmed. | `run-tests.js` (Test #7) |
| **`ERR_AGENT_NOT_ACTIVE`** | `agent.status !== "Active"` | Triggered when a `Quarantined` or `Deactivated` agent attempts execution. Execution dropped immediately at registry check. | `run-tests.js` (Test #10) |
| **`ERR_TARGET_CALL_REVERTED`** | Downstream contract call reverts (slippage, liquidity) | Clean execution failure without penalizing the agent's rolling velocity allowance (no phantom debiting). | `run-tests.js` (Test #11) |
| **`Reentrancy guard triggered`** | Malicious target reenters `executeAction` | Atomic revert via mutual exclusion lock. Protects clearing treasury against recursive drainage. | `run-tests.js` (Test #12) |
| **`Agent already registered`** | Duplicate registration call for existing `agentId` | Atomic revert in `PulseGridRegistry`. Prevents operator hijacking or state overwriting. | `run-tests.js` (Test #2) |

---

## ⚡ Quickstart Guide

### 1. Run Specification Unit Tests
Verify all policy rules, velocity windows, reentrancy guards, and quarantine transitions:
```bash
node test/run-tests.js
```

### 2. Run Real Multi-Agent Concurrent Async Burst Engine
Watch 6 autonomous agents trade in parallel on Monad parameters using real `Promise.all()` concurrency:
```bash
node agent-fleet/fleet-simulator.js
```

### 3. Launch the Local Web Server
Launch the zero-dependency local web server to interact with the live transaction waterfall and docs:
```bash
node server.js
```
- Interactive Dashboard: `http://localhost:3000`
- Documentation Page: `http://localhost:3000/docs`

---

## 🎮 90-Second Judge Demonstration Script

1. **The Context (0:00–0:20):** Explain the danger of unmonitored AI agents executing onchain at machine speed and the risk of treasury drain.
2. **Parallel Velocity (0:20–0:50):** Click **"Start Continuous Burst"**. Show 5 agents concurrently settling trades every second on Monad with sub-45ms latency and live verifiable SHA-256 receipts.
3. **The Breakthrough Moment (0:50–1:15):** Click **"🚨 Trigger Rogue Agent Anomaly"**. Watch Agent #6 attempt an unauthorized \$85,000 drain. The onchain firewall deterministically blocks the execution, reverses state, and flags the agent as `QUARANTINED` in real time with zero treasury loss.
4. **Verifiable Audit (1:15–1:30):** Click on the transaction receipt to inspect the cryptographic state root and click **"Live Re-verify Hash"** to prove the SHA-256 hash matches the exact raw preimage.

---

## 🛡️ License
MIT License. Built for the Monad Metropolis Hackathon.
