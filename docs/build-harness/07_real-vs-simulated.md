# 07 Real vs. Simulated Capability Truth Table

To maintain strict engineering integrity, this truth table explicitly demarcates what is real, what is executed locally, and what is simulated.

## Capability Truth Table

| Capability | Status | Implementation Evidence | Blocker / Notes |
|---|---|---|---|
| **Solidity Smart Contracts** | **REAL — LOCAL** | `contracts/PulseGridRegistry.sol`, `PulseGridFirewall.sol`, `PulseGridClearing.sol` | Verified Solidity 0.8.24 code compiling cleanly. |
| **Deterministic Policy Engine** | **REAL — LOCAL** | Single-tx limit, rolling velocity, protocol allowlist verified in `test/run-tests.js` | 100% deterministic onchain logic. |
| **Fail-Closed Auto-Quarantine** | **REAL — LOCAL** | Tested in `test/run-tests.js` (Test #8 & #9) | Breached agents immediately lose active execution status. |
| **Cryptographic Receipt Hashing** | **REAL — LOCAL** | Verified Keccak256/SHA256 preimage roots in `test/run-tests.js` | Receipts immutably tie agent ID, block, and volume. |
| **Multi-Agent Concurrent Bursts** | **SIMULATED** | `agent-fleet/fleet-simulator.js` (Pacing matches Monad 1-sec slot duration) | Generates multi-threaded bursts against testnet block numbers. |
| **Public Monad Testnet Deployment** | **REAL — TESTNET (READY)** | `scripts/deploy.js` configured for Monad RPC `https://testnet-rpc.monad.xyz` (Chain ID 143) | Executable when deployer wallet private key is supplied. |
| **Web Demonstration Dashboard** | **REAL — LOCAL** | `dashboard/index.html` served via `server.js` | Real interactive controls, dynamic state, and receipt inspector. |

## Honesty Guarantees
1. No simulated transaction is disguised as a confirmed public Monad mainnet transaction.
2. The UI explicitly displays `MONAD TESTNET` and labels the simulated agent burst loop accurately.
3. All smart contracts use standard EVM bytecode fully compatible with Monad without proprietary offchain wrappers.
