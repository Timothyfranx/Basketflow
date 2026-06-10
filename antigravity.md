🧺 BasketFlow
One-Click DeFi Baskets for Everyone

Read this file completely before taking any action.
This is your entire project specification.
Everything you need is here. Nothing else matters.

🎯 Project Identity
Name: BasketFlow
Tagline: "DeFi made easy. One click. Real yields."
Emoji: 🧺 (basket)
Brand Message:
For people who want yield but don't want complexity. Not for degens. Not for power users. For everyone else.

🧠 What This Actually Is
BasketFlow removes the friction of DeFi liquidity provision on Mantle.

The Problem:
User has 1000 USDT -> Wants to earn yield on Mantle -> Sees Merchant Moe, Agni Finance, 5 different tokens -> Gets scared. Doesn't do it. Leaves.

The Solution:
User has 1000 USDT -> Clicks "Conservative Care Basket" -> One transaction. Done. Earning 12% APY. 

That's it. That's the entire product.

👥 Target User
Primary: People with crypto but no DeFi experience
- Have USDT/USDC sitting idle
- Heard about "yield farming" but intimidated
- Want to earn but can't be bothered to learn
- Age range: 25-50, non-technical

Secondary: Lazy power users
- Know DeFi but tired of 5-step manual swap/LP processes
- Would use this as a quick, brainless allocation tool
- Value time over slight APY optimization

NOT for: Hardcore degens, arbitrageurs, professional high-frequency traders

🧺 The Baskets (MVP)
You launch with 3 baskets. That's it. More later.

Basket 1: "Conservative Care"
- Allocation: 50% USDC + 50% mETH
- Target APY: 8-12% (Stablecoin + LST yields)
- Risk: Very low
- Message: "Safe, steady income. Sleep at night."

Basket 2: "Mantle Max"
- Allocation: 40% MNT + 30% mETH + 30% MOE
- Target APY: 18-25%
- Risk: Medium (Ecosystem token exposure)
- Message: "Mantle native. Higher returns. You picked the right chain."

Basket 3: "Stable Shuffle"
- Allocation: 50% USDC + 50% USDT
- Target APY: 4-7%
- Risk: Minimal (Pure stablecoins)
- Message: "The safest play. Literally just free money."

🔧 How It Works (Technical Flow)

User Flow
User lands on BasketFlow Frontend
        ↓
Connects wallet (Mantle Network - Chain ID: 5000)
        ↓
Sees 3 baskets with current live APYs
        ↓
Selects "Conservative Care" and inputs amount: "1000 USDT"
        ↓
Sees breakdown preview: "You will allocate ~$500 to USDC and ~$500 to mETH"
        ↓
Clicks "DEPOSIT"
        ↓
[SINGLE TRANSACTION SIGNED]
   - Smart contract receives 1000 USDT from user
   - Swaps input asset to exact basket token weights via Merchant Moe
   - Adds liquidity to Merchant Moe Liquidity Book pools
   - Mints and holds/transfers tracking proof back to user
        ↓
"✅ You're earning yield. Check back in 7 days."

On-Chain Routing Architecture
User Asset (USDC/USDT/MNT)
        ↓
[BasketFlow Smart Contract]
   ├─ Split funds based on basket weight rules
   ├─ Call Merchant Moe Swap router to match pair targets
   └─ Call Merchant Moe Liquidity Router (LBRouter)
        ↓
[Merchant Moe Liquidity Pools]
        ├─ LP Position (USDC / mETH)
        ├─ LP Position (MNT / mETH)
        └─ LP Position (USDC / USDT)

🏗️ What You Actually Need to Build

1. Smart Contract (Solidity)
Use the official Merchant Moe Router to manage splitting, swaps, and liquidity assignment. Passing `minOuts` parameters from the backend prevents frontrunning/sandwich attacks on-chain.

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMoeLBRouter {
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
}

contract BasketFlowVault {
    // Mantle Mainnet Hardcoded References
    address public constant MOE_ROUTER = 0x013e138EF6008ae5FDFDE29700e3f2Bc61d21E3a;
    address public constant mETH = 0xcDA86A272531e8640cD7F1a92c01839911B90bb0;

    struct Basket {
        string name;
        address[] targetTokens;
        uint[] weights; // Basis points (e.g. 5000 = 50%)
        address lpPool;
    }

    mapping(uint => Basket) public baskets;

    function depositToBasket(
        uint basketId,
        uint amountIn,
        address inputToken,
        uint[] calldata minOuts,
        uint deadline
    ) external {
        IERC20(inputToken).transferFrom(msg.sender, address(this), amountIn);
        // 1. Process allocations locally using weights
        // 2. Interact safely with MOE_ROUTER using pre-calculated minOuts
        // 3. Deploy assets to target pools and route tracking asset to msg.sender
    }

    function withdrawFromBasket(uint basketId, uint amountLP) external {
        // Reverse process: Remove LP, swap components to single target asset, return to user
    }
}

2. Frontend (React/Next.js)
Pages needed:
├─ Landing page (3 baskets clean layout grid)
├─ Basket detail page (Simple composition wheel chart, historical APY graph)
├─ Deposit flow card (Input field → Preview allocation breakdown → Submit button → Success screen)
├─ Dashboard (Current investment totals, simple dollar tracking updates)
└─ Leaderboard (Gamified layout ranking top yield addresses)

No complex UI animations. Clean, minimal, high contrast, mobile responsive colors.

3. Backend (Go or Node.js Engine)
Crucial to unburdening front-end performance:
├─ Chron Job (Hourly): Pull pool variables from Merchant Moe subgraph/contracts to update live APY metrics.
├─ Transaction Indexer: Track mint events from your vault contract to cache user positions in an optimized database.
├─ Quote API: Provide the frontend with accurate slippage and `minOuts` parameters immediately prior to transaction generation.
└─ Telegram Bot Integration: Optional sleek utility channel alerting users to weekly earnings milestones.

📅 7-Day Build Plan

Day 1 — Workspace Setup & Smart Contract Scaffold
[ ] Initialize execution sandbox (Foundry or Hardhat)
[ ] Code the baseline variables inside BasketFlowVault.sol
[ ] Import OpenZeppelin standard token helpers & Merchant Moe interfaces
[ ] Build structural unit test blocks verifying token acceptance
Done when: Contract successfully accepts an ERC20 transfer within your local forge testing suite.

Day 2 — Routing Logic Integration & Testnet Run
[ ] Implement multi-asset weight splitting math within the deposit loops
[ ] Code interaction endpoints to pass arrays directly into external routers
[ ] Handle execution testing on Mantle Sepolia Testnet
[ ] Implement basic error handling guarding against extreme market slippage
Done when: Calling depositToBasket on testnet completely returns an integrated LP position.

Day 3 — Frontend Core & Provider Adaption
[ ] Scaffold Next.js client environment
[ ] Establish branding design rules (Soft, friendly fintech themes)
[ ] Setup Wallet Integration engine (Wagmi + RainbowKit / WalletConnect)
[ ] Build static landing layout showcasing your 3 explicit baskets
Done when: User can interactively log into your app on mobile using common injected browsers.

Day 4 — Complete Transaction Forms & Backend Start
[ ] Build user deposit card components with live entry fields
[ ] Initialize your Go/Node.js microservice environment
[ ] Connect frontend form to compute exact `minOut` arrays utilizing backend quote estimations
[ ] Bind the primary "Deposit" confirmation UI button to sign and trigger wallet contract actions
Done when: Real inputs on your frontend correctly spark an EVM approval and execution request.

Day 5 — User Dashboard & Tracking Ledger
[ ] Formulate Dashboard view tracking connected user portfolio metrics
[ ] Leverage backend data syncs to calculate earned fees, removing complex math dependencies from front-end code
[ ] Wire the "Withdrawal" engine back to the smart contract interfaces
[ ] Construct the visual Leaderboard tab to trigger friendly competition dynamics
Done when: Dashboard precisely lists live position earnings updates instantly upon walllet recognition.

Day 6 — APY Automation Data Engines
[ ] Finalize backend automated cron workers querying DEX variables every 60 minutes
[ ] Deploy internal database updating active frontend text parameters based on contract outputs
[ ] Verify clean handling of all slippage alerts when executing basket calls
Done when: Your user interface dynamically updates APY targets cleanly without static code changes.

Day 7 — End-to-End Mainnet Audit & Release
[ ] Conduct complete local integration check-through on Mantle Mainnet
[ ] Eliminate unused development code or stray log print statements
[ ] Record project feature walkthrough presentation video (2-3 minutes)
[ ] Publish code state to public GitHub profile and submit official hackathon pitch profile
Done when: Real users can complete full cycles on a live public URL.

🎨 Branding & Wording Law
- Hero Title: "DeFi with zero complexity."
- Subtitle: "Pick a basket. Deposit once. Earn yield. That's it."
- Button Text Actions: Use "Deposit" instead of "Add Liquidity", use "Withdraw" instead of "Remove Liquidity", use "Earn" instead of "LP".
- Golden Rule: If a normal person (non-crypto) wouldn't understand it, change the wording.

🎯 Success Metrics
[ ] Vault logic running permanently on Mantle Mainnet
[ ] Live web domain serving the dApp cleanly on mobile and desktop
[ ] Front-end application executes multi-token splits and tracking updates inside 1 single user sign request
[ ] Secure performance validation: 0 broken console errors or failed routing transactions under normal market behavior

⚠️ Known Constraints
7 days is tight. Do not build: Multi-chain support, custom user-made portfolios, automated tax ledgers, or an integrated affiliate tracking platform. Keep the scope aggressively narrow.

🎬 Demo Script (Video Guide)
- [00:00-00:15]: App intro. "This is BasketFlow. DeFi made easy for normal people."
- [00:15-00:35]: Landing Page scan. Highlight the distinct yield targets for Conservative vs Max profiles.
- [00:35-00:55]: Live execution check. Input value into Conservative Care, trigger single wallet approval click, and watch transaction finality.
- [00:55-01:30]: Dashboard presentation. Point directly to the clean income metrics: "You earned $X this week."
- [01:30-02:00]: Showcase the gamified Leaderboard, highlight the exit flow via the clear "Withdraw" toggle, and wrap with the main pitch: "BasketFlow makes yield accessible to everyone."