// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PulseGridRegistry.sol";

/**
 * @title PulseGridFirewall
 * @notice Deterministic onchain policy engine for high-frequency AI agents.
 * Validates spending limits, velocity windows, and authorized protocol targets.
 */
contract PulseGridFirewall {
    struct PolicyConfig {
        uint256 maxSingleTxAmount;    // Max allowed single transaction amount in base units
        uint256 windowSpendLimit;     // Max allowable spend in a rolling window
        uint256 windowDuration;       // Window size in seconds (e.g., 3600 for 1 hour)
        bool isCustomPolicy;          // If true, overrides default tier policy
    }

    struct VelocityState {
        uint256 windowStart;
        uint256 spentInCurrentWindow;
        uint256 lastActionTimestamp;
    }

    address public owner;
    PulseGridRegistry public registry;
    address public clearingHouse;

    // Default policy rules per risk tier (1 = Low, 2 = Medium, 3 = High)
    mapping(uint256 => PolicyConfig) public tierDefaults;
    // Custom per-agent policy overrides
    mapping(bytes32 => PolicyConfig) public agentCustomPolicies;
    // Rolling velocity tracking per agent
    mapping(bytes32 => VelocityState) public velocityStates;
    // Target contract address allowlist (target => isAllowed)
    mapping(address => bool) public allowedTargets;
    // Emergency global freeze
    bool public emergencyHalt;

    event PolicyUpdated(bytes32 indexed agentId, uint256 maxSingleTx, uint256 windowLimit);
    event TargetAllowed(address indexed target, bool allowed);
    event AnomalyIntercepted(bytes32 indexed agentId, address indexed target, uint256 amount, string reason);
    event EmergencyHaltToggled(bool isHalted);

    modifier onlyOwner() {
        require(msg.sender == owner, "PulseGridFirewall: Not owner");
        _;
    }

    modifier onlyClearingHouse() {
        require(msg.sender == clearingHouse || msg.sender == owner, "PulseGridFirewall: Unauthorized caller");
        _;
    }

    constructor(address _registry) {
        owner = msg.sender;
        registry = PulseGridRegistry(_registry);

        // Tier 1: Conservative / Micro-Payments
        tierDefaults[1] = PolicyConfig({
            maxSingleTxAmount: 500 * 1e6,      // 500 USDC
            windowSpendLimit: 2500 * 1e6,      // 2,500 USDC / hr
            windowDuration: 3600,
            isCustomPolicy: true
        });

        // Tier 2: Standard Trading / Market Making
        tierDefaults[2] = PolicyConfig({
            maxSingleTxAmount: 10_000 * 1e6,   // 10,000 USDC
            windowSpendLimit: 50_000 * 1e6,    // 50,000 USDC / hr
            windowDuration: 3600,
            isCustomPolicy: true
        });

        // Tier 3: High-Frequency Arbitrage / Flash Vault
        tierDefaults[3] = PolicyConfig({
            maxSingleTxAmount: 100_000 * 1e6,  // 100,000 USDC
            windowSpendLimit: 500_000 * 1e6,   // 500,000 USDC / hr
            windowDuration: 3600,
            isCustomPolicy: true
        });
    }

    function setClearingHouse(address _clearingHouse) external onlyOwner {
        clearingHouse = _clearingHouse;
    }

    function setTargetAllowed(address target, bool allowed) external onlyOwner {
        require(target != address(0), "Invalid target address");
        allowedTargets[target] = allowed;
        emit TargetAllowed(target, allowed);
    }

    function setAgentCustomPolicy(
        bytes32 agentId,
        uint256 maxSingleTx,
        uint256 windowLimit,
        uint256 windowDuration
    ) external onlyOwner {
        agentCustomPolicies[agentId] = PolicyConfig({
            maxSingleTxAmount: maxSingleTx,
            windowSpendLimit: windowLimit,
            windowDuration: windowDuration,
            isCustomPolicy: true
        });
        emit PolicyUpdated(agentId, maxSingleTx, windowLimit);
    }

    function toggleEmergencyHalt(bool halt) external onlyOwner {
        emergencyHalt = halt;
        emit EmergencyHaltToggled(halt);
    }

    /**
     * @notice Pure deterministic verification of an agent's proposed action.
     * @return allowed True if compliant with all risk boundaries, false otherwise.
     * @return reason Human and machine-readable failure reason if rejected.
     */
    function verifyAction(
        bytes32 agentId,
        address target,
        uint256 amount
    ) external view returns (bool allowed, string memory reason) {
        if (emergencyHalt) {
            return (false, "ERR_GLOBAL_EMERGENCY_HALT");
        }

        PulseGridRegistry.AgentProfile memory agent = registry.getAgent(agentId);
        if (agent.status != PulseGridRegistry.AgentStatus.Active) {
            return (false, "ERR_AGENT_NOT_ACTIVE");
        }

        if (!allowedTargets[target]) {
            return (false, "ERR_TARGET_NOT_ALLOWLISTED");
        }

        PolicyConfig memory policy = getActivePolicy(agentId, agent.riskTier);

        if (amount > policy.maxSingleTxAmount) {
            return (false, "ERR_MAX_SINGLE_TX_EXCEEDED");
        }

        VelocityState memory state = velocityStates[agentId];
        uint256 currentWindowSpent = state.spentInCurrentWindow;
        if (block.timestamp >= state.windowStart + policy.windowDuration) {
            currentWindowSpent = 0;
        }

        if (currentWindowSpent + amount > policy.windowSpendLimit) {
            return (false, "ERR_HOURLY_VELOCITY_BREACHED");
        }

        return (true, "OK_COMPLIANT");
    }

    /**
     * @notice Updates rolling spend velocity upon confirmed execution.
     */
    function recordSpent(bytes32 agentId, uint256 amount) external onlyClearingHouse {
        PulseGridRegistry.AgentProfile memory agent = registry.getAgent(agentId);
        PolicyConfig memory policy = getActivePolicy(agentId, agent.riskTier);
        VelocityState storage state = velocityStates[agentId];

        if (block.timestamp >= state.windowStart + policy.windowDuration) {
            state.windowStart = block.timestamp;
            state.spentInCurrentWindow = amount;
        } else {
            state.spentInCurrentWindow += amount;
        }
        state.lastActionTimestamp = block.timestamp;
    }

    function getActivePolicy(bytes32 agentId, uint256 riskTier) public view returns (PolicyConfig memory) {
        if (agentCustomPolicies[agentId].isCustomPolicy) {
            return agentCustomPolicies[agentId];
        }
        return tierDefaults[riskTier];
    }
}
