// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MockUSDC.sol";

contract MockDEX {
    MockUSDC public usdc;
    uint256 public totalTradesExecuted;
    uint256 public totalVolumeTraded;

    event SwapExecuted(address indexed sender, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);

    constructor(address _usdc) {
        usdc = MockUSDC(_usdc);
    }

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut) {
        require(amountIn > 0, "Invalid amountIn");
        totalTradesExecuted++;
        totalVolumeTraded += amountIn;

        // Simulated 1:1 price minus 0.05% fee
        amountOut = (amountIn * 9995) / 10000;
        require(amountOut >= minAmountOut, "Slippage tolerance exceeded");

        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
        return amountOut;
    }
}
