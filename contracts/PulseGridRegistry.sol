// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PulseGridRegistry
 * @notice Manages verified AI Agent identities, operator permissions, and risk tiers on Monad.
 */
contract PulseGridRegistry {
    enum AgentStatus { Inactive, Active, Quarantined, Suspended }

    struct AgentProfile {
        bytes32 agentId;
        string name;
        address operator;
        address vault;
        AgentStatus status;
        uint256 riskTier; // 1 = Low Risk, 2 = Medium Risk, 3 = High Risk/Degen
        uint256 registeredAt;
        uint256 totalActionsCleared;
    }

    address public owner;
    address public clearingHouse;

    mapping(bytes32 => AgentProfile) public agents;
    bytes32[] public agentIds;
    mapping(address => bytes32) public operatorToAgent;

    event AgentRegistered(bytes32 indexed agentId, string name, address indexed operator, address vault, uint256 riskTier);
    event AgentStatusChanged(bytes32 indexed agentId, AgentStatus previousStatus, AgentStatus newStatus, string reason);
    event AgentActionRecorded(bytes32 indexed agentId, uint256 totalCleared);

    modifier onlyOwner() {
        require(msg.sender == owner, "PulseGridRegistry: Caller is not owner");
        _;
    }

    modifier onlyClearingHouse() {
        require(msg.sender == clearingHouse || msg.sender == owner, "PulseGridRegistry: Unauthorized clearinghouse");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setClearingHouse(address _clearingHouse) external onlyOwner {
        require(_clearingHouse != address(0), "Invalid address");
        clearingHouse = _clearingHouse;
    }

    function registerAgent(
        bytes32 agentId,
        string calldata name,
        address operator,
        address vault,
        uint256 riskTier
    ) external onlyOwner {
        require(agents[agentId].registeredAt == 0, "Agent already registered");
        require(operator != address(0), "Invalid operator");
        require(vault != address(0), "Invalid vault");

        agents[agentId] = AgentProfile({
            agentId: agentId,
            name: name,
            operator: operator,
            vault: vault,
            status: AgentStatus.Active,
            riskTier: riskTier,
            registeredAt: block.timestamp,
            totalActionsCleared: 0
        });

        agentIds.push(agentId);
        operatorToAgent[operator] = agentId;

        emit AgentRegistered(agentId, name, operator, vault, riskTier);
    }

    function setAgentStatus(bytes32 agentId, AgentStatus newStatus, string calldata reason) external onlyClearingHouse {
        require(agents[agentId].registeredAt > 0, "Agent not found");
        AgentStatus prev = agents[agentId].status;
        agents[agentId].status = newStatus;
        emit AgentStatusChanged(agentId, prev, newStatus, reason);
    }

    function incrementClearedActions(bytes32 agentId) external onlyClearingHouse {
        require(agents[agentId].registeredAt > 0, "Agent not found");
        agents[agentId].totalActionsCleared += 1;
        emit AgentActionRecorded(agentId, agents[agentId].totalActionsCleared);
    }

    function getAgent(bytes32 agentId) external view returns (AgentProfile memory) {
        require(agents[agentId].registeredAt > 0, "Agent not found");
        return agents[agentId];
    }

    function getAllAgentIds() external view returns (bytes32[] memory) {
        return agentIds;
    }

    function totalAgents() external view returns (uint256) {
        return agentIds.length;
    }
}
