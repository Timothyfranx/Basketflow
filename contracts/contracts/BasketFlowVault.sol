// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

interface IMoeRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);
}

/**
 * @title BasketFlowVault
 * @notice An ERC4626 vault wrapping Merchant Moe Classic LP tokens.
 * Supports depositing and withdrawing in user-specified tokens (like USDT)
 * by doing on-chain swaps and liquidity management in a single transaction.
 */
contract BasketFlowVault is ERC4626, Ownable {
    using SafeERC20 for IERC20;
    using Math for uint256;

    address public immutable tokenA;
    address public immutable tokenB;
    address public immutable router;

    event LogDepositWithERC20(
        address indexed user,
        address indexed inputToken,
        uint256 amountIn,
        uint256 lpAmount,
        uint256 sharesMinted
    );

    event LogWithdrawToERC20(
        address indexed user,
        address indexed outputToken,
        uint256 sharesBurned,
        uint256 lpAmount,
        uint256 amountOut
    );

    constructor(
        IERC20 _lpToken,
        string memory _name,
        string memory _symbol,
        address _router,
        address _tokenA,
        address _tokenB
    ) ERC4626(_lpToken) ERC20(_name, _symbol) Ownable(msg.sender) {
        require(_router != address(0), "Invalid router");
        require(_tokenA != address(0), "Invalid token A");
        require(_tokenB != address(0), "Invalid token B");
        router = _router;
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    /**
     * @notice Deposit user token (e.g. USDT) to receive vault shares.
     * @param inputToken The token being deposited by the user.
     * @param amountIn The amount of inputToken to deposit.
     * @param minShares The minimum amount of shares to receive (slippage check).
     * @param pathA The swap path from inputToken to tokenA.
     * @param pathB The swap path from inputToken to tokenB.
     * @param amountAMin The minimum tokenA to receive from swapping.
     * @param amountBMin The minimum tokenB to receive from swapping.
     * @param amountAMinPool The minimum tokenA to add to the LP pool.
     * @param amountBMinPool The minimum tokenB to add to the LP pool.
     * @param deadline The transaction deadline.
     * @return shares The amount of shares minted.
     */
    function depositWithERC20(
        address inputToken,
        uint256 amountIn,
        uint256 minShares,
        address[] calldata pathA,
        address[] calldata pathB,
        uint256 amountAMin,
        uint256 amountBMin,
        uint256 amountAMinPool,
        uint256 amountBMinPool,
        uint256 deadline
    ) external returns (uint256 shares) {
        require(amountIn > 0, "Amount must be > 0");

        // 1. Transfer input token to this contract
        IERC20(inputToken).safeTransferFrom(msg.sender, address(this), amountIn);

        // 2. Split input token in half
        uint256 amountAIn = amountIn / 2;
        uint256 amountBIn = amountIn - amountAIn;

        // 3. Approve router to spend input token
        IERC20(inputToken).approve(router, 0);
        IERC20(inputToken).approve(router, amountIn);

        // 4. Swap to Token A
        if (inputToken != tokenA) {
            require(pathA.length >= 2, "Invalid path A");
            require(pathA[0] == inputToken && pathA[pathA.length - 1] == tokenA, "Path A mismatch");
            IMoeRouter(router).swapExactTokensForTokens(
                amountAIn,
                amountAMin,
                pathA,
                address(this),
                deadline
            );
        }

        // 5. Swap to Token B
        if (inputToken != tokenB) {
            require(pathB.length >= 2, "Invalid path B");
            require(pathB[0] == inputToken && pathB[pathB.length - 1] == tokenB, "Path B mismatch");
            IMoeRouter(router).swapExactTokensForTokens(
                amountBIn,
                amountBMin,
                pathB,
                address(this),
                deadline
            );
        }

        // 6. Add liquidity to Moe Pool
        uint256 balA = IERC20(tokenA).balanceOf(address(this));
        uint256 balB = IERC20(tokenB).balanceOf(address(this));

        IERC20(tokenA).approve(router, 0);
        IERC20(tokenA).approve(router, balA);
        IERC20(tokenB).approve(router, 0);
        IERC20(tokenB).approve(router, balB);

        uint256 lpBalanceBefore = IERC20(asset()).balanceOf(address(this));
        
        IMoeRouter(router).addLiquidity(
            tokenA,
            tokenB,
            balA,
            balB,
            amountAMinPool,
            amountBMinPool,
            address(this),
            deadline
        );

        uint256 lpBalanceAfter = IERC20(asset()).balanceOf(address(this));
        uint256 lpAmount = lpBalanceAfter - lpBalanceBefore;
        require(lpAmount > 0, "No LP tokens received");

        // 7. Calculate shares to mint based on the LP balance BEFORE the deposit
        shares = lpAmount.mulDiv(totalSupply() + 1, lpBalanceBefore + 1, Math.Rounding.Floor);
        require(shares >= minShares, "Slippage: shares output too low");

        // 8. Mint shares to caller directly
        _mint(msg.sender, shares);
        emit Deposit(msg.sender, msg.sender, lpAmount, shares);

        // 9. Return leftovers if any
        _returnLeftovers(inputToken);

        emit LogDepositWithERC20(msg.sender, inputToken, amountIn, lpAmount, shares);
    }

    /**
     * @notice Withdraw vault shares and receive user token (e.g. USDT).
     * @param shares The amount of shares to burn.
     * @param outputToken The token the user wants to receive.
     * @param minAmountA The minimum tokenA to receive when removing liquidity.
     * @param minAmountB The minimum tokenB to receive when removing liquidity.
     * @param pathA The swap path from tokenA to outputToken.
     * @param pathB The swap path from tokenB to outputToken.
     * @param amountAMinOut The minimum outputToken to receive from swapping tokenA.
     * @param amountBMinOut The minimum outputToken to receive from swapping tokenB.
     * @param minOutputOut The minimum outputToken total to receive (slippage check).
     * @param deadline The transaction deadline.
     * @return amountOut The total amount of outputToken returned to user.
     */
    function withdrawToERC20(
        uint256 shares,
        address outputToken,
        uint256 minAmountA,
        uint256 minAmountB,
        address[] calldata pathA,
        address[] calldata pathB,
        uint256 amountAMinOut,
        uint256 amountBMinOut,
        uint256 minOutputOut,
        uint256 deadline
    ) external returns (uint256 amountOut) {
        require(shares > 0, "Shares must be > 0");

        // 1. Calculate LP tokens to redeem
        uint256 lpAmount = previewRedeem(shares);

        // 2. Burn shares and emit Withdraw event
        _burn(msg.sender, shares);
        emit Withdraw(msg.sender, msg.sender, msg.sender, lpAmount, shares);

        // 3. Approve router to spend LP tokens
        IERC20(asset()).approve(router, 0);
        IERC20(asset()).approve(router, lpAmount);

        // 4. Remove liquidity
        (uint256 amountA, uint256 amountB) = IMoeRouter(router).removeLiquidity(
            tokenA,
            tokenB,
            lpAmount,
            minAmountA,
            minAmountB,
            address(this),
            deadline
        );

        // 5. Swap Token A -> Output Token
        if (tokenA != outputToken) {
            require(pathA.length >= 2, "Invalid path A");
            require(pathA[0] == tokenA && pathA[pathA.length - 1] == outputToken, "Path A mismatch");
            
            IERC20(tokenA).approve(router, 0);
            IERC20(tokenA).approve(router, amountA);

            IMoeRouter(router).swapExactTokensForTokens(
                amountA,
                amountAMinOut,
                pathA,
                address(this),
                deadline
            );
        }

        // 6. Swap Token B -> Output Token
        if (tokenB != outputToken) {
            require(pathB.length >= 2, "Invalid path B");
            require(pathB[0] == tokenB && pathB[pathB.length - 1] == outputToken, "Path B mismatch");

            IERC20(tokenB).approve(router, 0);
            IERC20(tokenB).approve(router, amountB);

            IMoeRouter(router).swapExactTokensForTokens(
                amountB,
                amountBMinOut,
                pathB,
                address(this),
                deadline
            );
        }

        // 7. Transfer total output tokens to caller
        amountOut = IERC20(outputToken).balanceOf(address(this));
        require(amountOut >= minOutputOut, "Slippage: output token too low");

        IERC20(outputToken).safeTransfer(msg.sender, amountOut);

        // 8. Return leftovers if any
        _returnLeftovers(outputToken);

        emit LogWithdrawToERC20(msg.sender, outputToken, shares, lpAmount, amountOut);
    }

    /**
     * @dev Internal helper to return any residual dust tokens left in the contract back to user.
     */
    function _returnLeftovers(address inputOrOutputToken) internal {
        // Send back leftovers of tokenA, tokenB, and the input/output token
        address[3] memory tokens = [tokenA, tokenB, inputOrOutputToken];
        for (uint8 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            if (token != address(0)) {
                uint256 bal = IERC20(token).balanceOf(address(this));
                if (bal > 0) {
                    IERC20(token).safeTransfer(msg.sender, bal);
                }
            }
        }
    }
}
