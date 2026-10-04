# 11 Reusable Primitive & SDK Extraction

## Reusable Artifact: `@pulsegrid/firewall-sdk`

Beyond the standalone application, PulseGrid extracts a lightweight, reusable TypeScript / Solidity SDK that any autonomous agent developer on Monad can integrate into their existing codebase in 3 lines:

### Example Integration
```typescript
import { PulseGridGuard } from "@pulsegrid/sdk";

// Wrap your agent wallet with Monad parallel deterministic policy guard
const guard = new PulseGridGuard({
  agentId: "AGENT_MY_BOT",
  clearingAddress: "0xPulseGridClearingAddress",
  provider: monadProvider
});

// Intercepts before broadcast if policy is violated
const receipt = await guard.execute({
  target: "0xMockDEXAddress",
  amount: parseUnits("500", 6),
  callData: dexInterface.encodeFunctionData("swap", [...])
});
```

### Value to the Monad Ecosystem
- Gives every agent framework (Virtuals, Eliza, Wayfinder, LangChain) built-in, tamper-evident spending limits.
- Eliminates the need for each hackathon project to reinvent onchain policy firewalls from scratch.
