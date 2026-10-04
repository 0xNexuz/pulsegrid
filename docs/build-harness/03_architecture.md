# 03 System Architecture

## Component Topology

PulseGrid is structured into three cleanly decoupled smart contracts on Monad:

```
                                    ┌───────────────────────┐
                                    │ Autonomous AI Agents  │
                                    └───────────┬───────────┘
                                                │ 1. Signed Execution Intent
                                                ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     PulseGrid Clearinghouse                                       │
│                                      (PulseGridClearing.sol)                                      │
│                                                                                                   │
│  2. Query Agent Profile & Risk Tier            3. Deterministic Policy Verification               │
│  ┌────────────────────────────────────┐        ┌──────────────────────────────────────────────┐   │
│  │         PulseGridRegistry          │        │              PulseGridFirewall               │   │
│  │       (PulseGridRegistry.sol)      │        │            (PulseGridFirewall.sol)           │   │
│  │                                    │        │                                              │   │
│  │  - Agent Identity & Operator Maps  │        │  - Max Single-Transaction Cap                │   │
│  │  - Assigned Risk Tiers (1/2/3)     │        │  - Rolling 1-Hour Velocity Window            │   │
│  │  - Status (Active / Quarantined)   │        │  - Protocol Target Contract Allowlist        │   │
│  │  - Total Cleared Counter           │        │  - Global Emergency Halt Circuit Breaker     │   │
│  └────────────────────────────────────┘        └──────────────────────────────────────────────┘   │
└───────────────────────────────────────────────┬───────────────────────────────────────────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       │ 4. Deterministic Outcome Dispatch               │
                       ▼                                                 ▼
             [VERDICT: COMPLIANT]                              [VERDICT: ANOMALY]
                       │                                                 │
                       ▼                                                 ▼
       ┌──────────────────────────────┐                  ┌──────────────────────────────┐
       │   Approved Target Protocol   │                  │   Deterministic Quarantine   │
       │    (e.g., MockDEX / Swap)    │                  │  - Revert Target Execution   │
       │  - Execute callData payload  │                  │  - Mark Agent QUARANTINED    │
       │  - Update Spend Velocity     │                  │  - Zero State Contamination  │
       │  - Emit ActionCleared event  │                  │  - Emit ActionQuarantined    │
       └──────────────────────────────┘                  └──────────────────────────────┘
                       │                                                 │
                       └────────────────────────┬────────────────────────┘
                                                │ 5. Cryptographic State Hash
                                                ▼
                               ┌──────────────────────────────────┐
                               │  Keccak256 Execution Receipt     │
                               │  (Onchain Verifiable Audit Root) │
                               └──────────────────────────────────┘
```

## Contract Responsibilities

### 1. `PulseGridRegistry.sol`
- Single source of truth for agent identities and authorizations.
- Maps `bytes32 agentId` to operators, treasury vaults, and assigned `riskTier`.
- Enforces access control: only the authorized clearinghouse or admin can alter agent status.

### 2. `PulseGridFirewall.sol`
- Pure deterministic policy evaluation.
- Implements tier-default spending rules:
  - **Tier 1 (Low Risk / Micro-Execution):** Max single-tx $500 USDC; 1-hr window $2,500 USDC.
  - **Tier 2 (Medium Risk / Standard DeFi):** Max single-tx $10,000 USDC; 1-hr window $50,000 USDC.
  - **Tier 3 (High Risk / Arbitrage Vault):** Max single-tx $100,000 USDC; 1-hr window $500,000 USDC.
- Validates that destination contract addresses are explicitly registered on the allowlist.

### 3. `PulseGridClearing.sol`
- The central high-throughput settlement execution kernel.
- Supports both single execution (`executeAction`) and concurrent batch execution (`executeBatch`).
- Issues tamper-evident execution receipts with a deterministic `keccak256` state root incorporating the agent ID, destination, volume, block number, timestamp, and verification verdict.
