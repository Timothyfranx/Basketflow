// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockERC20} from "./MockERC20.sol";

contract MockMoeRouter {
    address public lpToken;

    constructor(address _lpToken) {
        lpToken = _lpToken;
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        require(path.length >= 2, "Invalid path");
        address tokenIn = path[0];
        address tokenOut = path[path.length - 1];

        // Transfer tokenIn from caller
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Mint tokenOut to the receiver (assuming 1-to-1 swap for mock)
        uint256 amountOut = amountIn; // 1-to-1 swap simulation
        require(amountOut >= amountOutMin, "Slippage error in mock swap");

        MockERC20(tokenOut).mint(to, amountOut);

        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        amounts[path.length - 1] = amountOut;
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity) {
        // Transfer inputs from caller
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountADesired);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountBDesired);

        amountA = amountADesired;
        amountB = amountBDesired;
        liquidity = amountADesired + amountBDesired;

        require(amountA >= amountAMin, "Slippage token A in mock LP");
        require(amountB >= amountBMin, "Slippage token B in mock LP");

        // Mint LP tokens to the receiver
        MockERC20(lpToken).mint(to, liquidity);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB) {
        // Transfer LP tokens from caller
        IERC20(lpToken).transferFrom(msg.sender, address(this), liquidity);

        amountA = liquidity / 2;
        amountB = liquidity / 2;

        require(amountA >= amountAMin, "Slippage token A in remove mock LP");
        require(amountB >= amountBMin, "Slippage token B in remove mock LP");

        // Mint tokenA and tokenB back to receiver
        MockERC20(tokenA).mint(to, amountA);
        MockERC20(tokenB).mint(to, amountB);
    }
}
