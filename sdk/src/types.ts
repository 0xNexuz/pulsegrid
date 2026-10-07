export interface AgentRiskConfig {
  tier: number;
  maxSingleSpend: bigint;
  rollingWindowLimit: bigint;
  allowlistedTargets: string[];
}

export interface PulseGridGuardConfig {
  agentId: string;
  clearingAddress?: string;
  firewallAddress?: string;
  registryAddress?: string;
  rpcUrl?: string;
  signer?: any;
}

export interface ExecuteActionParams {
  target: string;
  amount: bigint | number | string;
  callData?: string;
  gasLimit?: bigint | number;
}

export interface PreflightCheckResult {
  passed: boolean;
  code?: string;
  reason?: string;
}

export interface ExecutionReceipt {
  success: boolean;
  txHash: string;
  blockNumber: number;
  agentId: string;
  target: string;
  amount: string;
  receiptHash: string;
  gasUsed?: bigint;
  explorerUrl: string;
}
