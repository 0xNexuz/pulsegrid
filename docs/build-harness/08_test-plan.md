# 08 Test Plan & Verification Strategy

## Test Philosophy
PulseGrid tests are designed to execute without external network dependencies, ensuring any reviewer or judge can clone the repository and run the full test suite immediately with `node test/run-tests.js`.

## Test Matrix

| Test Suite | Purpose | Invariants Verified | Expected Behavior |
|---|---|---|---|
| **Registry Suite** | Agent onboarding & identity recording | INV-004 | Disallows duplicate registrations, records operators & risk tiers. |
| **Firewall Spending Cap** | Verify single-transaction ceiling | INV-001 | Permits $\le$ ceiling, rejects $>$ ceiling with `ERR_MAX_SINGLE_TX_EXCEEDED`. |
| **Firewall Allowlist** | Verify protocol destination checks | INV-003 | Blocks unallowlisted contract addresses with `ERR_TARGET_NOT_ALLOWLISTED`. |
| **Firewall Velocity** | Verify rolling 1-hour window accumulator | INV-002 | Accumulates volume; halts execution upon threshold breach. |
| **Clearinghouse Clearance** | Verify compliant trade execution | INV-005 | Emits structured receipt, records global volume, increments counter. |
| **Clearinghouse Quarantine** | Verify adversarial containment | INV-004 | State reverses, zero treasury spent, agent marked `Quarantined`. |
| **Post-Quarantine Isolation** | Verify quarantined agent lock | INV-004 | Quarantined agent cannot execute any subsequent transactions. |
| **Re-entrancy Defense** | Verify non-reentrant state locks | INV-006 | Recursive calls from malicious targets are immediately reverted. |

## Execution Command
```bash
node test/run-tests.js
```
Expected output: `TEST RESULTS: 10 Passed | 0 Failed` (with exit code 0).
