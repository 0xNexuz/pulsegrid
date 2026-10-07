/**
 * Official PulseGrid Protocol Deployments on Monad Testnet (Chain ID 10143)
 */
export const MONAD_TESTNET_CHAIN_ID = 10143;
export const MONAD_TESTNET_RPC = "https://testnet-rpc.monad.xyz";
export const MONAD_TESTNET_EXPLORER = "https://testnet.monadscan.com";

export const PULSEGRID_CONTRACTS = {
  CLEARING: "0xF69164fEFE9f8ebD0757B3351F3d72cae8647f25",
  FIREWALL: "0x0003d9b81E576f2a732b96b7d476C74459e99091",
  REGISTRY: "0x904A4757c3c165Eaee2BE1449bdA7c36EC9CE63a",
  MOCK_DEX: "0xA3E444Ca0626df5d1843c450BCfDd28AD25a4A55",
  MOCK_USDC: "0x3777D2Ce5cB782f3433a5042fAEBf524Ad29Aa52",
  DEPLOYER: "0x4203A9A0bF96d007939eBFD08b33c23AD7DE1683"
} as const;

export const KNOWN_ERROR_CODES = {
  ERR_MAX_SINGLE_TX_EXCEEDED: "Action amount exceeds tier max single transaction limit",
  ERR_TARGET_NOT_ALLOWLISTED: "Target contract address is not allowlisted in firewall",
  ERR_HOURLY_VELOCITY_BREACHED: "Agent rolling hourly spending limit exceeded",
  ERR_GLOBAL_EMERGENCY_HALT: "Global protocol emergency circuit breaker is active",
  ERR_AGENT_NOT_ACTIVE: "Agent is currently Quarantined or unregistered",
  ERR_TARGET_CALL_REVERTED: "Downstream target contract execution reverted",
  ERR_REENTRANCY_GUARD: "Reentrancy detected and blocked"
} as const;
