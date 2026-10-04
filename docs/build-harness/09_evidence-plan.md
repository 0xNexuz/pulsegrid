# 09 Evidence Plan & Verification Proofs

This document collects the verifiable evidence proving PulseGrid's implementation, onchain deployment, cryptographic receipts, and testing.

---

## 1. Onchain Monad Testnet Deployment Proofs

- **Network:** Monad Testnet (Chain ID: `10143`)
- **Deployer Account:** [`0x4203A9A0bF96d007939eBFD08b33c23AD7DE1683`](https://testnet.monadscan.com/address/0x4203A9A0bF96d007939eBFD08b33c23AD7DE1683)
- **Deployment Manifest:** `deployed-contracts.json`

### Deployed Contracts
1. **PulseGridClearing:**
   - Address: [`0xF69164fEFE9f8ebD0757B3351F3d72cae8647f25`](https://testnet.monadscan.com/address/0xF69164fEFE9f8ebD0757B3351F3d72cae8647f25)
2. **PulseGridFirewall:**
   - Address: [`0x0003d9b81E576f2a732b96b7d476C74459e99091`](https://testnet.monadscan.com/address/0x0003d9b81E576f2a732b96b7d476C74459e99091)
3. **PulseGridRegistry:**
   - Address: [`0x904A4757c3c165Eaee2BE1449bdA7c36EC9CE63a`](https://testnet.monadscan.com/address/0x904A4757c3c165Eaee2BE1449bdA7c36EC9CE63a)
4. **MockDEX:**
   - Address: [`0xA3E444Ca0626df5d1843c450BCfDd28AD25a4A55`](https://testnet.monadscan.com/address/0xA3E444Ca0626df5d1843c450BCfDd28AD25a4A55)
5. **MockUSDC:**
   - Address: [`0x3777D2Ce5cB782f3433a5042fAEBf524Ad29Aa52`](https://testnet.monadscan.com/address/0x3777D2Ce5cB782f3433a5042fAEBf524Ad29Aa52)

---

## 2. Public Live Deployments

- **Production Dashboard:** [https://pulsegrid-phi.vercel.app](https://pulsegrid-phi.vercel.app)
- **Documentation Portal:** [https://pulsegrid-phi.vercel.app/docs](https://pulsegrid-phi.vercel.app/docs)
- **GitHub Repository:** [https://github.com/0xNexuz/pulsegrid](https://github.com/0xNexuz/pulsegrid)

---

## 3. Cryptographic Receipt Verification

Every cleared or quarantined action generates a verifiable cryptographic SHA-256 hash.
- **Preimage Format:** `agentId|target|amount|blockNumber|nonce|status`
- **Verification Tool:** Web Crypto API (`crypto.subtle.digest("SHA-256")`) live in browser UI modal.

---

## 4. Independent Verification Path

Anyone can independently clone and verify all claims with three standard commands:
```bash
# 1. Verify specification & security unit tests (12 tests)
node test/run-tests.js

# 2. Run real multi-agent concurrent async burst pipeline
node agent-fleet/fleet-simulator.js

# 3. Check live deployer wallet balance & block height on Monad
node scripts/check-balance.js
```
