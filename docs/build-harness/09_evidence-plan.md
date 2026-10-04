# 09 Evidence Plan & Cryptographic Proofs

## Evidence Portfolio

1. **Deterministic Test Execution Log:**
   - Automated test runner output from `test/run-tests.js` validating all invariants.
2. **Solidity Source Files:**
   - `PulseGridRegistry.sol`, `PulseGridFirewall.sol`, and `PulseGridClearing.sol` located in `contracts/`.
3. **Execution Receipts:**
   - Cryptographic state roots tying agent ID, destination protocol, volume, timestamp, and verification verdict.
4. **Simulator Telemetry:**
   - Paced multi-agent simulation run logging sub-45ms latency and block progression.
5. **Interactive UI Demonstration:**
   - Live dashboard running on `http://localhost:3000` with interactive attack injection.

## Verification Command
To reproduce all evidence independently:
```bash
# 1. Run unit tests
node test/run-tests.js

# 2. Run multi-agent burst simulation
node agent-fleet/fleet-simulator.js

# 3. Launch live dashboard
node server.js
```
