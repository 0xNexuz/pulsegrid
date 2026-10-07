const { ethers } = require("ethers");
const { PULSEGRID_CONTRACTS, MONAD_TESTNET_RPC, MONAD_TESTNET_EXPLORER, KNOWN_ERROR_CODES } = require("./constants");
const { CLEARING_ABI, FIREWALL_ABI, REGISTRY_ABI } = require("./abi");

class PulseGridGuard {
  constructor(config) {
    if (!config || !config.agentId) {
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

  formatBytes32(text) {
    if (text.startsWith("0x") && text.length === 66) {
      return text;
    }
    return ethers.encodeBytes32String(text.slice(0, 31));
  }

  initContracts() {
    const runner = this.signer || this.provider;
    this.clearingContract = new ethers.Contract(this.clearingAddress, CLEARING_ABI, runner);
    this.firewallContract = new ethers.Contract(this.firewallAddress, FIREWALL_ABI, this.provider);
    this.registryContract = new ethers.Contract(this.registryAddress, REGISTRY_ABI, this.provider);
  }

  async preflightCheck(params) {
    try {
      if (!this.firewallContract || !this.registryContract) {
        return { passed: true };
      }

      const isActive = await this.registryContract.isAgentActive(this.agentIdBytes32);
      if (!isActive) {
        return {
          passed: false,
          code: "ERR_AGENT_NOT_ACTIVE",
          reason: KNOWN_ERROR_CODES.ERR_AGENT_NOT_ACTIVE
        };
      }

      const isAllowlisted = await this.firewallContract.isTargetAllowlisted(params.target);
      if (!isAllowlisted) {
        return {
          passed: false,
          code: "ERR_TARGET_NOT_ALLOWLISTED",
          reason: KNOWN_ERROR_CODES.ERR_TARGET_NOT_ALLOWLISTED
        };
      }

      const isHalted = await this.firewallContract.emergencyHalt();
      if (isHalted) {
        return {
          passed: false,
          code: "ERR_GLOBAL_EMERGENCY_HALT",
          reason: KNOWN_ERROR_CODES.ERR_GLOBAL_EMERGENCY_HALT
        };
      }

      return { passed: true };
    } catch (err) {
      return { passed: true };
    }
  }

  async execute(params) {
    if (!this.signer) {
      throw new Error("PulseGridGuard execution requires a connected Signer with MON on Monad Testnet.");
    }

    const preflight = await this.preflightCheck(params);
    if (!preflight.passed) {
      throw new Error(`[PulseGrid Guard Rejection] ${preflight.code}: ${preflight.reason}`);
    }

    const target = params.target;
    const amount = typeof params.amount === "bigint" ? params.amount : BigInt(params.amount);
    const callData = params.callData || "0x";

    const tx = await this.clearingContract.executeAction(
      this.agentIdBytes32,
      target,
      amount,
      callData,
      params.gasLimit ? { gasLimit: params.gasLimit } : {}
    );

    const receipt = await tx.wait();

    let receiptHash = tx.hash;
    for (const log of receipt.logs) {
      try {
        const parsed = this.clearingContract.interface.parseLog(log);
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

  encodeExecuteCalldata(target, amount, callData = "0x") {
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

module.exports = {
  PulseGridGuard
};
