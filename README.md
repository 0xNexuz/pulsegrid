# ⚡ PulseGrid: High-Frequency Autonomous Agent Risk Firewall & Clearing Mesh

> **Built for the Monad Metropolis Hackathon ($250,000+ Prize Pool)**  
> **Primary Track:** Trust, Identity, and AI Infrastructure  
> **Secondary Track:** Onchain Finance & Trading  
> **Target Network:** Monad Parallel EVM (Chain ID: 143 · 10,000 TPS · 1-Second Block Time · Single-Slot Finality)

---

## 💡 Overview

As autonomous AI agents begin executing trades, rebalancing liquidity pools, and paying for real-time compute onchain, they operate at speeds far beyond human oversight. A single hallucinated prompt or compromised API key can drain an entire agent treasury before traditional risk systems detect it.

**PulseGrid** is an onchain deterministic risk firewall and high-throughput clearing mesh engineered natively for Monad. By leveraging Monad's parallel transaction execution and decoupled consensus, PulseGrid validates deterministic spending caps, monitors rolling velocity windows, checks protocol target allowlists, and settles concurrent multi-agent transactions in single 1-second blocks with zero treasury contamination.

---

## 🏛️ System Architecture

```
                        ┌────────────────────────────────────────────────────────┐
                        │      Autonomous AI Agent Fleet (10+ Concurrent)        │
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
│  │  - Active/Quarantine  │    │  - Allowlist Protocol   │    │  - Verifiable Receipt│  │
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

## 🚀 Why Monad is Load-Bearing

On conventional EVM networks (Ethereum, Arbitrum, Base), executing high-frequency risk evaluations and clearing dozens of concurrent agent actions sequentially creates:
1. **State Lock Contention:** Sequential execution locks state, causing dramatic latency spikes.
2. **Prohibitive Gas Costs:** 50 risk evaluations per second would cost thousands of dollars per hour.
3. **Delayed Rollbacks:** Multi-second block times allow rogue arbitrageurs to exploit stale balances.

**PulseGrid requires Monad:**
- **Parallel EVM:** Processes disjoint agent state updates simultaneously in the same block.
- **MonadDb:** Eliminates disk I/O bottlenecks during concurrent state reads/writes.
- **1-Second Finality:** Delivers sub-second trade confirmations and instant onchain quarantine.

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
│   ├── run-tests.js             # Zero-dependency specification & unit test suite
│   └── pulsegrid.test.js        # Hardhat integration tests
├── agent-fleet/
│   └── fleet-simulator.js       # Multi-agent concurrent burst simulation engine
├── dashboard/
│   └── index.html               # Interactive cybernetic judge demonstration UI
├── scripts/
│   └── deploy.js                # Monad Testnet deployment pipeline
├── server.js                    # Zero-dependency local web server
└── package.json
```

---

## ⚡ Quickstart Guide

### 1. Run Specification Unit Tests
Verify all policy rules, velocity windows, and quarantine state transitions:
```bash
node test/run-tests.js
```

### 2. Run High-Frequency Multi-Agent Fleet Simulation
Watch 6 autonomous agents trade in parallel on Monad parameters, complete with simulated adversary detection:
```bash
node agent-fleet/fleet-simulator.js
```

### 3. Launch the Judge-Facing Interactive Dashboard
Launch the local web server to interact with the live transaction waterfall:
```bash
node server.js
```
Open `http://localhost:3000` in your browser.

---

## 🎮 90-Second Judge Demonstration Script

1. **The Context (0:00–0:20):** Explain the danger of unmonitored AI agents executing onchain at machine speed.
2. **Parallel Velocity (0:20–0:50):** Click **"Start Continuous Burst"**. Show 4 agents concurrently settling trades every second on Monad with sub-45ms latency and live verifiable receipts.
3. **The Breakthrough Moment (0:50–1:15):** Click **"🚨 Trigger Rogue Agent Anomaly"**. Watch Agent #6 attempt an unauthorized \$85,000 drain. The onchain firewall deterministically blocks the execution, reverses state, and flags the agent as `QUARANTINED` in real time.
4. **Verifiable Audit (1:15–1:30):** Click on the transaction receipt to inspect the cryptographic state root and show zero loss to the treasury.

---

## 🛡️ License
MIT License. Built for the Monad Metropolis Hackathon.
