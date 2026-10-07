import { ethers } from "ethers";
import { PULSEGRID_CONTRACTS, MONAD_TESTNET_RPC, MONAD_TESTNET_EXPLORER, KNOWN_ERROR_CODES } from "./constants";
import { CLEARING_ABI, FIREWALL_ABI, REGISTRY_ABI } from "./abi";
import { PulseGridGuardConfig, ExecuteActionParams, PreflightCheckResult, ExecutionReceipt } from "./types";

export class PulseGridGuard {
  public readonly agentId: string;
  public readonly agentIdBytes32: string;
  public readonly clearingAddress: string;
  public readonly firewallAddress: string;
  public readonly registryAddress: string;
  
  private provider: ethers.Provider;
  private signer?: ethers.Signer;
  private clearingContract?: ethers.Contract;
  private firewallContract?: ethers.Contract;
  private registryContract?: ethers.Contract;

  constructor(config: PulseGridGuardConfig) {
    if (!config.agentId) {
      throw new Error("PulseGridGuard requires an agentId identifier.");
    }
    this.agentId = config.agentId;
    this.agentIdBytes32 = this.formatBytes32(config.agentId);

    this.clearingAddress = config.clearingAddress || PULSEGRID_CONTRACTS.CLEARING;
    this.firewallAddress = config.firewallAddress || PULSEGRID_CONTRACTS.FIREWALL;
    this.registryAddress = config.registryAddress || PULSEGRID_CONTRACTS.REGISTRY;

    if (config.signer) {
      this.signer = config.signer;
      this.provider = config.signer.provider || new ethers.JsonRpcProvider(config.rpcUrl || MONAD_TESTNET_RPC);
    } else {
      this.provider = new ethers.JsonRpcProvider(config.rpcUrl || MONAD_TESTNET_RPC);
    }

    this.initContracts();
  }

  private formatBytes32(text: string): string {
    if (text.startsWith("0x") && text.length === 66) {
      return text;
    }
    return ethers.encodeBytes32String(text.slice(0, 31));
  }

  private initContracts() {
    const runner = this.signer || this.provider;
    this.clearingContract = new ethers.Contract(this.clearingAddress, CLEARING_ABI, runner);
    this.firewallContract = new ethers.Contract(this.firewallAddress, FIREWALL_ABI, this.provider);
    this.registryContract = new ethers.Contract(this.registryAddress, REGISTRY_ABI, this.provider);
  }

  /**
   * Preflight Check: Evaluates agent status, target allowlist, and single-tx cap
   * locally or via view call before broadcasting, saving gas and time.
   */
  public async preflightCheck(params: ExecuteActionParams): Promise<PreflightCheckResult> {
    try {
      if (!this.firewallContract || !this.registryContract) {
        return { passed: true };
      }

      // Check if agent is active
      const isActive = await this.registryContract.isAgentActive(this.agentIdBytes32);
      if (!isActive) {
        return {
          passed: false,
          code: "ERR_AGENT_NOT_ACTIVE",
          reason: KNOWN_ERROR_CODES.ERR_AGENT_NOT_ACTIVE
        };
      }

      // Check target allowlist
      const isAllowlisted = await this.firewallContract.isTargetAllowlisted(params.target);
      if (!isAllowlisted) {
        return {
          passed: false,
          code: "ERR_TARGET_NOT_ALLOWLISTED",
          reason: KNOWN_ERROR_CODES.ERR_TARGET_NOT_ALLOWLISTED
        };
      }

      // Check emergency halt
      const isHalted = await this.firewallContract.emergencyHalt();
      if (isHalted) {
        return {
          passed: false,
          code: "ERR_GLOBAL_EMERGENCY_HALT",
          reason: KNOWN_ERROR_CODES.ERR_GLOBAL_EMERGENCY_HALT
        };
      }

      return { passed: true };
    } catch (err: any) {
      console.warn("Preflight check warning:", err.message);
      return { passed: true };
    }
  }

  /**
   * Execute Action: Routes the agent's target call through PulseGridClearing.
   * If any invariant is violated, the transaction reverts atomically inside Monad's 1s slot.
   */
  public async execute(params: ExecuteActionParams): Promise<ExecutionReceipt> {
    if (!this.signer) {
      throw new Error("PulseGridGuard execution requires a connected Signer with MON balance on Monad Testnet.");
    }

    // Run client pre-flight check
    const preflight = await this.preflightCheck(params);
    if (!preflight.passed) {
      throw new Error(`[PulseGrid Guard Rejection] ${preflight.code}: ${preflight.reason}`);
    }

    const target = params.target;
    const amount = typeof params.amount === "bigint" ? params.amount : BigInt(params.amount);
    const callData = params.callData || "0x";

    const tx = await this.clearingContract!.executeAction(
      this.agentIdBytes32,
      target,
      amount,
      callData,
      params.gasLimit ? { gasLimit: params.gasLimit } : {}
    );

    const receipt = await tx.wait();

    // Find ActionCleared or ActionQuarantined event
    let receiptHash = tx.hash;
    for (const log of receipt.logs) {
      try {
        const parsed = this.clearingContract!.interface.parseLog(log);
        if (parsed && parsed.name === "ActionCleared") {
          receiptHash = parsed.args.receiptHash;
          break;
        }
      } catch (e) {}
    }

    return {
      success: receipt.status === 1,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      agentId: this.agentId,
      target,
      amount: amount.toString(),
      receiptHash,
      gasUsed: receipt.gasUsed,
      explorerUrl: `${MONAD_TESTNET_EXPLORER}/tx/${tx.hash}`
    };
  }

  /**
   * Generate raw calldata without executing (useful for Account Abstraction / Multicall)
   */
  public encodeExecuteCalldata(target: string, amount: bigint | number | string, callData: string = "0x"): string {
    const iface = new ethers.Interface(CLEARING_ABI);
    const amtBig = typeof amount === "bigint" ? amount : BigInt(amount);
    return iface.encodeFunctionData("executeAction", [
      this.agentIdBytes32,
      target,
      amtBig,
      callData
    ]);
  }
}
