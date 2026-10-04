# 04 Threat Model & Security Defenses

## Security Objectives
Protect agent treasuries, prevent unauthorized fund extraction, and maintain tamper-evident audit receipts even when autonomous agents or external smart contracts behave maliciously or unpredictably.

## Assets at Risk
| Asset | Impact if Compromised | PulseGrid Defense |
|---|---|---|
| **Agent Treasury Vaults** | Catastrophic loss of capital | Hard per-transaction spending ceiling & hourly velocity limit |
| **Protocol Allowlist** | Extraction to rogue draining contracts | Strict `allowedTargets` mapping enforced onchain |
| **Agent Status State** | Unauthorized unquarantine of rogue agents | Access-controlled state machine (only Clearinghouse/Owner) |
| **Execution Receipts** | Falsification of compliance history | Keccak256 cryptographic binding over block height and parameters |

## Threat Actors & Attack Scenarios

### 1. Compromised or Rogue AI Agent
- **Attack:** An LLM prompt injection or runaway algorithm attempts a $1,000,000 flash liquidation drain.
- **Defense:** Intercepted at `verifyAction`. Amount exceeds `maxSingleTxAmount`. Agent is immediately transitioned to `Quarantined` state. Call to destination is never made.

### 2. Malicious Target Contract (Re-entrancy Attack)
- **Attack:** An allowlisted protocol attempts to call back into `PulseGridClearing.executeAction` recursively before state is finalized.
- **Defense:** Non-reentrant lock (`_locked` modifier) and Check-Effects-Interactions pattern.

### 3. Rapid Micro-Drain (Velocity Evasion)
- **Attack:** An attacker attempts 500 successive $400 transactions to evade the $500 single-tx ceiling.
- **Defense:** Rolling 1-hour `windowSpendLimit` accumulated in `velocityStates`. The moment accumulated spend reaches $2,500, subsequent calls revert with `ERR_HOURLY_VELOCITY_BREACHED`.

### 4. Target Execution Failure / Slippage Revert
- **Attack:** Market conditions cause the target swap to fail.
- **Defense:** Low-level call handling returns failure without destroying the audit trail. Receipt records failed clearance, preventing phantom spend accounting.

## Guarantees & Non-Guarantees
### Guarantees
- No agent transaction exceeding its configured ceiling can execute onchain.
- Quarantined agents cannot execute any actions until explicitly reinstated by governance.
- All clearances generate an immutable event receipt on Monad.

### Non-Guarantees
- PulseGrid does not guarantee profitability of trading strategies within compliant policy limits.
- Offchain LLM reasoning latency is outside the smart contract boundary.
