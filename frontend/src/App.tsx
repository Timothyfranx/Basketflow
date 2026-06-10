import { useState, useEffect, memo } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  Award, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle, 
  RefreshCw, 
  Lock, 
  ArrowLeft, 
  ShieldCheck, 
  Activity, 
  ExternalLink
} from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { 
  useAccount, 
  useWriteContract, 
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import { TOKENS, VAULTS, VAULT_ABI, ERC20_ABI } from "./contracts";

// --- MEMOIZED PERFORMANCE TICKERS & CHARTS TO PREVENT FULL PAGE RE-RENDERS ---
interface InterestTickerProps {
  shares: Record<string, number>;
  liveApys: Record<string, number>;
  vaultsList: Record<string, any>;
  speedUp?: number;
  prefix?: string;
}

export const InterestTicker = memo(({ shares, liveApys, vaultsList, speedUp = 2.5, prefix = "" }: InterestTickerProps) => {
  const [interest, setInterest] = useState(0.0);

  useEffect(() => {
    let totalYieldPerSecond = 0;
    Object.keys(vaultsList).forEach((key) => {
      const shareBal = shares[key] || 0;
      const apy = liveApys[key] || 10.0;
      const positionYieldPerSecond = (shareBal * 1.0 * (apy / 100)) / (365 * 24 * 3600);
      totalYieldPerSecond += positionYieldPerSecond;
    });

    if (totalYieldPerSecond === 0) {
      setInterest(0);
      return;
    }

    // Smooth counter refresh every 100ms
    const timer = setInterval(() => {
      setInterest((prev) => prev + (totalYieldPerSecond / 10) * speedUp);
    }, 100);

    return () => clearInterval(timer);
  }, [shares, liveApys, vaultsList, speedUp]);

  return <span className="yield-ticker text-emerald-400 font-bold">{prefix}${interest.toFixed(6)}</span>;
});

export const PerformanceChart = memo(({ vaultKey }: { vaultKey: string }) => {
  // Generate distinct curves and colors based on vaultKey
  let pathD = "M0,80 Q70,75 140,55 T280,45 T420,25 T500,15";
  let areaD = "M0,80 Q70,75 140,55 T280,45 T420,25 T500,15 L500,100 L0,100 Z";
  let colorStart = "#00f5a0";
  let colorEnd = "#00d9f5";
  
  if (vaultKey === "stableShuffle") {
    pathD = "M0,70 Q90,72 180,68 T360,65 T500,60";
    areaD = "M0,70 Q90,72 180,68 T360,65 T500,60 L500,100 L0,100 Z";
    colorStart = "#8b5cf6";
    colorEnd = "#d946ef";
  } else if (vaultKey === "moePowerhouse" || vaultKey === "hyperDrive") {
    pathD = "M0,85 Q60,70 120,80 T240,40 T360,60 T500,10";
    areaD = "M0,85 Q60,70 120,80 T240,40 T360,60 T500,10 L500,100 L0,100 Z";
    colorStart = "#fbbf24";
    colorEnd = "#f43f5e";
  } else if (vaultKey === "mantleMax") {
    pathD = "M0,75 Q80,50 160,60 T320,30 T500,5";
    areaD = "M0,75 Q80,50 160,60 T320,30 T500,5 L500,100 L0,100 Z";
    colorStart = "#10b981";
    colorEnd = "#059669";
  }

  const gradIdLine = `lineGrad-${vaultKey}`;
  const gradIdArea = `areaGrad-${vaultKey}`;

  return (
    <div className="w-full h-48 bg-black/20 rounded-xl border border-white/5 p-2 relative">
      <svg viewBox="0 0 500 100" className="w-full h-full overflow-visible">
        {/* Grids */}
        <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        
        {/* Area gradient under path */}
        <path 
          d={areaD} 
          fill={`url(#${gradIdArea})`} 
          className="chart-area"
        />
        
        {/* Line path */}
        <path 
          d={pathD} 
          fill="none" 
          stroke={`url(#${gradIdLine})`} 
          strokeWidth="2.5" 
          strokeLinecap="round"
          className="chart-line"
        />
        
        {/* Gradients definitions */}
        <defs>
          <linearGradient id={gradIdLine} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
          <linearGradient id={gradIdArea} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorStart} stopOpacity="0.25" />
            <stop offset="100%" stopColor={colorStart} stopOpacity="0.0" />
          </linearGradient>
        </defs>
      </svg>
      {/* Chart Tooltips/Labels */}
      <div className="absolute bottom-2 left-2 text-[10px] text-[#64748b]">30 Days Ago</div>
      <div className="absolute bottom-2 right-2 text-[10px] text-[#64748b]">Today</div>
    </div>
  );
});

export const CompositionChart = memo(({ allocations }: { allocations: any[] }) => {
  return (
    <div className="flex justify-center">
      <svg width="180" height="180" viewBox="0 0 36 36" className="overflow-visible transform -rotate-90">
        {/* Underlay base */}
        <circle cx="18" cy="18" r="15.91549430918954" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
        
        {/* Dynamic segments */}
        {allocations.map((alloc: any, idx: number) => {
          let previousWeightsSum = 0;
          for (let i = 0; i < idx; i++) {
            previousWeightsSum += allocations[i].weight;
          }
          return (
            <circle 
              key={idx}
              cx="18" 
              cy="18" 
              r="15.91549430918954" 
              fill="none" 
              stroke={idx === 0 ? "#00f5a0" : idx === 1 ? "#00d9f5" : "#8b5cf6"} 
              strokeWidth="4" 
              strokeDasharray={`${alloc.weight} ${100 - alloc.weight}`} 
              strokeDashoffset={100 - previousWeightsSum + 25} 
              className="transition-all duration-500 hover:stroke-[5px] cursor-pointer"
            />
          );
        })}
        
        {/* Donut Hole content */}
        <circle cx="18" cy="18" r="12" fill="#030712" />
        
        {/* Text inside */}
        <g transform="rotate(90 18 18)">
          <text x="18" y="16.5" textAnchor="middle" fill="#94a3b8" fontSize="3" fontWeight="600" letterSpacing="0.1">WEIGHTS</text>
          <text x="18" y="21" textAnchor="middle" fill="#f8fafc" fontSize="4.5" fontWeight="700">Classic</text>
        </g>
      </svg>
    </div>
  );
});


interface YieldRoutingVisualizerProps {
  liveApys: Record<string, number>;
  vaultsList: Record<string, any>;
}

export const YieldRoutingVisualizer = ({ liveApys, vaultsList }: YieldRoutingVisualizerProps) => {
  const [simAmount, setSimAmount] = useState<string>("1000");
  const [simToken, setSimToken] = useState<"USDT" | "USDC" | "MNT">("USDT");
  const [simVaultKey, setSimVaultKey] = useState<string>("conservative");
  const [simState, setSimState] = useState<"idle" | "routing" | "swapping" | "pooling" | "complete">("idle");
  const [simProgress, setSimProgress] = useState<number>(0);
  const [simYield, setSimYield] = useState<number>(0.0);

  const activeVault = vaultsList[simVaultKey] || vaultsList["conservative"];
  const apy = liveApys[simVaultKey] || 10.0;

  useEffect(() => {
    let timer: any;
    let yieldInterval: any;

    if (simState === "routing") {
      setSimProgress(15);
      timer = setTimeout(() => {
        setSimState("swapping");
      }, 1500);
    } else if (simState === "swapping") {
      setSimProgress(50);
      timer = setTimeout(() => {
        setSimState("pooling");
      }, 1800);
    } else if (simState === "pooling") {
      setSimProgress(80);
      timer = setTimeout(() => {
        setSimState("complete");
      }, 1500);
    } else if (simState === "complete") {
      setSimProgress(100);
      const amount = parseFloat(simAmount) || 1000;
      const yieldPerSecond = (amount * (apy / 100)) / (365 * 24 * 3600);
      const speedUp = 150;
      yieldInterval = setInterval(() => {
        setSimYield((prev) => prev + (yieldPerSecond / 10) * speedUp);
      }, 100);
    } else if (simState === "idle") {
      setSimProgress(0);
      setSimYield(0.0);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(yieldInterval);
    };
  }, [simState, simAmount, apy]);

  const handleStartSim = () => {
    if (simState !== "idle") {
      setSimState("idle");
    } else {
      setSimState("routing");
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-8 bg-black/40 border border-[#00f5a0]/15 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#00f5a0]/5 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-[#f8fafc] mb-1">Interactive Yield Router</h3>
        <p className="text-xs text-[#94a3b8]">Simulate how BasketFlow splits, swaps, and stakes your assets in real-time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-6">
        {/* Step 1: Simulator Controls */}
        <div className="p-5 bg-white/2 border border-white/5 rounded-2xl flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-[#00f5a0]/10 border border-[#00f5a0]/30 text-xs font-bold text-[#00f5a0] flex items-center justify-center">1</span>
              <span className="text-sm font-bold text-[#f8fafc]">Set Deposit Input</span>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider">Select Token</label>
                <div className="flex gap-2">
                  {(["USDT", "USDC", "MNT"] as const).map((t) => (
                    <button
                      key={t}
                      disabled={simState !== "idle"}
                      onClick={() => setSimToken(t)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${simToken === t ? "bg-[#00f5a0]/10 border-[#00f5a0] text-[#00f5a0]" : "bg-black/20 border-white/5 text-[#94a3b8] hover:border-white/10"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider">Amount</label>
                <input
                  type="number"
                  disabled={simState !== "idle"}
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="bg-black/40 border border-white/5 text-white rounded-lg px-3 py-1.5 text-sm font-semibold outline-none focus:border-[#00f5a0] w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider">Target Basket</label>
                <select
                  disabled={simState !== "idle"}
                  value={simVaultKey}
                  onChange={(e) => setSimVaultKey(e.target.value)}
                  className="bg-black/40 border border-white/5 text-white rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:border-[#00f5a0] w-full"
                >
                  {Object.keys(vaultsList).map((key) => (
                    <option key={key} value={key}>
                      {vaultsList[key].name} ({vaultsList[key].targetApy})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartSim}
            className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${simState === "idle" ? "glow-btn-primary" : "btn-secondary text-red-400 border-red-500/20 hover:bg-red-500/5 hover:border-red-500/30"}`}
          >
            {simState === "idle" ? (
              <>
                <span>Simulate Routing Flow</span>
                <ArrowUpRight size={14} />
              </>
            ) : (
              <span>Reset Simulator</span>
            )}
          </button>
        </div>

        {/* Step 2: The Visualizer Canvas (Animated nodes) */}
        <div className="lg:col-span-2 p-5 bg-white/2 border border-white/5 rounded-2xl flex flex-col justify-between relative min-h-[300px] overflow-hidden">
          <div className="absolute top-1/2 left-6 right-6 h-[2px] bg-white/5 -translate-y-1/2 pointer-events-none z-0 hidden sm:block" />
          {simProgress > 0 && (
            <div 
              style={{ width: `${simProgress - 10}%` }}
              className="absolute top-1/2 left-6 h-[2px] bg-gradient-to-r from-[#00f5a0] to-[#00d9f5] -translate-y-1/2 pointer-events-none z-0 transition-all duration-1000 hidden sm:block" 
            />
          )}

          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full bg-[#00f5a0]/10 border border-[#00f5a0]/30 text-xs font-bold text-[#00f5a0] flex items-center justify-center">2</span>
            <span className="text-sm font-bold text-[#f8fafc]">On-Chain Routing Path</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4 relative z-10 my-auto">
            {/* Input Node */}
            <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border bg-black/40 transition-all duration-500 ${simState !== "idle" ? "border-[#00f5a0] shadow-[0_0_15px_rgba(0,245,160,0.2)]" : "border-white/5"}`}>
              <span className="text-2xl mb-1">💳</span>
              <span className="text-[10px] font-bold text-[#f8fafc]">{simAmount} {simToken}</span>
              <span className="text-[8px] text-[#94a3b8] uppercase font-semibold">Deposit</span>
            </div>

            {/* Transition Arrow */}
            <div className="flex sm:flex-col items-center justify-center text-xs font-bold text-[#94a3b8]">
              <span className={`animate-pulse ${simState === "routing" ? "text-[#00f5a0]" : ""}`}>➔</span>
              <span className="text-[8px] hidden sm:block">Swap Routing</span>
            </div>

            {/* Router Node */}
            <div className={`flex flex-col items-center justify-center w-24 h-24 rounded-full border bg-black/60 transition-all duration-500 relative ${
              simState === "swapping" ? "border-[#00f5a0] shadow-[0_0_20px_rgba(0,245,160,0.3)] scale-105" :
              simState === "pooling" || simState === "complete" ? "border-[#00d9f5] shadow-[0_0_15px_rgba(0,217,245,0.15)]" :
              "border-white/5"
            }`}>
              {simState === "swapping" && (
                <div className="absolute inset-2 border-2 border-dashed border-[#00f5a0] rounded-full animate-spin pointer-events-none" />
              )}
              <span className="text-2xl mb-1">🧺</span>
              <span className="text-[9px] font-bold text-[#f8fafc] text-center px-2 leading-none">BasketFlow Router</span>
              <span className="text-[7px] text-[#00f5a0] uppercase font-semibold mt-1">
                {simState === "idle" ? "Ready" :
                 simState === "routing" ? "Routing..." :
                 simState === "swapping" ? "Swapping..." :
                 simState === "pooling" ? "Compounding..." : "Active"}
              </span>
            </div>

            {/* Transition Arrow */}
            <div className="flex sm:flex-col items-center justify-center text-xs font-bold text-[#94a3b8]">
              <span className={`animate-pulse ${simState === "pooling" ? "text-[#00d9f5]" : ""}`}>➔</span>
              <span className="text-[8px] hidden sm:block">Pool Deposit</span>
            </div>

            {/* Output LP Node */}
            <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border bg-black/40 transition-all duration-500 ${simState === "complete" ? "border-[#00d9f5] shadow-[0_0_15px_rgba(0,217,245,0.3)] scale-105" : "border-white/5"}`}>
              <span className="text-2xl mb-1">🛡️</span>
              <span className="text-[10px] font-bold text-[#f8fafc]">{activeVault.symbol}</span>
              <span className="text-[8px] text-[#00d9f5] uppercase font-semibold">Compounding</span>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-xl bg-black/20 border border-white/5 text-center text-xs text-[#94a3b8]">
            {simState === "idle" && "Click 'Simulate Routing Flow' to start the demo."}
            {simState === "routing" && `Validating deposit of ${simAmount} ${simToken} and routing on Mantle network...`}
            {simState === "swapping" && `Smart contract is executing swaps: swapping ${simToken} into ${activeVault.allocations.map((a: any) => `${a.weight}% ${a.token.symbol}`).join(" and ")}...`}
            {simState === "pooling" && `Routing component swap tokens to Merchant Moe LPs, staking LP tokens in yield farming pools...`}
            {simState === "complete" && `Routing complete! LP staked. Compounding APY is generating returns below.`}
          </div>
        </div>
      </div>

      {simState === "complete" && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#00f5a0]/10 to-[#00d9f5]/10 border border-[#00f5a0]/30 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fadeIn">
          <div>
            <h4 className="text-sm font-bold text-[#00f5a0] flex items-center gap-1.5">
              <span className="pulse-dot" />
              Real-Time Compounding Yield
            </h4>
            <p className="text-xs text-[#94a3b8]">Compounding simulated at 150x speed. APY: {apy}%. Watch your balance grow:</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-[#94a3b8] font-semibold">Simulated Yield Earned</span>
            <span className="text-2xl font-mono font-bold text-emerald-400">
              +${simYield.toFixed(6)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};


export default function App() {
  const { isConnected, address } = useAccount();
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [appMode, setAppMode] = useState<"landing" | "app">("landing");
  const [currentView, setCurrentView] = useState<"baskets" | "dashboard" | "leaderboard" | "detail">("baskets");
  // Dynamic Baskets registry state
  const [vaultsList, setVaultsList] = useState<Record<string, any>>(VAULTS);
  const [selectedVaultKey, setSelectedVaultKey] = useState<string>("conservative");

  // Selected Vault helper
  const activeVault = vaultsList[selectedVaultKey] || vaultsList["conservative"];

  // --- MOCK STATE FOR DEMO MODE ---
  const [demoBalances, setDemoBalances] = useState<{
    USDT: number;
    USDC: number;
    MNT: number;
    shares: Record<string, number>;
  }>(() => {
    const initialShares: Record<string, number> = {};
    Object.keys(VAULTS).forEach((key) => {
      initialShares[key] = 0.0;
    });
    return {
      USDT: 1500.0,
      USDC: 800.0,
      MNT: 500.0,
      shares: initialShares,
    };
  });

  const [txStep, setTxStep] = useState<number>(0);
  const [txModalOpen, setTxModalOpen] = useState<boolean>(false);
  const [txType, setTxType] = useState<"deposit" | "withdraw">("deposit");
  const [txAmount, setTxAmount] = useState<string>("");
  const [txToken, setTxToken] = useState<"USDT" | "USDC" | "MNT">("USDT");
  const [txStatus, setTxStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [txError, setTxError] = useState<string>("");

  // Live APYs state for real-time fluctuations
  const [liveApys, setLiveApys] = useState<Record<string, number>>(() => {
    const initialApys: Record<string, number> = {};
    Object.keys(VAULTS).forEach((key) => {
      const targetRange = VAULTS[key as keyof typeof VAULTS].targetApy;
      const numbers = targetRange.replace("%", "").split("-");
      const avg = numbers.length === 2 
        ? (parseFloat(numbers[0]) + parseFloat(numbers[1])) / 2 
        : parseFloat(numbers[0]);
      initialApys[key] = parseFloat(avg.toFixed(2));
    });
    return initialApys;
  });
  const [apyDirection, setApyDirection] = useState<Record<string, "up" | "down" | "flat">>({});

  // Real-time fluctuating stats
  const [liveTVL, setLiveTVL] = useState<number>(2430950);
  const [liveDepositors, setLiveDepositors] = useState<number>(3842);

  // Live activity feed state
  const [activities, setActivities] = useState<Array<{ id: number; text: string; time: string }>>([
    { id: 1, text: "Wallet 0x8f...4e deposited $1,200 into Stable Shuffle", time: "Just now" },
    { id: 2, text: "Wallet vitalik.mnt deposited $25,000 into Mantle Max", time: "2 min ago" },
    { id: 3, text: "Wallet 0x3d...7c withdrew $400 from Conservative Care", time: "5 min ago" },
    { id: 4, text: "Wallet replytim.mnt deposited $3,000 into mETH Alpha", time: "8 min ago" },
  ]);

  // Tutorial State
  const [tutorialOpen, setTutorialOpen] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(0);

  // Create Basket Modal State
  const [createBasketModalOpen, setCreateBasketModalOpen] = useState<boolean>(false);
  const [newBasketName, setNewBasketName] = useState<string>("");
  const [newBasketTokenA, setNewBasketTokenA] = useState<keyof typeof TOKENS>("USDC");
  const [newBasketTokenB, setNewBasketTokenB] = useState<keyof typeof TOKENS>("mETH");
  const [newBasketWeightA, setNewBasketWeightA] = useState<number>(50);
  const [newBasketRisk, setNewBasketRisk] = useState<string>("Low");
  const [newBasketApy, setNewBasketApy] = useState<string>("12.5");
  const [newBasketDesc, setNewBasketDesc] = useState<string>("");
  const [createBasketStep, setCreateBasketStep] = useState<number>(0);
  const [createBasketStatus, setCreateBasketStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [createBasketError, setCreateBasketError] = useState<string>("");

  // APY Real-Time Fluctuation and Stats simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveApys((prev) => {
        const next = { ...prev };
        const dirs: Record<string, "up" | "down" | "flat"> = {};
        Object.keys(next).forEach((key) => {
          // Fluctuates slightly by +/- 0.15% for active feedback
          const change = (Math.random() - 0.5) * 0.3;
          const oldVal = next[key] || 10;
          let newVal = oldVal + change;
          
          // Keep within reasonable bounds dynamically based on targetApy config
          const vault = vaultsList[key];
          if (vault && vault.targetApy) {
            const range = vault.targetApy.replace("%", "").split("-");
            if (range.length === 2) {
              const min = parseFloat(range[0]);
              const max = parseFloat(range[1]);
              if (newVal < min || newVal > max) newVal = oldVal - change;
            } else if (range.length === 1) {
              const target = parseFloat(range[0]);
              if (newVal < target - 3 || newVal > target + 3) newVal = oldVal - change;
            }
          }
          if (newVal < 1) newVal = 1;

          next[key] = parseFloat(newVal.toFixed(2));
          dirs[key] = change > 0 ? "up" : change < 0 ? "down" : "flat";
        });
        setApyDirection(dirs);
        setTimeout(() => setApyDirection({}), 2000); // Clear glow after 2s
        return next;
      });

      // Fluctuate TVL and active depositors slightly
      setLiveTVL((prev) => prev + Math.floor((Math.random() - 0.45) * 450));
      setLiveDepositors((prev) => prev + (Math.random() > 0.75 ? 1 : Math.random() < 0.25 ? -1 : 0));
    }, 4000);

    return () => clearInterval(timer);
  }, [vaultsList]);

  // Live Activity Feed simulator
  useEffect(() => {
    const firstNames = ["0x3b", "vitalik", "replytim", "0x8f", "0x5a", "0x7d", "0xe2", "0x9c", "0x4f", "dan"];
    const domains = [".mnt", ".eth", ""];
    const actions = ["deposited", "withdrew"];
    const amounts = [150, 420, 800, 1500, 3200, 5000, 10000];
    
    const interval = setInterval(() => {
      // Pick random vault
      const keys = Object.keys(vaultsList);
      if (keys.length === 0) return;
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const vault = vaultsList[randomKey];
      
      const addr = firstNames[Math.floor(Math.random() * firstNames.length)] + 
        (Math.random() > 0.5 ? domains[Math.floor(Math.random() * domains.length)] : "..." + Math.random().toString(16).substring(2, 6));
      
      const act = actions[Math.floor(Math.random() * actions.length)];
      const amt = amounts[Math.floor(Math.random() * amounts.length)];
      const text = `Wallet ${addr} ${act} $${amt.toLocaleString()} ${act === "deposited" ? "into" : "from"} ${vault.name}`;
      
      setActivities((prev) => {
        const next = [{ id: Date.now(), text, time: "Just now" }, ...prev];
        // Keep last 4 items
        if (next.length > 4) next.pop();
        // Update previous item times
        return next.map((item, idx) => {
          if (idx === 0) return item;
          if (idx === 1) return { ...item, time: "1 min ago" };
          return { ...item, time: `${idx * 2} min ago` };
        });
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [vaultsList]);



  const handleCreateBasket = async () => {
    if (!newBasketName) return;
    setCreateBasketStatus("loading");
    setCreateBasketStep(1);

    try {
      // Step 1: Scaffolding contract Yul/viaIR code...
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Step 2: Deploying contract on Mantle Sepolia...
      setCreateBasketStep(2);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Step 3: Registering on-chain registry & metadata...
      setCreateBasketStep(3);
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Success
      setCreateBasketStep(4);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newKey = "custom_" + Date.now();
      const mockAddress = "0x" + Math.random().toString(16).substring(2, 42).padEnd(40, "0");
      
      const newVault = {
        id: Object.keys(vaultsList).length + 1,
        name: newBasketName,
        symbol: "bf" + newBasketName.replace(/\s+/g, "").substring(0, 5),
        address: mockAddress as `0x${string}`,
        description: newBasketDesc || "Custom yield basket strategy.",
        targetApy: `${newBasketApy}%`,
        risk: newBasketRisk,
        allocations: [
          { token: TOKENS[newBasketTokenA], weight: newBasketWeightA },
          { token: TOKENS[newBasketTokenB], weight: 100 - newBasketWeightA },
        ],
      };

      // Update vaultsList
      setVaultsList((prev) => ({
        ...prev,
        [newKey]: newVault
      }));

      // Register initial APY
      setLiveApys((prev) => ({
        ...prev,
        [newKey]: parseFloat(newBasketApy)
      }));

      // Register in demo balances
      setDemoBalances((prev) => ({
        ...prev,
        shares: {
          ...prev.shares,
          [newKey]: 0.0
        }
      }));

      // Add custom basket creation to activity feed
      const newActivity = {
        id: Date.now(),
        text: `Wallet 0x70...9c8 created custom basket '${newBasketName}' (${newBasketWeightA}% / ${100 - newBasketWeightA}%)`,
        time: "Just now"
      };
      setActivities((prev) => [newActivity, ...prev.slice(0, 3)]);

      setCreateBasketStatus("success");
      
      // Clear form
      setNewBasketName("");
      setNewBasketDesc("");
    } catch (err: any) {
      setCreateBasketStatus("error");
      setCreateBasketError(err.message || "Failed to deploy custom basket.");
    }
  };

  // --- WEB3 STATE & SMART CONTRACT CALLS ---
  const { writeContract, data: txHash, error: web3WriteError } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Real Web3 balances can be connected in non-demo mode

  // Transaction execution (Handles Demo vs Real Web3)
  const handleExecuteTx = async (type: "deposit" | "withdraw") => {
    if (!txAmount || parseFloat(txAmount) <= 0) return;
    setTxType(type);
    setTxStatus("loading");
    setTxModalOpen(true);
    setTxError("");

    if (demoMode) {
      // --- SIMULATED DEMO FLOW ---
      try {
        const val = parseFloat(txAmount);
        if (type === "deposit") {
          // Check balance
          if (demoBalances[txToken] < val) {
            throw new Error("Insufficient token balance in mock wallet.");
          }

          setTxStep(1); // Approving token transfer
          await new Promise((resolve) => setTimeout(resolve, 1500));
          
          setTxStep(2); // Swapping on Merchant Moe
          await new Promise((resolve) => setTimeout(resolve, 1500));

          setTxStep(3); // Adding liquidity to Moe Pool
          await new Promise((resolve) => setTimeout(resolve, 1500));

          setTxStep(4); // Minting BasketFlow shares
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Apply changes
          setDemoBalances((prev) => ({
            ...prev,
            [txToken]: prev[txToken] - val,
            shares: {
              ...prev.shares,
              [selectedVaultKey]: prev.shares[selectedVaultKey] + val
            }
          }));
        } else {
          // Withdraw
          if (demoBalances.shares[selectedVaultKey] < val) {
            throw new Error("Insufficient vault shares to withdraw.");
          }

          setTxStep(1); // Redeeming LP tokens
          await new Promise((resolve) => setTimeout(resolve, 1500));

          setTxStep(2); // Removing liquidity from Moe
          await new Promise((resolve) => setTimeout(resolve, 1500));

          setTxStep(3); // Swapping pool tokens back to USDT/USDC/MNT
          await new Promise((resolve) => setTimeout(resolve, 1500));

          setTxStep(4); // Transferring tokens to wallet
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Apply changes
          setDemoBalances((prev) => ({
            ...prev,
            [txToken]: prev[txToken] + val,
            shares: {
              ...prev.shares,
              [selectedVaultKey]: prev.shares[selectedVaultKey] - val
            }
          }));
        }

        setTxStatus("success");
        setTxAmount("");
      } catch (err: any) {
        setTxStatus("error");
        setTxError(err.message || "Simulated transaction failed.");
      }
    } else {
      // --- REAL WEB3 SMART CONTRACT FLOW ---
      if (!isConnected || !address) {
        setTxStatus("error");
        setTxError("Wallet not connected.");
        return;
      }

      try {
        const decimals = TOKENS[txToken].decimals;
        const amountWei = parseUnits(txAmount, decimals);
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

        if (type === "deposit") {
          // Swaps & Deposit transaction on BasketFlowVault.sol
          // First, approve the router if needed (simplified: write approval directly)
          setTxStep(1); // Approving token allowance (requires user approval)
          await writeContract({
            address: TOKENS[txToken].address,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [activeVault.address, amountWei],
          });

          // Wait a moment then call deposit
          setTxStep(2); // Signing single deposit transaction
          
          // Swap paths
          const pathA = [TOKENS[txToken].address, activeVault.allocations[0].token.address];
          const pathB = [TOKENS[txToken].address, activeVault.allocations[1].token.address];

          await writeContract({
            address: activeVault.address,
            abi: VAULT_ABI,
            functionName: "depositWithERC20",
            args: [
              TOKENS[txToken].address,
              amountWei,
              0n, // minShares (slippage check, 0 for test simplicity or user defined)
              pathA,
              pathB,
              0n, // amountAMin
              0n, // amountBMin
              0n, // amountAMinPool
              0n, // amountBMinPool
              deadline
            ]
          });
        } else {
          // Withdraw transaction on BasketFlowVault.sol
          setTxStep(1); // Signing withdrawal transaction
          
          const pathA = [activeVault.allocations[0].token.address, TOKENS[txToken].address];
          const pathB = [activeVault.allocations[1].token.address, TOKENS[txToken].address];

          await writeContract({
            address: activeVault.address,
            abi: VAULT_ABI,
            functionName: "withdrawToERC20",
            args: [
              amountWei, // shares amount to burn
              TOKENS[txToken].address,
              0n, // minAmountA
              0n, // minAmountB
              pathA,
              pathB,
              0n, // amountAMinOut
              0n, // amountBMinOut
              0n, // minOutputOut
              deadline
            ]
          });
        }
      } catch (err: any) {
        setTxStatus("error");
        setTxError(err.message || "Smart contract transaction failed.");
      }
    }
  };

  // Sync web3 transaction results
  useEffect(() => {
    if (isTxConfirming) {
      setTxStatus("loading");
      setTxStep(3); // Wait for block confirmation
    }
    if (isTxConfirmed) {
      setTxStatus("success");
      setTxAmount("");
    }
    if (web3WriteError) {
      setTxStatus("error");
      setTxError(web3WriteError.message || "Transaction reverted on blockchain.");
    }
  }, [isTxConfirming, isTxConfirmed, web3WriteError]);

  return (
    <div className="flex flex-col min-h-screen bg-[#02040a]">
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#02040a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAppMode("landing")}>
            <span className="text-2xl">🧺</span>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#00f5a0] to-[#00d9f5] bg-clip-text text-transparent">
              BasketFlow
            </span>
          </div>

          {/* Conditional Navigation links */}
          {appMode === "landing" ? (
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <button onClick={() => { setAppMode("app"); setCurrentView("baskets"); }} className="text-[#94a3b8] hover:text-[#f8fafc] bg-transparent border-none cursor-pointer transition-colors font-medium">Yield Baskets</button>
              <a href="#features" onClick={(e) => { e.preventDefault(); setTutorialStep(0); setTutorialOpen(true); }} className="text-[#94a3b8] hover:text-[#f8fafc] transition-colors decoration-none">How It Works</a>
              <a href="#github" onClick={(e) => e.preventDefault()} className="text-[#94a3b8] hover:text-[#f8fafc] transition-colors decoration-none">Security Audit</a>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <button 
                onClick={() => setCurrentView("baskets")} 
                className={`bg-transparent border-none cursor-pointer font-medium transition-colors ${currentView === "baskets" || currentView === "detail" ? "text-[#00f5a0]" : "text-[#94a3b8] hover:text-[#f8fafc]"}`}
              >
                Invest Baskets
              </button>
              <button 
                onClick={() => setCurrentView("dashboard")} 
                className={`bg-transparent border-none cursor-pointer font-medium transition-colors ${currentView === "dashboard" ? "text-[#00f5a0]" : "text-[#94a3b8] hover:text-[#f8fafc]"}`}
              >
                My Portfolio
              </button>
              <button 
                onClick={() => setCurrentView("leaderboard")} 
                className={`bg-transparent border-none cursor-pointer font-medium transition-colors ${currentView === "leaderboard" ? "text-[#00f5a0]" : "text-[#94a3b8] hover:text-[#f8fafc]"}`}
              >
                Leaderboard
              </button>
            </nav>
          )}

          <div className="flex items-center gap-4">
            {appMode === "landing" ? (
              <>
                <button 
                  onClick={() => { setTutorialStep(0); setTutorialOpen(true); }}
                  className="hidden sm:inline-flex btn-secondary py-1.5 px-3.5 text-xs text-amber-400 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
                >
                  💡 Simple Guide
                </button>
                <button 
                  onClick={() => {
                    setAppMode("app");
                    setCurrentView("baskets");
                  }}
                  className="glow-btn-primary py-1.5 px-4 text-xs font-semibold"
                >
                  Launch App
                </button>
              </>
            ) : (
              <>
                {/* Back to Website */}
                <button 
                  onClick={() => setAppMode("landing")} 
                  className="text-xs text-[#94a3b8] hover:text-white bg-transparent border-none cursor-pointer transition-colors mr-2 hidden sm:inline-block font-semibold"
                >
                  ← Exit to Website
                </button>

                {/* Tutorial Button */}
                <button 
                  onClick={() => { setTutorialStep(0); setTutorialOpen(true); }}
                  className="glow-btn-primary py-1.5 px-3.5 text-xs bg-gradient-to-r from-amber-500/80 to-yellow-500/80 hover:from-amber-500 hover:to-yellow-500 border border-amber-500/30 text-slate-900 shadow-none hover:shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                >
                  💡 Simple Guide
                </button>

                {/* Demo Mode Toggle */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs font-semibold">
                  <span className="text-[#94a3b8]">Simulated Demo</span>
                  <button 
                    onClick={() => setDemoMode(!demoMode)} 
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${demoMode ? "bg-[#00f5a0]" : "bg-white/10"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-slate-900 transition-transform ${demoMode ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>

                {/* RainbowKit Connect Button */}
                {!demoMode && <ConnectButton label="Connect Wallet" />}
                {demoMode && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-[#00f5a0]/10 to-[#00d9f5]/10 border border-[#00f5a0]/30 rounded-lg px-4 py-2 text-sm font-semibold text-[#00f5a0]">
                    <ShieldCheck size={16} />
                    Demo Wallet Connected
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* CORE CONTENT LAYOUT */}
      <main className={`flex-grow max-w-7xl w-full mx-auto px-4 py-8 ${appMode === "app" ? "pb-24 md:pb-8" : ""}`}>
        
        {/* LANDING PAGE MODE */}
        {appMode === "landing" && (
          <div className="flex flex-col gap-16">
            {/* HERO PANEL */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#112035]/40 to-[#070913]/40 border border-white/5 p-8 sm:p-16 text-center flex flex-col items-center gap-6">
              {/* Decorative glows */}
              <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#00f5a0]/10 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#00d9f5]/10 rounded-full blur-[120px] pointer-events-none" />

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-[#00f5a0]/10 to-[#00d9f5]/10 border border-[#00f5a0]/30 text-[#00f5a0] uppercase tracking-wider">
                ⚡ Mantle Network Yield Aggregator
              </span>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-3xl leading-tight text-white">
                DeFi yield portfolios,{" "}
                <span className="bg-gradient-to-r from-[#00f5a0] to-[#00d9f5] bg-clip-text text-transparent">
                  in a single click.
                </span>
              </h1>

              <p className="text-[#94a3b8] text-base sm:text-lg max-w-2xl leading-relaxed">
                Deposit USDT, USDC, or MNT into risk-tiered baskets of Merchant Moe LP assets. 
                Our smart contracts handle the swaps, splits, and pooling in one transaction. 
                Save on gas, eliminate complexity, and earn yield automatically.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => {
                    setAppMode("app");
                    setCurrentView("baskets");
                  }}
                  className="glow-btn-primary py-4 px-8 text-sm font-bold flex items-center justify-center gap-2"
                >
                  <span>Launch App Dashboard</span>
                  <ArrowUpRight size={18} />
                </button>
                <button 
                  onClick={() => { setTutorialStep(0); setTutorialOpen(true); }}
                  className="btn-secondary py-4 px-8 text-sm font-bold bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/25 flex items-center justify-center gap-1.5"
                >
                  <span>💡 1-Minute Beginner Guide</span>
                </button>
              </div>

              {/* Stats banner inside hero */}
              <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/5 w-full max-w-2xl">
                <div>
                  <div className="text-[10px] text-[#64748b] font-bold uppercase">Total Value Locked</div>
                  <div className="text-lg sm:text-2xl font-extrabold text-[#f8fafc] mt-1">
                    ${liveTVL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#64748b] font-bold uppercase">Average APY</div>
                  <div className="text-lg sm:text-2xl font-extrabold text-[#00f5a0] mt-1">17.6%</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#64748b] font-bold uppercase">Active Users</div>
                  <div className="text-lg sm:text-2xl font-extrabold text-[#00d9f5] mt-1">
                    {liveDepositors.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* FLOW DIAGRAM SECTION */}
            <YieldRoutingVisualizer liveApys={liveApys} vaultsList={vaultsList} />

            {/* BASKETS PREVIEW SECTION */}
            <div>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-[#f8fafc]">Available Yield Baskets</h2>
                  <p className="text-xs text-[#94a3b8] mt-1">Explore our list of risk-tiered LP investment baskets.</p>
                </div>
                <button 
                  onClick={() => {
                    setAppMode("app");
                    setCurrentView("baskets");
                  }}
                  className="btn-secondary py-2 px-4 text-xs font-semibold flex items-center gap-1"
                >
                  <span>Launch App to Invest</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>

              {/* Baskets Grid */}
              <div className="cards-grid">
                {Object.keys(vaultsList).slice(0, 3).map((key) => {
                  const vault = vaultsList[key];
                  const apyVal = liveApys[key] !== undefined ? `${liveApys[key]}%` : vault.targetApy;
                  const direction = apyDirection[key];
                  const cardGlowClass = direction === "up" ? "card-glow-up" : direction === "down" ? "card-glow-down" : "";
                  const apyColorClass = direction === "up" ? "text-emerald-400" 
                                        : direction === "down" ? "text-red-400"
                                        : "text-[#00f5a0]";
                  return (
                    <div 
                      key={key} 
                      className={`glass-panel glass-panel-interactive flex flex-col justify-between p-6 relative overflow-hidden group transition-all duration-700 ${cardGlowClass}`}
                      onClick={() => {
                        setSelectedVaultKey(key);
                        setAppMode("app");
                        setCurrentView("detail");
                      }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00f5a0] to-[#00d9f5] opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            vault.risk === "Minimal" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            vault.risk === "Low" ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" :
                            vault.risk === "Medium" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                            "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {vault.risk} Risk
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
                            <span className="pulse-dot" />
                            Live Yield
                          </div>
                        </div>

                        <h3 className="text-2xl font-bold text-[#f8fafc] mb-2">{vault.name}</h3>
                        <p className="text-sm text-[#94a3b8] mb-6 line-clamp-2">{vault.description}</p>

                        <div className={`bg-white/5 rounded-xl p-4 mb-6 border transition-all duration-500 ${direction === "up" ? "border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.1)]" : direction === "down" ? "border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-white/5"}`}>
                          <div className="text-xs text-[#94a3b8] mb-1 font-semibold uppercase tracking-wider">Target Yield</div>
                          <div className="flex items-baseline gap-2">
                            <div className={`text-4xl font-extrabold tracking-tight transition-colors duration-500 ${apyColorClass}`}>{apyVal}</div>
                            {direction === "up" && <span className="text-emerald-400 text-sm font-bold animate-bounce">▲</span>}
                            {direction === "down" && <span className="text-red-400 text-sm font-bold animate-bounce">▼</span>}
                          </div>
                        </div>

                        {/* Composition */}
                        <div className="mb-6">
                          <div className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Composition</div>
                          <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-white/5 border border-white/10">
                            {vault.allocations.map((alloc: any, idx: number) => (
                              <div 
                                key={idx} 
                                style={{ width: `${alloc.weight}%` }}
                                className={`h-full ${idx === 0 ? "bg-[#00f5a0]" : idx === 1 ? "bg-[#00d9f5]" : "bg-purple-500"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <button className="glow-btn-primary w-full py-3 text-xs">
                        Invest in Basket
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LIVE ACTIVITY FEED */}
            <div className="glass-panel p-6 bg-black/35 border border-white/5 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4 text-[#94a3b8] text-xs font-bold uppercase tracking-wider">
                <span className="pulse-dot bg-emerald-400" />
                <span>Real-Time Activity Feed</span>
              </div>
              <div className="flex flex-col gap-2">
                {activities.map((act) => (
                  <div key={act.id} className="flex justify-between items-center text-xs py-2 px-4 rounded-xl bg-white/2 border border-white/5 hover:bg-white/5 transition-all">
                    <span className="text-[#f8fafc] font-medium">{act.text}</span>
                    <span className="text-[#64748b] text-[10px] whitespace-nowrap">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* BANNER FOR DEMO MODE (APP MODE ONLY) */}
        {demoMode && appMode === "app" && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#00f5a0]/5 to-[#00d9f5]/5 border border-[#00f5a0]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-3 items-center">
              <div className="bg-[#00f5a0]/20 p-2 rounded-lg text-[#00f5a0]">
                <Activity size={20} className="animate-pulse" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#00f5a0]">Simulated Demo Mode Active</h4>
                <p className="text-xs text-[#94a3b8]">Test the dApp instantly without paying real gas fees. Yield accrues in real-time below.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const initialShares: Record<string, number> = {};
                  Object.keys(vaultsList).forEach((key) => {
                    initialShares[key] = 0;
                  });
                  setDemoBalances({ USDT: 1500, USDC: 800, MNT: 500, shares: initialShares });
                }} 
                className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
              >
                <RefreshCw size={12} />
                Reset Balances
              </button>
            </div>
          </div>
        )}

        {/* VIEW 1: BASKETS GRID (APP MODE ONLY) */}
        {(appMode === "app" && currentView === "baskets") && (
          <div>
            <div className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-white">Yield Aggregation Baskets</h2>
                <p className="text-[#94a3b8] text-sm mt-1">Select a vault below to deposit or manage your yield position.</p>
              </div>
            </div>

            {/* METRICS ROW */}
            <div className="metrics-grid mb-8">
              <div className="glass-panel p-6 flex items-center gap-4">
                <div className="bg-white/5 p-3 rounded-xl text-[#00f5a0]">
                  <DollarSign size={24} />
                </div>
                <div>
                  <div className="text-xs text-[#94a3b8] font-semibold uppercase tracking-wider">Total Value Locked</div>
                  <div className="text-2xl font-bold text-[#f8fafc]">
                    ${liveTVL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
              <div className="glass-panel p-6 flex items-center gap-4">
                <div className="bg-white/5 p-3 rounded-xl text-[#00d9f5]">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <div className="text-xs text-[#94a3b8] font-semibold uppercase tracking-wider">Average Yield APY</div>
                  <div className="text-2xl font-bold text-[#f8fafc]">17.6%</div>
                </div>
              </div>
              <div className="glass-panel p-6 flex items-center gap-4">
                <div className="bg-white/5 p-3 rounded-xl text-purple-400">
                  <Award size={24} />
                </div>
                <div>
                  <div className="text-xs text-[#94a3b8] font-semibold uppercase tracking-wider">Active Depositors</div>
                  <div className="text-2xl font-bold text-[#f8fafc]">
                    {liveDepositors.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE ACTIVITY FEED */}
            <div className="glass-panel p-4 mb-8 bg-black/35 border border-white/5 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3 text-[#94a3b8] text-xs font-bold uppercase tracking-wider">
                <span className="pulse-dot" />
                <span>Real-Time Activity Feed</span>
              </div>
              <div className="flex flex-col gap-2">
                {activities.map((act) => (
                  <div key={act.id} className="flex justify-between items-center text-xs py-1.5 px-3 rounded-lg bg-white/2 border border-white/5 hover:bg-white/5 transition-all">
                    <span className="text-[#f8fafc] font-medium">{act.text}</span>
                    <span className="text-[#64748b] text-[10px] whitespace-nowrap">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* BASKET CARDS GRID */}
            <div className="cards-grid">
              {(Object.keys(vaultsList)).map((key) => {
                const vault = vaultsList[key];
                const apyVal = liveApys[key] !== undefined ? `${liveApys[key]}%` : vault.targetApy;
                const direction = apyDirection[key];
                const cardGlowClass = direction === "up" ? "card-glow-up" : direction === "down" ? "card-glow-down" : "";
                const apyColorClass = direction === "up" ? "text-emerald-400" 
                                      : direction === "down" ? "text-red-400"
                                      : "text-[#00f5a0]";
                return (
                  <div 
                    key={key} 
                    className={`glass-panel glass-panel-interactive flex flex-col justify-between p-6 relative overflow-hidden group transition-all duration-700 ${cardGlowClass}`}
                    onClick={() => {
                      setSelectedVaultKey(key);
                      setCurrentView("detail");
                    }}
                  >
                    {/* Glowing highlight indicator */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00f5a0] to-[#00d9f5] opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div>
                      {/* Badge / Risk info */}
                      <div className="flex justify-between items-center mb-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          vault.risk === "Minimal" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          vault.risk === "Low" ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" :
                          vault.risk === "Medium" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                          "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {vault.risk} Risk
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
                          <span className="pulse-dot" />
                          Live Yield
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-[#f8fafc] mb-2">{vault.name}</h3>
                      <p className="text-sm text-[#94a3b8] mb-6 line-clamp-2">{vault.description}</p>

                      {/* APY Display */}
                      <div className={`bg-white/5 rounded-xl p-4 mb-6 border transition-all duration-500 ${direction === "up" ? "border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.1)]" : direction === "down" ? "border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-white/5"}`}>
                        <div className="text-xs text-[#94a3b8] mb-1 font-semibold uppercase tracking-wider">Target Yield</div>
                        <div className="flex items-baseline gap-2">
                          <div className={`text-4xl font-extrabold tracking-tight transition-colors duration-500 ${apyColorClass}`}>{apyVal}</div>
                          {direction === "up" && <span className="text-emerald-400 text-sm font-bold animate-bounce">▲</span>}
                          {direction === "down" && <span className="text-red-400 text-sm font-bold animate-bounce">▼</span>}
                        </div>
                        <div className="text-[10px] text-[#64748b] mt-1 font-medium">APY generated via Merchant Moe LPs</div>
                      </div>

                      {/* Allocation display */}
                      <div className="mb-6">
                        <div className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Composition</div>
                        <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-white/5 border border-white/10">
                          {vault.allocations.map((alloc: any, idx: number) => (
                            <div 
                              key={idx} 
                              style={{ width: `${alloc.weight}%` }}
                              className={`h-full ${idx === 0 ? "bg-[#00f5a0]" : idx === 1 ? "bg-[#00d9f5]" : "bg-purple-500"}`}
                            />
                          ))}
                        </div>
                        <div className="flex gap-4 mt-2">
                          {vault.allocations.map((alloc: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1 text-xs">
                              <span className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-[#00f5a0]" : idx === 1 ? "bg-[#00d9f5]" : "bg-purple-500"}`} />
                              <span className="text-[#f8fafc] font-semibold">{alloc.token.symbol}</span>
                              <span className="text-[#94a3b8]">({alloc.weight}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button className="glow-btn-primary w-full py-3">
                      Select Basket
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                );
              })}

              {/* CREATE BASKET CARD */}
              <div 
                className="glass-panel border-dashed border-2 border-[#00f5a0]/30 hover:border-[#00f5a0]/60 flex flex-col justify-center items-center p-8 text-center cursor-pointer min-h-[350px] transition-all hover:scale-[1.01]"
                onClick={() => setCreateBasketModalOpen(true)}
              >
                <div className="w-16 h-16 rounded-full bg-[#00f5a0]/10 border border-[#00f5a0]/20 flex items-center justify-center text-3xl mb-4 text-[#00f5a0]">
                  +
                </div>
                <h3 className="text-xl font-bold text-[#f8fafc] mb-2">Create Custom Basket</h3>
                <p className="text-xs text-[#94a3b8] max-w-[200px]">
                  Build your own yield strategy with custom tokens and splits.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: VAULT DETAIL (ROBINHOOD & WEBFONTS INSPIRED INTERFACE) */}
        {(currentView === "detail") && (
          <div>
            {/* Back button */}
            <button 
              onClick={() => setCurrentView("baskets")}
              className="btn-secondary py-2 px-4 mb-6 text-sm flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Baskets
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Details, Chart & Composition */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* General Info header */}
                <div className="glass-panel p-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                    <div>
                      <h2 className="text-3xl font-bold text-[#f8fafc]">{activeVault.name}</h2>
                      <p className="text-[#94a3b8] text-sm mt-1">{activeVault.description}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-right">
                      <div className="text-xs text-[#94a3b8] font-semibold uppercase tracking-wider">Target APY</div>
                      <div className="text-3xl font-extrabold text-[#00f5a0]">
                        {liveApys[selectedVaultKey] !== undefined ? `${liveApys[selectedVaultKey]}%` : activeVault.targetApy}
                      </div>
                    </div>
                  </div>

                  {/* SVG Historical Yield curve chart */}
                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">Historical Performance (30 Days)</h4>
                      <span className="text-xs text-[#00f5a0] flex items-center gap-1 font-semibold">
                        <TrendingUp size={12} />
                        Stable Growth
                      </span>
                    </div>
                    <div className="w-full h-48 bg-black/20 rounded-xl border border-white/5 p-2 relative">
                      <svg viewBox="0 0 500 100" className="w-full h-full overflow-visible">
                        {/* Grids */}
                        <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        
                        {/* Area gradient under path */}
                        <path 
                          d="M0,80 Q70,75 140,55 T280,45 T420,25 T500,15 L500,100 L0,100 Z" 
                          fill="url(#areaGrad)" 
                          className="chart-area"
                        />
                        
                        {/* Line path */}
                        <path 
                          d="M0,80 Q70,75 140,55 T280,45 T420,25 T500,15" 
                          fill="none" 
                          stroke="url(#lineGrad)" 
                          strokeWidth="2.5" 
                          strokeLinecap="round"
                          className="chart-line"
                        />
                        
                        {/* Gradients definitions */}
                        <defs>
                          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#00f5a0" />
                            <stop offset="100%" stopColor="#00d9f5" />
                          </linearGradient>
                          <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#00f5a0" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#00f5a0" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* Chart Tooltips/Labels */}
                      <div className="absolute bottom-2 left-2 text-[10px] text-[#64748b]">30 Days Ago</div>
                      <div className="absolute bottom-2 right-2 text-[10px] text-[#64748b]">Today</div>
                    </div>
                  </div>
                </div>

                {/* Composition Details & Custom Donut Chart */}
                <div className="glass-panel p-6">
                  <h3 className="text-xl font-bold text-[#f8fafc] mb-6">Asset Composition</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    
                    {/* SVG Composition wheel donut chart */}
                    <div className="flex justify-center">
                      <svg width="180" height="180" viewBox="0 0 36 36" className="overflow-visible transform -rotate-90">
                        {/* Underlay base */}
                        <circle cx="18" cy="18" r="15.91549430918954" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
                        
                        {/* Dynamic segments */}
                        {activeVault.allocations.map((alloc: any, idx: number) => {
                          // Calculate stroke offset
                          let previousWeightsSum = 0;
                          for (let i = 0; i < idx; i++) {
                            previousWeightsSum += activeVault.allocations[i].weight;
                          }
                          return (
                            <circle 
                              key={idx}
                              cx="18" 
                              cy="18" 
                              r="15.91549430918954" 
                              fill="none" 
                              stroke={idx === 0 ? "#00f5a0" : idx === 1 ? "#00d9f5" : "#8b5cf6"} 
                              strokeWidth="4" 
                              strokeDasharray={`${alloc.weight} ${100 - alloc.weight}`} 
                              strokeDashoffset={100 - previousWeightsSum + 25} 
                              className="transition-all duration-500 hover:stroke-[5px] cursor-pointer"
                            />
                          );
                        })}
                        
                        {/* Donut Hole content */}
                        <circle cx="18" cy="18" r="12" fill="#0c111e" />
                        
                        {/* Text inside */}
                        <g transform="rotate(90 18 18)">
                          <text x="18" y="16.5" textAnchor="middle" fill="#94a3b8" fontSize="3" fontWeight="600" letterSpacing="0.1">WEIGHTS</text>
                          <text x="18" y="21" textAnchor="middle" fill="#f8fafc" fontSize="4.5" fontWeight="700">Classic</text>
                        </g>
                      </svg>
                    </div>

                    {/* Description list */}
                    <div className="flex flex-col gap-4">
                      {activeVault.allocations.map((alloc: any, idx: number) => (
                        <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`w-3.5 h-3.5 rounded-full ${idx === 0 ? "bg-[#00f5a0]" : idx === 1 ? "bg-[#00d9f5]" : "bg-purple-500"}`} />
                            <div>
                              <div className="font-semibold text-[#f8fafc] text-sm">{alloc.token.name}</div>
                              <div className="text-xs text-[#94a3b8]">{alloc.token.symbol}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[#f8fafc] text-base">{alloc.weight}%</div>
                            <div className="text-[10px] text-[#00f5a0] font-medium">Moe Pool Component</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Transaction Card */}
              <div className="flex flex-col gap-6">
                
                {/* Deposit / Withdraw Action Box */}
                <div className="glass-panel p-6 border border-[#00f5a0]/15 relative">
                  
                  {/* Glowing header light */}
                  <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-[#00f5a0]/30 to-transparent" />

                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-[#f8fafc]">Manage Asset</h3>
                    <div className="flex gap-2">
                      <span className="text-[10px] text-[#94a3b8] font-bold px-2 py-0.5 rounded-md bg-white/5 uppercase">
                        Mantle
                      </span>
                    </div>
                  </div>

                  {/* Input form */}
                  <div className="flex flex-col gap-4">
                    
                    {/* Amount Input */}
                    <div className="number-input-container">
                      <div className="flex justify-between text-xs text-[#94a3b8] font-semibold uppercase">
                        <span>Amount</span>
                        <span>
                          Wallet Bal:{" "}
                          {demoMode 
                            ? `${demoBalances[txToken]} ${txToken}` 
                            : isConnected 
                              ? "Real balance (Mantle Testnet)" 
                              : "0.00"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          placeholder="0.00"
                          value={txAmount}
                          onChange={(e) => setTxAmount(e.target.value)}
                          className="number-input"
                        />
                        
                        {/* Token Selector */}
                        <select 
                          value={txToken}
                          onChange={(e) => setTxToken(e.target.value as any)}
                          className="bg-[#0f172a] border border-white/10 text-white rounded-lg px-2 py-1.5 text-sm font-semibold outline-none focus:border-[#00f5a0]"
                        >
                          <option value="USDT">USDT</option>
                          <option value="USDC">USDC</option>
                          <option value="MNT">MNT</option>
                        </select>
                      </div>
                    </div>

                    {/* Preview details */}
                    {txAmount && parseFloat(txAmount) > 0 && (
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-xs text-[#94a3b8] flex flex-col gap-2">
                        <div className="flex justify-between">
                          <span>Split allocations:</span>
                          <span className="text-[#f8fafc] font-medium">50% / 50%</span>
                        </div>
                        <div className="flex justify-between text-[#00f5a0] font-semibold">
                          <span>~{(parseFloat(txAmount) / 2).toFixed(2)} {activeVault.allocations[0].token.symbol}</span>
                          <span>~{(parseFloat(txAmount) / 2).toFixed(2)} {activeVault.allocations[1].token.symbol}</span>
                        </div>
                        <div className="border-t border-white/5 pt-2 flex justify-between text-[10px] text-[#64748b]">
                          <span>Slippage Protection</span>
                          <span>0.5% max</span>
                        </div>
                      </div>
                    )}

                    {/* Deposit & Withdraw Buttons (Stripe/Fintech Styled) */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <button 
                        onClick={() => handleExecuteTx("deposit")}
                        className="glow-btn-primary flex-1 py-3.5"
                      >
                        Deposit
                        <ArrowUpRight size={16} />
                      </button>
                      <button 
                        onClick={() => handleExecuteTx("withdraw")}
                        className="btn-secondary flex-1 py-3.5 text-xs font-semibold"
                      >
                        Withdraw
                        <ArrowDownLeft size={16} />
                      </button>
                    </div>

                    {/* Security notice */}
                    <div className="flex items-center justify-center gap-1.5 mt-4 text-[10px] text-[#64748b] font-medium">
                      <Lock size={10} />
                      ERC4626 standard compliant vault interface
                    </div>
                  </div>
                </div>

                {/* Simulated User Vault Position */}
                <div className="glass-panel p-6">
                  <h4 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider mb-4">Your Position</h4>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#94a3b8]">Vault Shares</span>
                      <span className="text-base font-bold text-[#f8fafc]">
                        {demoMode 
                          ? `${demoBalances.shares[selectedVaultKey]} ${activeVault.symbol}` 
                          : "Connect wallet to view"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#94a3b8]">Underlying Asset Value</span>
                      <span className="text-[#00f5a0] font-bold text-base">
                        {demoMode 
                          ? `$${(demoBalances.shares[selectedVaultKey] * 1.0).toLocaleString(undefined, {minimumFractionDigits: 2})}` 
                          : "$0.00"}
                      </span>
                    </div>

                    {demoBalances.shares[selectedVaultKey] > 0 && (
                      <div className="border-t border-white/5 pt-3 mt-1 flex justify-between items-center text-xs text-[#94a3b8]">
                        <span>Interest Earned</span>
                        <InterestTicker 
                          shares={{ [selectedVaultKey]: demoBalances.shares[selectedVaultKey] }} 
                          liveApys={liveApys} 
                          vaultsList={{ [selectedVaultKey]: activeVault }}
                          prefix="+"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: USER DASHBOARD */}
        {(currentView === "dashboard") && (
          <div>
            <div className="max-w-4xl mx-auto flex flex-col gap-8">
              
              {/* Portfolio Summary Card */}
              <div className="glass-panel p-8 bg-gradient-to-r from-[#112035]/60 to-[#070913]/60 border border-[#00f5a0]/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Your Portfolio Balance</h2>
                  <div className="text-4xl sm:text-5xl font-black text-[#f8fafc] tracking-tight">
                    {demoMode 
                      ? `$${(demoBalances.shares.conservative * 1.0 + demoBalances.shares.mantleMax * 1.2 + demoBalances.shares.stableShuffle * 0.9).toLocaleString(undefined, {minimumFractionDigits: 2})}` 
                      : "$0.00"}
                  </div>
                  <p className="text-xs text-[#94a3b8] mt-2 flex items-center gap-1.5">
                    <span className="pulse-dot" />
                    Yield is compounding automatically
                  </p>
                </div>
                
                {/* Interest count up ticker */}
                <div className="bg-black/25 border border-white/5 rounded-2xl p-6 text-left min-w-[200px]">
                  <div className="text-xs text-[#94a3b8] font-bold uppercase tracking-wider mb-1">Total Yield Earned</div>
                  <div className="text-3xl font-bold">
                    {demoMode ? (
                      <InterestTicker shares={demoBalances.shares} liveApys={liveApys} vaultsList={vaultsList} />
                    ) : (
                      <span className="yield-ticker text-[#94a3b8]">$0.000000</span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#64748b] mt-1">Real-time yield count up</div>
                </div>
              </div>

              {/* Active Investments Ledger */}
              <div className="glass-panel p-6">
                <h3 className="text-xl font-bold text-[#f8fafc] mb-6">Active Allocations</h3>

                <div className="flex flex-col gap-4">
                  {Object.keys(vaultsList).map((key) => {
                    const vault = vaultsList[key];
                    const shareBal = demoMode ? demoBalances.shares[key] || 0 : 0;
                    
                    return (
                      <div key={key} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🧺</span>
                          <div>
                            <h4 className="font-bold text-[#f8fafc]">{vault.name}</h4>
                            <p className="text-xs text-[#94a3b8]">{vault.symbol} shares</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 sm:flex sm:gap-12 gap-2 text-left w-full sm:w-auto">
                          <div>
                            <div className="text-[10px] text-[#94a3b8] font-bold uppercase">Allocated</div>
                            <div className="font-semibold text-sm text-[#f8fafc]">{shareBal} shares</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[#94a3b8] font-bold uppercase">Estimated Value</div>
                            <div className="font-semibold text-sm text-[#00f5a0]">${(shareBal * 1.0).toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[#94a3b8] font-bold uppercase">APY</div>
                            <div className="font-semibold text-sm text-[#f8fafc]">
                              {liveApys[key] !== undefined ? `${liveApys[key]}%` : vault.targetApy}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                          <button 
                            onClick={() => {
                              setSelectedVaultKey(key as keyof typeof VAULTS);
                              setCurrentView("detail");
                            }}
                            className="btn-secondary py-2 px-4 text-xs font-semibold flex-grow sm:flex-grow-0"
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: GAMIFIED LEADERBOARD */}
        {(currentView === "leaderboard") && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#f8fafc] mb-2">Yield Leaderboard</h2>
              <p className="text-[#94a3b8] text-sm">Real-time yield leaders on the Mantle Network</p>
            </div>

            <div className="glass-panel overflow-hidden">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider bg-white/2">
                    <th className="p-4 text-center">Rank</th>
                    <th className="p-4">Address / Nickname</th>
                    <th className="p-4">Active Baskets</th>
                    <th className="p-4 text-right">Yield Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-[#f8fafc]">
                  {[
                    { rank: 1, address: "replytim.mnt", baskets: 3, yield: "$423.82", badge: "Yield King", active: true },
                    { rank: 2, address: "0x7099...79c8", baskets: 2, yield: demoMode ? <InterestTicker shares={demoBalances.shares} liveApys={liveApys} vaultsList={vaultsList} /> : "$0.00", badge: "You", active: true, highlight: true },
                    { rank: 3, address: "vitalik.eth", baskets: 2, yield: "$128.52", badge: "Pioneer" },
                    { rank: 4, address: "0x3c44...62b9", baskets: 1, yield: "$84.21", badge: "Regular" },
                    { rank: 5, address: "0x90f7...72ff", baskets: 1, yield: "$32.40", badge: "Regular" },
                  ].map((row, idx) => (
                    <tr key={idx} className={`transition-colors ${row.highlight ? "bg-[#00f5a0]/5 hover:bg-[#00f5a0]/10" : "hover:bg-white/2"}`}>
                      <td className="p-4 text-center font-bold">
                        {row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : row.rank}
                      </td>
                      <td className="p-4 font-semibold flex items-center gap-2">
                        {row.address}
                        {row.badge && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            row.badge === "Yield King" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            row.badge === "You" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                          }`}>
                            {row.badge}
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-medium text-[#94a3b8]">{row.baskets} baskets</td>
                      <td className="p-4 text-right font-bold text-[#00f5a0]">{row.yield}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* TRANSACTION PROGRESS MODAL */}
      {txModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel max-w-md w-full p-8 mx-4 border border-[#00f5a0]/25 relative">
            <h3 className="text-xl font-bold text-center text-[#f8fafc] mb-6 capitalize">
              {txType === "deposit" ? "Processing Deposit" : "Processing Withdrawal"}
            </h3>

            {/* Stepper Progress */}
            {txStatus === "loading" && (
              <div className="flex flex-col gap-6">
                {[
                  { step: 1, text: txType === "deposit" ? "Approve Token Spend Limit" : "Burning Vault Shares" },
                  { step: 2, text: txType === "deposit" ? "Routing Swap on Merchant Moe" : "Removing Liquidity from Pool" },
                  { step: 3, text: txType === "deposit" ? "Deploying Assets to LP Pool" : "Swapping Pool Components back to Asset" },
                  { step: 4, text: txType === "deposit" ? "Minting BasketFlow Vault Shares" : "Crediting Asset to Wallet" },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-sm ${
                      txStep > s.step ? "bg-[#00f5a0] text-slate-900 border-[#00f5a0]" :
                      txStep === s.step ? "bg-white/10 text-[#00f5a0] border-[#00f5a0] animate-pulse" :
                      "bg-white/2 text-[#64748b] border-white/5"
                    }`}>
                      {txStep > s.step ? "✓" : s.step}
                    </div>
                    <span className={`text-sm font-medium ${txStep === s.step ? "text-[#f8fafc] font-bold" : "text-[#94a3b8]"}`}>
                      {s.text}
                    </span>
                  </div>
                ))}
                
                {/* Loader bar */}
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                  <div 
                    style={{ width: `${(txStep / 4) * 100}%` }}
                    className="h-full bg-gradient-to-r from-[#00f5a0] to-[#00d9f5] transition-all duration-300"
                  />
                </div>
              </div>
            )}

            {/* Success screen */}
            {txStatus === "success" && (
              <div className="text-center flex flex-col items-center gap-4">
                <div className="bg-[#00f5a0]/10 border border-[#00f5a0]/30 p-4 rounded-full text-[#00f5a0] mb-2">
                  <CheckCircle size={48} />
                </div>
                <h4 className="text-2xl font-black text-[#f8fafc]">Transaction Completed!</h4>
                <p className="text-sm text-[#94a3b8]">
                  {txType === "deposit" 
                    ? "Your funds have been split and allocated to the LP pools. You are now earning active yield!" 
                    : "Your vault position has been closed and assets have been returned to your wallet."}
                </p>
                
                {/* Simulated Etherscan link */}
                <div className="mt-4 flex items-center gap-1.5 text-xs text-[#00f5a0] font-semibold cursor-pointer">
                  <span>View on Mantle Explorer</span>
                  <ExternalLink size={12} />
                </div>

                <button 
                  onClick={() => {
                    setTxModalOpen(false);
                    setTxStatus("idle");
                    setCurrentView("dashboard");
                  }}
                  className="glow-btn-primary w-full mt-6 py-3"
                >
                  Go to Dashboard
                </button>
              </div>
            )}

            {/* Error screen */}
            {txStatus === "error" && (
              <div className="text-center flex flex-col items-center gap-4">
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-full text-red-500 mb-2">
                  <span className="text-4xl">❌</span>
                </div>
                <h4 className="text-2xl font-black text-red-500">Transaction Failed</h4>
                <p className="text-xs text-[#94a3b8] max-h-24 overflow-y-auto w-full p-2 bg-black/20 rounded border border-white/5 text-left font-mono">
                  {txError}
                </p>
                <div className="flex gap-4 w-full mt-4">
                  <button 
                    onClick={() => handleExecuteTx(txType)}
                    className="glow-btn-primary flex-1 py-3"
                  >
                    Retry
                  </button>
                  <button 
                    onClick={() => {
                      setTxModalOpen(false);
                      setTxStatus("idle");
                    }}
                    className="btn-secondary flex-1 py-3"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NOOB TUTORIAL MODAL */}
      {tutorialOpen && (
        <div className="modal-overlay">
          <div className="glass-panel max-w-lg w-full p-8 mx-4 border border-amber-500/25 relative">
            
            {/* Close button */}
            <button 
              onClick={() => setTutorialOpen(false)}
              className="absolute top-4 right-4 text-[#94a3b8] hover:text-white font-bold"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                🐣 Super Simple Guide
              </span>
              <h3 className="text-2xl font-black text-[#f8fafc] mt-2">
                Beginner's Guide to BasketFlow
              </h3>
            </div>

            {/* Slide Content */}
            <div className="min-h-[240px] bg-black/20 rounded-xl p-6 border border-white/5 flex flex-col justify-center text-center">
              {tutorialStep === 0 && (
                <div>
                  <div className="text-4xl mb-4">🧺</div>
                  <h4 className="text-lg font-bold text-[#f8fafc] mb-2">1. What is a "Basket"?</h4>
                  <p className="text-sm text-[#94a3b8] leading-relaxed">
                    Imagine buying a <strong>fruit bowl</strong> instead of just apples. A basket is a mix of different coins.
                  </p>
                  <p className="text-xs text-[#64748b] mt-3 leading-relaxed">
                    If you put your cash in a basket, it splits it automatically. This keeps your cash safe: if one coin goes down, the others stand strong to protect you!
                  </p>
                </div>
              )}

              {tutorialStep === 1 && (
                <div>
                  <div className="text-4xl mb-4">💵</div>
                  <h4 className="text-lg font-bold text-[#f8fafc] mb-2">2. What are USDT and USDC?</h4>
                  <p className="text-sm text-[#94a3b8] leading-relaxed">
                    Think of these as <strong>Digital Dollars</strong>. 
                  </p>
                  <p className="text-xs text-[#64748b] mt-3 leading-relaxed">
                    Unlike other crypto coins (like Bitcoin) that go up and down like a rollercoaster, 1 Digital Dollar is <strong>always worth exactly 1 US Dollar</strong>. Safe and stable!
                  </p>
                </div>
              )}

              {tutorialStep === 2 && (
                <div>
                  <div className="text-4xl mb-4">💸</div>
                  <h4 className="text-lg font-bold text-[#f8fafc] mb-2">3. Where does the "Yield" come from?</h4>
                  <p className="text-sm text-[#94a3b8] leading-relaxed">
                    Every time someone buys or sells crypto, they pay a tiny <strong>swipe fee</strong> (just like using a credit card at a store).
                  </p>
                  <p className="text-xs text-[#64748b] mt-3 leading-relaxed">
                    By putting your Digital Dollars into a pool, you help power these trades. The market pays you a share of those swipe fees! This earnings rate is called your <strong>APY</strong>.
                  </p>
                </div>
              )}

              {tutorialStep === 3 && (
                <div>
                  <div className="text-4xl mb-4">⚡</div>
                  <h4 className="text-lg font-bold text-[#f8fafc] mb-2">4. What does BasketFlow do?</h4>
                  <p className="text-sm text-[#94a3b8] leading-relaxed">
                    Normally, setting this up takes <strong>5 complicated steps</strong> on scary websites, signing your wallet 5 times, and paying multiple fees.
                  </p>
                  <p className="text-xs text-[#64748b] mt-3 leading-relaxed">
                    BasketFlow does all of this in <strong>one single click</strong>. You just deposit your Digital Dollars, and our smart code handles all the math and trading behind the scenes!
                  </p>
                </div>
              )}

              {tutorialStep === 4 && (
                <div>
                  <div className="text-4xl mb-4">🚪</div>
                  <h4 className="text-lg font-bold text-[#f8fafc] mb-2">5. Can I get my money back?</h4>
                  <p className="text-sm text-[#94a3b8] leading-relaxed">
                    Yes, anytime! Your money is <strong>never locked</strong>.
                  </p>
                  <p className="text-xs text-[#64748b] mt-3 leading-relaxed">
                    Clicking "Withdraw" instantly turns your basket back into plain Digital Dollars and sends them straight to your wallet. You keep 100% of the profits you earned!
                  </p>
                </div>
              )}
            </div>

            {/* Stepper Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {[0, 1, 2, 3, 4].map((step) => (
                <div 
                  key={step}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    tutorialStep === step ? "bg-amber-400" : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            {/* Nav buttons */}
            <div className="flex gap-4 mt-6">
              <button 
                onClick={() => setTutorialStep((prev) => Math.max(0, prev - 1))}
                disabled={tutorialStep === 0}
                className="btn-secondary flex-1 py-3 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Back
              </button>
              
              <button 
                onClick={() => {
                  if (tutorialStep === 4) {
                    setTutorialOpen(false);
                  } else {
                    setTutorialStep((prev) => Math.min(4, prev + 1));
                  }
                }}
                className="glow-btn-primary flex-1 py-3 text-xs bg-gradient-to-r from-amber-500 to-yellow-500 border border-amber-400 text-slate-900"
              >
                {tutorialStep === 4 ? "Got it, let's earn!" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM BASKET MODAL */}
      {createBasketModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel max-w-md w-full p-8 mx-4 border border-[#00f5a0]/25 relative">
            <button 
              onClick={() => {
                if (createBasketStatus !== "loading") {
                  setCreateBasketModalOpen(false);
                  setCreateBasketStatus("idle");
                }
              }}
              className="absolute top-4 right-4 text-[#94a3b8] hover:text-white font-bold"
              disabled={createBasketStatus === "loading"}
            >
              ✕
            </button>

            <h3 className="text-2xl font-bold text-center text-[#f8fafc] mb-6">
              Create Custom Basket
            </h3>

            {createBasketStatus === "idle" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#94a3b8] uppercase font-bold">Basket Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Mantle Yield Maxima"
                    value={newBasketName}
                    onChange={(e) => setNewBasketName(e.target.value)}
                    className="bg-[#0f172a] border border-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00f5a0]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#94a3b8] uppercase font-bold">Token 1</label>
                    <select 
                      value={newBasketTokenA}
                      onChange={(e) => setNewBasketTokenA(e.target.value as any)}
                      className="bg-[#0f172a] border border-white/10 text-white rounded-lg px-2 py-2 text-sm outline-none focus:border-[#00f5a0]"
                    >
                      {Object.keys(TOKENS).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#94a3b8] uppercase font-bold">Token 2</label>
                    <select 
                      value={newBasketTokenB}
                      onChange={(e) => setNewBasketTokenB(e.target.value as any)}
                      className="bg-[#0f172a] border border-white/10 text-white rounded-lg px-2 py-2 text-sm outline-none focus:border-[#00f5a0]"
                    >
                      {Object.keys(TOKENS).map((t) => (
                        <option key={t} value={t} disabled={t === newBasketTokenA}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-[#94a3b8] uppercase font-bold">
                    <span>Allocation Weight</span>
                    <span>{newBasketWeightA}% / {100 - newBasketWeightA}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="90" 
                    step="5"
                    value={newBasketWeightA}
                    onChange={(e) => setNewBasketWeightA(parseInt(e.target.value))}
                    className="w-full accent-[#00f5a0]"
                  />
                  <div className="flex justify-between text-[10px] text-[#64748b]">
                    <span>More {newBasketTokenA}</span>
                    <span>More {newBasketTokenB}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#94a3b8] uppercase font-bold">Risk Level</label>
                    <select 
                      value={newBasketRisk}
                      onChange={(e) => setNewBasketRisk(e.target.value)}
                      className="bg-[#0f172a] border border-white/10 text-white rounded-lg px-2 py-2 text-sm outline-none focus:border-[#00f5a0]"
                    >
                      <option value="Minimal">Minimal Risk</option>
                      <option value="Low">Low Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="High">High Risk</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#94a3b8] uppercase font-bold">Target APY (%)</label>
                    <input 
                      type="number" 
                      placeholder="12.5"
                      value={newBasketApy}
                      onChange={(e) => setNewBasketApy(e.target.value)}
                      className="bg-[#0f172a] border border-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00f5a0]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#94a3b8] uppercase font-bold">Description</label>
                  <textarea 
                    placeholder="Describe your strategy..."
                    value={newBasketDesc}
                    onChange={(e) => setNewBasketDesc(e.target.value)}
                    rows={2}
                    className="bg-[#0f172a] border border-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00f5a0] resize-none"
                  />
                </div>

                <button 
                  onClick={handleCreateBasket}
                  disabled={!newBasketName || !newBasketApy}
                  className="glow-btn-primary w-full mt-4 py-3"
                >
                  Deploy Custom Vault
                  <ArrowUpRight size={16} />
                </button>
              </div>
            )}

            {createBasketStatus === "loading" && (
              <div className="flex flex-col gap-6">
                {[
                  { step: 1, text: "Generate Vault Yul Code & Compiler Optimizer" },
                  { step: 2, text: "Deploying ERC-4626 Vault Contract on Mantle" },
                  { step: 3, text: "Setting Swaps & Merchant Moe Router paths" },
                  { step: 4, text: "Verifying ABI on Mantle Chain Explorer" },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-sm ${
                      createBasketStep > s.step ? "bg-[#00f5a0] text-slate-900 border-[#00f5a0]" :
                      createBasketStep === s.step ? "bg-white/10 text-[#00f5a0] border-[#00f5a0] animate-pulse" :
                      "bg-white/2 text-[#64748b] border-white/5"
                    }`}>
                      {createBasketStep > s.step ? "✓" : s.step}
                    </div>
                    <span className={`text-sm font-medium ${createBasketStep === s.step ? "text-[#f8fafc] font-bold" : "text-[#94a3b8]"}`}>
                      {s.text}
                    </span>
                  </div>
                ))}

                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                  <div 
                    style={{ width: `${(createBasketStep / 4) * 100}%` }}
                    className="h-full bg-gradient-to-r from-[#00f5a0] to-[#00d9f5] transition-all duration-300"
                  />
                </div>
              </div>
            )}

            {createBasketStatus === "success" && (
              <div className="text-center flex flex-col items-center gap-4">
                <div className="bg-[#00f5a0]/10 border border-[#00f5a0]/30 p-4 rounded-full text-[#00f5a0] mb-2">
                  <CheckCircle size={48} />
                </div>
                <h4 className="text-2xl font-black text-[#f8fafc]">Basket Deployed!</h4>
                <p className="text-sm text-[#94a3b8]">
                  Your custom ERC-4626 vault contract was compiled and successfully deployed to the Mantle testnet. You can now deposit and withdraw funds directly from it!
                </p>

                <button 
                  onClick={() => {
                    setCreateBasketModalOpen(false);
                    setCreateBasketStatus("idle");
                  }}
                  className="glow-btn-primary w-full mt-6 py-3"
                >
                  Done
                </button>
              </div>
            )}

            {createBasketStatus === "error" && (
              <div className="text-center flex flex-col items-center gap-4">
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-full text-red-500 mb-2">
                  <span className="text-4xl">❌</span>
                </div>
                <h4 className="text-2xl font-black text-red-500">Deployment Failed</h4>
                <p className="text-xs text-[#94a3b8] max-h-24 overflow-y-auto w-full p-2 bg-black/20 rounded border border-white/5 text-left font-mono">
                  {createBasketError}
                </p>
                <div className="flex gap-4 w-full mt-4">
                  <button 
                    onClick={handleCreateBasket}
                    className="glow-btn-primary flex-1 py-3"
                  >
                    Retry
                  </button>
                  <button 
                    onClick={() => {
                      setCreateBasketModalOpen(false);
                      setCreateBasketStatus("idle");
                    }}
                    className="btn-secondary flex-1 py-3"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {appMode === "app" && (
        <div className="md:hidden mobile-nav-bar">
          <button 
            onClick={() => setCurrentView("baskets")} 
            className={`mobile-nav-item ${currentView === "baskets" || currentView === "detail" ? "active" : ""}`}
          >
            <TrendingUp size={20} />
            <span>Invest</span>
          </button>
          <button 
            onClick={() => setCurrentView("dashboard")} 
            className={`mobile-nav-item ${currentView === "dashboard" ? "active" : ""}`}
          >
            <DollarSign size={20} />
            <span>Portfolio</span>
          </button>
          <button 
            onClick={() => setCurrentView("leaderboard")} 
            className={`mobile-nav-item ${currentView === "leaderboard" ? "active" : ""}`}
          >
            <Award size={20} />
            <span>Leaderboard</span>
          </button>
        </div>
      )}

      {/* FOOTER */}
      <footer className="w-full border-t border-white/5 py-8 mt-12 bg-black/10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#64748b]">
          <div>
            © {new Date().getFullYear()} BasketFlow. DeFi LP Baskets for everyone.
          </div>
          <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer">Security Audits</span>
            <span className="hover:text-white cursor-pointer">Mantle Subgraph</span>
            <span className="hover:text-white cursor-pointer">Terms & Conditions</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
