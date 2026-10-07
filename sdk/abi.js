const CLEARING_ABI = [
  "function executeAction(bytes32 agentId, address target, uint256 amount, bytes calldata data) external returns (bytes memory)",
  "function actionNonce() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function firewall() external view returns (address)",
  "function registry() external view returns (address)",
  "event ActionCleared(bytes32 indexed agentId, address indexed target, uint256 amount, uint256 nonce, bytes32 receiptHash)",
  "event ActionQuarantined(bytes32 indexed agentId, address indexed target, uint256 amount, string reason)"
];

const FIREWALL_ABI = [
  "function verifyPolicy(bytes32 agentId, address target, uint256 amount) external view returns (bool, string memory)",
  "function isTargetAllowlisted(address target) external view returns (bool)",
  "function emergencyHalt() external view returns (bool)",
  "function getAgentHourlySpend(bytes32 agentId) external view returns (uint256)",
  "function getAgentHourlyLimit(bytes32 agentId) external view returns (uint256)",
  "function getAgentMaxSingleTx(bytes32 agentId) external view returns (uint256)"
];

const REGISTRY_ABI = [
  "function getAgent(bytes32 agentId) external view returns (address operator, address vault, uint8 tier, uint8 status, uint256 registeredAt)",
  "function isAgentActive(bytes32 agentId) external view returns (bool)",
  "function quarantineAgent(bytes32 agentId, string calldata reason) external",
  "function reactivateAgent(bytes32 agentId) external"
];

module.exports = {
  CLEARING_ABI,
  FIREWALL_ABI,
  REGISTRY_ABI
};
