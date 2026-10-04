// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PulseGridRegistry.sol";
import "./PulseGridFirewall.sol";

/**
 * @title PulseGridClearing
 * @notice High-performance clearinghouse and execution kernel for Monad.
 * Processes high-frequency agent actions with deterministic firewall checks,
 * non-reentrant state locks, and generates tamper-evident onchain execution receipts.
 */
contract PulseGridClearing {
    struct AgentAction {
        bytes32 agentId;
        address target;
        uint256 amount;
        bytes callData;
    }

    struct ExecutionReceipt {
        bytes32 receiptHash;
        bytes32 agentId;
        address target;
        uint256 amount;
        bool cleared;
        string reason;
        uint256 blockNumber;
        uint256 timestamp;
    }

    PulseGridRegistry public immutable registry;
    PulseGridFirewall public immutable firewall;
    address public owner;

    // Reentrancy lock
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    // Track total volume cleared across all agents
    uint256 public totalVolumeCleared;
    uint256 public totalActionsProcessed;
    uint256 public totalActionsQuarantined;

    event ActionCleared(
        bytes32 indexed receiptHash,
        bytes32 indexed agentId,
        address indexed target,
        uint256 amount,
        uint256 blockNumber,
        uint256 timestamp
    );

    event ActionQuarantined(
        bytes32 indexed receiptHash,
        bytes32 indexed agentId,
        address indexed target,
        uint256 amount,
        string reason,
        uint256 timestamp
    );

    event ActionExecutionFailed(
        bytes32 indexed receiptHash,
        bytes32 indexed agentId,
        address indexed target,
        uint256 amount,
        string reason,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "PulseGridClearing: Not owner");
        _;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "PulseGridClearing: Reentrancy guard triggered");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor(address _registry, address _firewall) {
        owner = msg.sender;
        registry = PulseGridRegistry(_registry);
        firewall = PulseGridFirewall(_firewall);
        _status = _NOT_ENTERED;
    }

    /**
     * @notice Executes a single agent action with deterministic firewall verification and reentrancy defense.
     */
    function executeAction(
        bytes32 agentId,
        address target,
        uint256 amount,
        bytes calldata callData
    ) external nonReentrant returns (bool cleared, bytes memory returnData, bytes32 receiptHash) {
        return _processAction(agentId, target, amount, callData);
    }

    /**
     * @notice Executes a batch of agent actions concurrently in Monad parallel slots.
     */
    function executeBatch(
        AgentAction[] calldata actions
    ) external nonReentrant returns (ExecutionReceipt[] memory receipts) {
        receipts = new ExecutionReceipt[](actions.length);
        for (uint256 i = 0; i < actions.length; i++) {
            (bool cleared, , bytes32 receiptHash) = _processAction(
                actions[i].agentId,
                actions[i].target,
                actions[i].amount,
                actions[i].callData
            );

            receipts[i] = ExecutionReceipt({
                receiptHash: receiptHash,
                agentId: actions[i].agentId,
                target: actions[i].target,
                amount: actions[i].amount,
                cleared: cleared,
                reason: cleared ? "OK_COMPLIANT" : "QUARANTINED",
                blockNumber: block.number,
                timestamp: block.timestamp
            });
        }
    }

    function _processAction(
        bytes32 agentId,
        address target,
        uint256 amount,
        bytes calldata callData
    ) internal returns (bool cleared, bytes memory returnData, bytes32 receiptHash) {
        totalActionsProcessed++;

        (bool allowed, string memory reason) = firewall.verifyAction(agentId, target, amount);

        receiptHash = keccak256(
            abi.encodePacked(
                agentId,
                target,
                amount,
                block.timestamp,
                block.number,
                totalActionsProcessed,
                allowed
            )
        );

        if (!allowed) {
            totalActionsQuarantined++;
            // Auto-quarantine the agent in the registry for critical breach attempts
            registry.setAgentStatus(agentId, PulseGridRegistry.AgentStatus.Quarantined, reason);

            emit ActionQuarantined(receiptHash, agentId, target, amount, reason, block.timestamp);
            return (false, "", receiptHash);
        }

        // Dispatch call to target contract if allowed
        if (target != address(0) && callData.length > 0) {
            bool success;
            (success, returnData) = target.call(callData);
            if (!success) {
                // Low-level call failed (e.g. slippage or pool error)
                // Emit audit receipt without debiting spend velocity
                emit ActionExecutionFailed(receiptHash, agentId, target, amount, "ERR_TARGET_CALL_REVERTED", block.timestamp);
                return (false, returnData, receiptHash);
            }
        }

        // Record spent velocity in the firewall only after confirmed success
        firewall.recordSpent(agentId, amount);
        registry.incrementClearedActions(agentId);
        totalVolumeCleared += amount;

        emit ActionCleared(receiptHash, agentId, target, amount, block.number, block.timestamp);
        return (true, returnData, receiptHash);
    }
}
