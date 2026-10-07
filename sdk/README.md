# `@pulsegrid/sdk` — Autonomous Agent Invariant Firewall

> **The Onchain Execution Firewall for Autonomous AI Agents and Trading Bots on Monad (Chain ID: 10143).**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Monad](https://img.shields.io/badge/Monad-Testnet%2010143-purple.svg)](https://testnet.monadscan.com)
[![Pass Rate](https://img.shields.io/badge/Unit%20Tests-12%2F12%20Passing-emerald.svg)](https://pulsegrid-phi.vercel.app/docs)

PulseGrid provides a **deterministic pre-execution invariant firewall** that protects autonomous AI agents (ElizaOS, LangChain, AutoGPT) and high-frequency trading bots from key compromise, prompt injection, and catastrophic treasury drains.

---

## Installation

```bash
# Node.js / TypeScript (npm)
npm install @pulsegrid/sdk ethers

# Or Python (pip)
pip install pulsegrid-guard web3
```

---

## 3-Line TypeScript Quickstart

```typescript
import { PulseGridGuard, PULSEGRID_CONTRACTS } from "@pulsegrid/sdk";
import { ethers } from "ethers";

// 1. Initialize guard with your agent's identity
const guard = new PulseGridGuard({
  agentId: "AGENT_PULSE_01",
  signer: new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!, provider)
});

// 2. Route trading or rebalancing actions through the firewall
const receipt = await guard.execute({
  target: PULSEGRID_CONTRACTS.MOCK_DEX, // Allowlisted DEX
  amount: ethers.parseUnits("100", 6),  // Enforced under single-tx ceiling ($10,000)
  callData: "0x"                         // Swap payload
});

console.log("Cleared on Monad:", receipt.explorerUrl);
```

---

## Python Quickstart (For LangChain & AI Bots)

```python
from pulsegrid import AgentFirewall

firewall = AgentFirewall(
    agent_id="AGENT_SWARM_ALPHA",
    rpc_url="https://testnet-rpc.monad.xyz"
)

# Intercept prompt-injected LLM calls before submitting to Monad
receipt = firewall.protect_action(
    target="0xA3E444Ca0626df5d1843c450BCfDd28AD25a4A55",
    amount=50.0
)
print("Action Cleared:", receipt)
```

---

## Solidity Interface (`IPulseGridClearing.sol`)

For smart contract sub-vaults or autonomous onchain accounts:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPulseGridClearing {
    function executeAction(
        bytes32 agentId,
        address target,
        uint256 amount,
        bytes calldata data
    ) external returns (bytes memory);
}

contract AutonomousStrategy {
    IPulseGridClearing public immutable clearingHouse;
    bytes32 public immutable agentId;

    constructor(address _clearing, bytes32 _agentId) {
        clearingHouse = IPulseGridClearing(_clearing);
        agentId = _agentId;
    }

    function rebalance(address dex, uint256 amount, bytes calldata swapCalldata) external {
        // Enforces deterministic spending caps & allows only verified DEX targets
        clearingHouse.executeAction(agentId, dex, amount, swapCalldata);
    }
}
```

---

## Enforced Onchain Invariants

| Invariant | Error Code | Mitigation Behavior |
| :--- | :--- | :--- |
| **Max Single-Tx Cap** | `ERR_MAX_SINGLE_TX_EXCEEDED` | Reverts atomically before target call; auto-quarantines rogue agent |
| **Target Allowlist** | `ERR_TARGET_NOT_ALLOWLISTED` | Blocks unauthorized destination addresses ($0 drained) |
| **Rolling 1-Hour Velocity** | `ERR_HOURLY_VELOCITY_BREACHED` | Prevents high-frequency micro-draining across rolling window |
| **Emergency Circuit Breaker** | `ERR_GLOBAL_EMERGENCY_HALT` | Fail-closed global stop in high-volatility events |
| **Agent Operational Status** | `ERR_AGENT_NOT_ACTIVE` | Halts any subsequent actions from quarantined agents |

---

## Deployed Contracts on Monad Testnet (Chain ID: 10143)

- **PulseGridClearing:** [`0xF69164fEFE9f8ebD0757B3351F3d72cae8647f25`](https://testnet.monadscan.com/address/0xF69164fEFE9f8ebD0757B3351F3d72cae8647f25)
- **PulseGridFirewall:** [`0x0003d9b81E576f2a732b96b7d476C74459e99091`](https://testnet.monadscan.com/address/0x0003d9b81E576f2a732b96b7d476C74459e99091)
- **PulseGridRegistry:** [`0x904A4757c3c165Eaee2BE1449bdA7c36EC9CE63a`](https://testnet.monadscan.com/address/0x904A4757c3c165Eaee2BE1449bdA7c36EC9CE63a)
- **MockDEX Venue:** [`0xA3E444Ca0626df5d1843c450BCfDd28AD25a4A55`](https://testnet.monadscan.com/address/0xA3E444Ca0626df5d1843c450BCfDd28AD25a4A55)
- **MockUSDC Token:** [`0x3777D2Ce5cB782f3433a5042fAEBf524Ad29Aa52`](https://testnet.monadscan.com/address/0x3777D2Ce5cB782f3433a5042fAEBf524Ad29Aa52)

---

## License
MIT License. Built natively for Monad.
