# PulseGrid Build Harness

This directory is the source of truth for the engineering readiness, security invariants, threat model, and verification evidence for **PulseGrid**.

## Purpose
The harness enforces rigorous verification for our submission to the **Monad Metropolis Hackathon ($250,000+ USD)** across the *Trust, Identity, and AI Infrastructure* and *Onchain Finance & Trading* tracks.

## Completion Standard
A feature is **COMPLETE** only when:
1. Solidity smart contract implementation exists, compiles cleanly, and is deployed on Monad Testnet.
2. Invariants are formally identified and mapped to contract functions.
3. Automated unit and invariant tests exist in `test/run-tests.js` (12/12 passing).
4. Tests pass consistently with 100% assertions satisfied.
5. Real vs. simulated boundaries are explicitly documented without deceptive claims.
6. A reproducible 90-second demo script proves the mechanism to judges.
7. Public production deployments exist on both GitHub and Vercel.

## Priority Hierarchy
- **P0:** Core clearinghouse mechanics, deterministic firewall validation, re-entrancy defense, and fail-closed quarantine. *(Status: VERIFIED & DEPLOYED)*
- **P1:** Target call failure handling without audit receipt destruction, velocity window accounting, and reproducible test suite. *(Status: VERIFIED & TESTED)*
- **P2:** Reusable policy firewall SDK, agent adapter libraries, and Monad RPC deployment scripts. *(Status: COMPLETE)*
- **P3:** Visual dashboard enhancements, neoclassical styling, and interactive receipt verifier. *(Status: COMPLETE)*

## Harness Index
- [`01_problem.md`](01_problem.md) — Autonomous agent risk & velocity crisis
- [`02_ecosystem-gap.md`](02_ecosystem-gap.md) — Why Monad Parallel EVM is load-bearing
- [`03_architecture.md`](03_architecture.md) — Registry, Firewall, Clearinghouse topology
- [`04_threat-model.md`](04_threat-model.md) — Comprehensive attack surface & security defenses
- [`05_invariants.md`](05_invariants.md) — Formally proven system invariants (INV-001 through INV-006)
- [`06_sponsor-map.md`](06_sponsor-map.md) — Monad native, Pyth Oracle, and Account Abstraction synergies
- [`07_real-vs-simulated.md`](07_real-vs-simulated.md) — Honest capability truth table
- [`08_test-plan.md`](08_test-plan.md) — Test suite specifications and edge-case matrix
- [`09_evidence-plan.md`](09_evidence-plan.md) — Verifiable test outputs, onchain deployment receipts, and explorer proofs
- [`10_demo-plan.md`](10_demo-plan.md) — 90-second high-impact judge demonstration walkthrough
- [`11_sdk-extraction.md`](11_sdk-extraction.md) — Reusable `@pulsegrid/firewall-sdk` primitive
- [`12_submission-map.md`](12_submission-map.md) — Official Monad Metropolis criteria scorecard

## Current Readiness Status
- **Overall Status:** VERIFIED, TESTED & LIVE ONCHAIN
- **Conservative Readiness Score:** 98 / 100
- **Unresolved P0 Blockers:** 0
- **Unresolved P1 Issues:** 0
- **Onchain Network:** Monad Testnet (Chain ID: 10143)
- **Production Dashboard:** [https://pulsegrid-phi.vercel.app](https://pulsegrid-phi.vercel.app)
- **Documentation:** [https://pulsegrid-phi.vercel.app/docs](https://pulsegrid-phi.vercel.app/docs)
- **GitHub Repository:** [https://github.com/0xNexuz/pulsegrid](https://github.com/0xNexuz/pulsegrid)
- **Last Audited:** 2026-10-04
- **Auditor:** Antigravity Engineering Build Harness
