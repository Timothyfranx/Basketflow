import { useState, useEffect, memo } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  Award, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  ArrowLeft, 
  ShieldCheck, 
  Activity, 
  BookOpen, 
  Plus, 
  ChevronRight
} from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { 
  useAccount, 
  useWriteContract, 
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import { TOKENS, VAULTS, VAULT_ABI, ERC20_ABI } from "./contracts";

// --- MEMOIZED COUNTERS & PERFORMANCE TICKERS ---
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

    const timer = setInterval(() => {
      setInterest((prev) => prev + (totalYieldPerSecond / 10) * speedUp);
    }, 100);

    return () => clearInterval(timer);
  }, [shares, liveApys, vaultsList, speedUp]);

  return <span className="yield-ticker text-emerald-400 font-bold">{prefix}${interest.toFixed(6)}</span>;
});

export const PerformanceChart = memo(({ vaultKey }: { vaultKey: string }) => {
  let pathD = "M0,80 Q70,75 140,55 T280,45 T420,25 T500,15";
  let areaD = "M0,80 Q70,75 140,55 T280,45 T420,25 T500,15 L500,100 L0,100 Z";
  let colorStart = "#00ff9d";
  let colorEnd = "#00e5ff";
  
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
        <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        
        <path d={areaD} fill={`url(#${gradIdArea})`} className="chart-area" />
        <path d={pathD} fill="none" stroke={`url(#${gradIdLine})`} strokeWidth="2.5" strokeLinecap="round" className="chart-line" />
        
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
      <div className="absolute bottom-2 left-2 text-[10px] text-[#64748b]">30 Days Ago</div>
      <div className="absolute bottom-2 right-2 text-[10px] text-[#64748b]">Today</div>
    </div>
  );
});

export const CompositionChart = memo(({ allocations }: { allocations: any[] }) => {
  return (
    <div className="flex justify-center">
      <svg width="160" height="160" viewBox="0 0 36 36" className="overflow-visible transform -rotate-90">
        <circle cx="18" cy="18" r="15.91549430918954" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4.5" />
        
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
              stroke={idx === 0 ? "#00ff9d" : idx === 1 ? "#00e5ff" : "#8b5cf6"} 
              strokeWidth="4.5" 
              strokeDasharray={`${alloc.weight} ${100 - alloc.weight}`} 
              strokeDashoffset={100 - previousWeightsSum + 25} 
              className="transition-all duration-500 hover:stroke-[6px] cursor-pointer"
            />
          );
        })}
        
        <circle cx="18" cy="18" r="11" fill="#02040a" />
        
        <g transform="rotate(90 18 18)">
          <text x="18" y="16.5" textAnchor="middle" fill="#94a3b8" fontSize="2.8" fontWeight="700" letterSpacing="0.1">WEIGHTS</text>
          <text x="18" y="21" textAnchor="middle" fill="#f8fafc" fontSize="4.2" fontWeight="800">Classic</text>
        </g>
      </svg>
    </div>
  );
});

// --- INTERACTIVE YIELD ROUTING PLAYGROUND ---
interface YieldRoutingVisualizerProps {
  liveApys: Record<string, number>;
  vaultsList: Record<string, any>;
}

export const YieldRoutingVisualizer = memo(({ liveApys, vaultsList }: YieldRoutingVisualizerProps) => {
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
      timer = setTimeout(() => setSimState("swapping"), 1200);
    } else if (simState === "swapping") {
      setSimProgress(50);
      timer = setTimeout(() => setSimState("pooling"), 1500);
    } else if (simState === "pooling") {
      setSimProgress(80);
      timer = setTimeout(() => setSimState("complete"), 1200);
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

  return (
    <div className="glass-panel p-6 bg-black/40 border border-[#00ff9d]/10 relative overflow-hidden flex flex-col gap-6">
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#00ff9d]/5 rounded-full blur-[90px] pointer-events-none" />
      
      <div>
        <h4 className="text-base font-bold text-[#f8fafc] mb-1">Interactive Yield Router</h4>
        <p className="text-xs text-[#94a3b8]">Simulate how BasketFlow splits, swaps, and stakes assets in a single click.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Controls */}
        <div className="p-4 bg-white/2 border border-white/5 rounded-2xl flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-wider">Input Asset</label>
              <div className="flex gap-2">
                {(["USDT", "USDC", "MNT"] as const).map((t) => (
                  <button
                    key={t}
                    disabled={simState !== "idle"}
                    onClick={() => setSimToken(t)}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all ${simToken === t ? "bg-[#00ff9d]/10 border-[#00ff9d]/40 text-[#00ff9d]" : "bg-black/20 border-white/5 text-[#94a3b8]"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-wider">Amount</label>
              <input
                type="number"
                disabled={simState !== "idle"}
                value={simAmount}
                onChange={(e) => setSimAmount(e.target.value)}
                className="bg-black/40 border border-white/5 text-white rounded-lg px-2.5 py-1 text-xs font-semibold outline-none focus:border-[#00ff9d]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-wider">Target Vault</label>
              <select
                disabled={simState !== "idle"}
                value={simVaultKey}
                onChange={(e) => setSimVaultKey(e.target.value)}
                className="bg-black/40 border border-white/5 text-white rounded-lg px-2 py-1 text-xs font-semibold outline-none focus:border-[#00ff9d]"
              >
                {Object.keys(vaultsList).map((key) => (
                  <option key={key} value={key}>{vaultsList[key].name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => setSimState(simState === "idle" ? "routing" : "idle")}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${simState === "idle" ? "glow-btn-primary" : "btn-secondary text-red-400 border-red-500/10 hover:bg-red-500/5 hover:border-red-500/25"}`}
          >
            {simState === "idle" ? (
              <>
                <span>Simulate Routing</span>
                <ArrowUpRight size={14} />
              </>
            ) : (
              <span>Reset Simulator</span>
            )}
          </button>
        </div>

        {/* Nodes Canvas */}
        <div className="md:col-span-2 p-4 bg-white/2 border border-white/5 rounded-2xl flex flex-col justify-between relative min-h-[200px] overflow-hidden">
          <div className="absolute top-1/2 left-6 right-6 h-[1px] bg-white/5 -translate-y-1/2 pointer-events-none z-0 hidden sm:block" />
          {simProgress > 0 && (
            <div 
              style={{ width: `${simProgress - 15}%` }}
              className="absolute top-1/2 left-6 h-[1px] bg-gradient-to-r from-[#00ff9d] to-[#00e5ff] -translate-y-1/2 pointer-events-none z-0 transition-all duration-1000 hidden sm:block" 
            />
          )}

          <div className="flex items-center gap-2 mb-3 z-10">
            <span className="w-5 h-5 rounded-full bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[10px] font-bold text-[#00ff9d] flex items-center justify-center">2</span>
            <span className="text-xs font-bold text-[#f8fafc]">Routing Visualizer</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 my-auto">
            {/* Input Node */}
            <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl border bg-black/40 transition-all duration-500 ${simState !== "idle" ? "border-[#00ff9d] shadow-[0_0_12px_rgba(0,255,157,0.15)]" : "border-white/5"}`}>
              <span className="text-xl mb-0.5">💳</span>
              <span className="text-[9px] font-bold text-[#f8fafc]">{simAmount}</span>
              <span className="text-[7px] text-[#94a3b8] uppercase font-semibold">{simToken}</span>
            </div>

            {/* Path 1 */}
            <span className={`text-sm animate-pulse hidden sm:inline ${simState === "routing" ? "text-[#00ff9d]" : "text-[#4b5563]"}`}>➔</span>

            {/* Router Node */}
            <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border bg-black/60 transition-all duration-500 relative ${
              simState === "swapping" ? "border-[#00ff9d] shadow-[0_0_15px_rgba(0,255,157,0.2)] scale-105" :
              simState === "pooling" || simState === "complete" ? "border-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.1)]" :
              "border-white/5"
            }`}>
              {simState === "swapping" && (
                <div className="absolute inset-1.5 border border-dashed border-[#00ff9d] rounded-full animate-spin pointer-events-none" />
              )}
              <span className="text-xl mb-0.5">🧺</span>
              <span className="text-[8px] font-bold text-[#f8fafc] text-center leading-none">Router</span>
            </div>

            {/* Path 2 */}
            <span className={`text-sm animate-pulse hidden sm:inline ${simState === "pooling" ? "text-[#00e5ff]" : "text-[#4b5563]"}`}>➔</span>

            {/* Vault Node */}
            <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl border bg-black/40 transition-all duration-500 ${simState === "complete" ? "border-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.2)] scale-105" : "border-white/5"}`}>
              <span className="text-xl mb-0.5">🛡️</span>
              <span className="text-[9px] font-bold text-[#f8fafc]">{activeVault.symbol}</span>
              <span className="text-[7px] text-[#00e5ff] uppercase font-semibold">Staked</span>
            </div>
          </div>

          <div className="mt-3 p-2 rounded-lg bg-black/30 border border-white/5 text-center text-[10px] text-[#94a3b8]">
            {simState === "idle" && "Trigger 'Simulate Routing' to start the demo flow."}
            {simState === "routing" && `Validating and routing ${simAmount} ${simToken} on Mantle...`}
            {simState === "swapping" && `Swapping ${simToken} to constituent LP pool tokens...`}
            {simState === "pooling" && `Depositing swaps into Moe Pools and staking LPs in compounder...`}
            {simState === "complete" && `Vault shares issued. Compounding yield accrues below:`}
          </div>
        </div>
      </div>

      {simState === "complete" && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#00ff9d]/5 to-[#00e5ff]/5 border border-[#00ff9d]/20 flex justify-between items-center animate-fadeIn">
          <div>
            <h5 className="text-xs font-bold text-[#00ff9d] flex items-center gap-1.5">
              <span className="pulse-dot" />
              Compounding Active
            </h5>
            <p className="text-[10px] text-[#94a3b8]">Compounding mock yield at 150x speed (APY: {apy}%):</p>
          </div>
          <span className="text-lg font-mono font-bold text-[#00ff9d]">+${simYield.toFixed(6)}</span>
        </div>
      )}
    </div>
  );
});

// --- MAIN CLIENT COMPONENT ---
export default function App() {
  const { isConnected, address } = useAccount();
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [appMode, setAppMode] = useState<"landing" | "app">("landing");
  const [currentView, setCurrentView] = useState<"baskets" | "dashboard" | "leaderboard" | "detail">("baskets");
  
  // Custom states
  const [vaultsList, setVaultsList] = useState<Record<string, any>>(VAULTS);
  const [selectedVaultKey, setSelectedVaultKey] = useState<string>("conservative");
  const activeVault = vaultsList[selectedVaultKey] || vaultsList["conservative"];

  // Mock balances
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
      USDT: 2000.0,
      USDC: 1200.0,
      MNT: 600.0,
      shares: initialShares,
    };
  });

  const [txAmount, setTxAmount] = useState<string>("");
  const [txToken, setTxToken] = useState<"USDT" | "USDC" | "MNT">("USDT");
  const [txModalOpen, setTxModalOpen] = useState<boolean>(false);
  const [txType, setTxType] = useState<"deposit" | "withdraw">("deposit");
  const [txStatus, setTxStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [txStep, setTxStep] = useState<number>(0);
  const [txError, setTxError] = useState<string>("");

  // Live simulation states
  const [liveTVL, setLiveTVL] = useState<number>(2438720);
  const [liveDepositors, setLiveDepositors] = useState<number>(3842);
  const [liveApys, setLiveApys] = useState<Record<string, number>>(() => {
    const initialApys: Record<string, number> = {};
    Object.keys(VAULTS).forEach((key) => {
      const range = VAULTS[key as keyof typeof VAULTS].targetApy.replace("%", "").split("-");
      initialApys[key] = range.length === 2 ? (parseFloat(range[0]) + parseFloat(range[1])) / 2 : parseFloat(range[0]);
    });
    return initialApys;
  });
  const [apyDirection, setApyDirection] = useState<Record<string, "up" | "down" | "flat">>({});

  const [activities, setActivities] = useState<Array<{ id: number; text: string; time: string }>>([
    { id: 1, text: "0x8f...4e deposited $1,200 into Stable Shuffle", time: "Just now" },
    { id: 2, text: "vitalik.mnt deposited $25,000 into Mantle Max", time: "2m ago" },
    { id: 3, text: "0x3d...7c withdrew $400 from Conservative Care", time: "5m ago" },
  ]);

  // Onboarding Tutorial slides
  const [tutorialOpen, setTutorialOpen] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(0);

  // Custom Basket states
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

  // Real Web3 triggers
  const { writeContract, data: txHash, error: web3WriteError } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  // Fluctuate stats
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveApys((prev) => {
        const next = { ...prev };
        const dirs: Record<string, "up" | "down" | "flat"> = {};
        Object.keys(next).forEach((key) => {
          const change = (Math.random() - 0.5) * 0.2;
          const oldVal = next[key];
          let newVal = oldVal + change;
          
          const vault = vaultsList[key];
          if (vault && vault.targetApy) {
            const range = vault.targetApy.replace("%", "").split("-");
            if (range.length === 2) {
              const min = parseFloat(range[0]);
              const max = parseFloat(range[1]);
              if (newVal < min || newVal > max) newVal = oldVal - change;
            }
          }
          next[key] = parseFloat(newVal.toFixed(2));
          dirs[key] = change > 0 ? "up" : change < 0 ? "down" : "flat";
        });
        setApyDirection(dirs);
        setTimeout(() => setApyDirection({}), 2000);
        return next;
      });
      setLiveTVL((prev) => prev + Math.floor((Math.random() - 0.4) * 200));
      setLiveDepositors((prev) => prev + (Math.random() > 0.8 ? 1 : Math.random() < 0.2 ? -1 : 0));
    }, 5000);
    return () => clearInterval(timer);
  }, [vaultsList]);

  // Simulated activity feed
  useEffect(() => {
    const feed = ["0x2a", "replytim", "vitalik", "0xef", "0x5d", "dan.mnt"];
    const acts = ["deposited", "withdrew"];
    const values = [250, 600, 1500, 4000, 9000];

    const timer = setInterval(() => {
      const keys = Object.keys(vaultsList);
      if (keys.length === 0) return;
      const key = keys[Math.floor(Math.random() * keys.length)];
      const act = acts[Math.floor(Math.random() * acts.length)];
      const val = values[Math.floor(Math.random() * values.length)];
      const name = feed[Math.floor(Math.random() * feed.length)] + (Math.random() > 0.5 ? ".eth" : "...7c");
      
      const newText = `${name} ${act} $${val.toLocaleString()} ${act === "deposited" ? "into" : "from"} ${vaultsList[key].name}`;
      setActivities((prev) => [{ id: Date.now(), text: newText, time: "Just now" }, ...prev.slice(0, 2)]);
    }, 8000);
    return () => clearInterval(timer);
  }, [vaultsList]);

  // Execute Deposit / Withdraw
  const handleExecuteTx = async (type: "deposit" | "withdraw") => {
    if (!txAmount || parseFloat(txAmount) <= 0) return;
    setTxType(type);
    setTxStatus("loading");
    setTxModalOpen(true);
    setTxError("");

    if (demoMode) {
      try {
        const val = parseFloat(txAmount);
        if (type === "deposit") {
          if (demoBalances[txToken] < val) throw new Error("Insufficient balance in mock wallet.");
          setTxStep(1); await new Promise((res) => setTimeout(res, 1200));
          setTxStep(2); await new Promise((res) => setTimeout(res, 1200));
          setTxStep(3); await new Promise((res) => setTimeout(res, 1200));
          setTxStep(4); await new Promise((res) => setTimeout(res, 800));

          setDemoBalances((prev) => ({
            ...prev,
            [txToken]: prev[txToken] - val,
            shares: { ...prev.shares, [selectedVaultKey]: prev.shares[selectedVaultKey] + val }
          }));
        } else {
          if (demoBalances.shares[selectedVaultKey] < val) throw new Error("Insufficient shares to withdraw.");
          setTxStep(1); await new Promise((res) => setTimeout(res, 1200));
          setTxStep(2); await new Promise((res) => setTimeout(res, 1200));
          setTxStep(3); await new Promise((res) => setTimeout(res, 1200));
          setTxStep(4); await new Promise((res) => setTimeout(res, 800));

          setDemoBalances((prev) => ({
            ...prev,
            [txToken]: prev[txToken] + val,
            shares: { ...prev.shares, [selectedVaultKey]: Math.max(0, prev.shares[selectedVaultKey] - val) }
          }));
        }
        setTxStatus("success");
        setTxAmount("");
      } catch (err: any) {
        setTxStatus("error");
        setTxError(err.message || "Simulation failed.");
      }
    } else {
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
          setTxStep(1);
          await writeContract({
            address: TOKENS[txToken].address,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [activeVault.address, amountWei],
          });
          
          setTxStep(2);
          const pathA = [TOKENS[txToken].address, activeVault.allocations[0].token.address];
          const pathB = [TOKENS[txToken].address, activeVault.allocations[1].token.address];

          await writeContract({
            address: activeVault.address,
            abi: VAULT_ABI,
            functionName: "depositWithERC20",
            args: [TOKENS[txToken].address, amountWei, 0n, pathA, pathB, 0n, 0n, 0n, 0n, deadline]
          });
        } else {
          setTxStep(1);
          const pathA = [activeVault.allocations[0].token.address, TOKENS[txToken].address];
          const pathB = [activeVault.allocations[1].token.address, TOKENS[txToken].address];

          await writeContract({
            address: activeVault.address,
            abi: VAULT_ABI,
            functionName: "withdrawToERC20",
            args: [amountWei, TOKENS[txToken].address, 0n, 0n, pathA, pathB, 0n, 0n, 0n, deadline]
          });
        }
      } catch (err: any) {
        setTxStatus("error");
        setTxError(err.message || "Write transaction failed.");
      }
    }
  };

  // Watch real tx receipt
  useEffect(() => {
    if (isTxConfirming) {
      setTxStatus("loading");
      setTxStep(3);
    }
    if (isTxConfirmed) {
      setTxStatus("success");
      setTxAmount("");
    }
    if (web3WriteError) {
      setTxStatus("error");
      setTxError(web3WriteError.message || "Blockchain transaction failed.");
    }
  }, [isTxConfirming, isTxConfirmed, web3WriteError]);

  // Create custom strategy
  const handleCreateBasket = async () => {
    if (!newBasketName) return;
    setCreateBasketStatus("loading");
    setCreateBasketStep(1);

    try {
      await new Promise((res) => setTimeout(res, 1200));
      setCreateBasketStep(2);
      await new Promise((res) => setTimeout(res, 1500));
      setCreateBasketStep(3);
      await new Promise((res) => setTimeout(res, 1000));

      const newKey = newBasketName.toLowerCase().replace(/\s+/g, "");
      const newVault = {
        id: Object.keys(vaultsList).length + 1,
        name: newBasketName,
        symbol: `bf${newBasketName.substring(0, 4).toUpperCase()}`,
        address: "0x" + Math.random().toString(16).substring(2, 42),
        description: newBasketDesc || "Custom strategy designed by you.",
        targetApy: `${newBasketApy}%`,
        risk: newBasketRisk,
        allocations: [
          { token: TOKENS[newBasketTokenA], weight: newBasketWeightA },
          { token: TOKENS[newBasketTokenB], weight: 100 - newBasketWeightA },
        ]
      };

      setVaultsList((prev) => ({ ...prev, [newKey]: newVault }));
      setLiveApys((prev) => ({ ...prev, [newKey]: parseFloat(newBasketApy) }));
      
      setCreateBasketStatus("success");
      setTimeout(() => {
        setCreateBasketModalOpen(false);
        setCreateBasketStatus("idle");
        setSelectedVaultKey(newKey);
        setCurrentView("detail");
      }, 1500);
    } catch (err: any) {
      setCreateBasketStatus("error");
      setCreateBasketError(err.message || "Failed to deploy strategy.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#02040a]">
      
      {/* LANDING PAGE ROUTING VIEW */}
      {appMode === "landing" ? (
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#02040a]/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧺</span>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#00ff9d] to-[#00e5ff] bg-clip-text text-transparent">
                  BasketFlow
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => { setTutorialStep(0); setTutorialOpen(true); }}
                  className="btn-secondary py-1.5 px-3 text-xs text-amber-400 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
                >
                  💡 1-Min Guide
                </button>
                <button 
                  onClick={() => setAppMode("app")}
                  className="glow-btn-primary py-1.5 px-4 text-xs font-semibold"
                >
                  Launch App
                </button>
              </div>
            </div>
          </header>

          {/* Hero */}
          <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-16 flex flex-col gap-16">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0a1122]/50 to-[#02040a]/50 border border-white/5 p-8 sm:p-16 text-center flex flex-col items-center gap-6">
              <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#00ff9d]/5 rounded-full blur-[120px]" />
              <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#00e5ff]/5 rounded-full blur-[120px]" />

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-[#00ff9d]/10 to-[#00e5ff]/10 border border-[#00ff9d]/20 text-[#00ff9d] uppercase tracking-wider">
                ⚡ Mantle Network Yield Aggregator
              </span>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-3xl leading-tight text-white">
                DeFi yield portfolios,{" "}
                <span className="bg-gradient-to-r from-[#00ff9d] to-[#00e5ff] bg-clip-text text-transparent">
                  in a single click.
                </span>
              </h1>

              <p className="text-[#94a3b8] text-base sm:text-lg max-w-2xl leading-relaxed">
                Deposit USDT, USDC, or MNT into risk-tiered baskets of Merchant Moe LP assets. 
                Our smart contracts swap, split, and pool your funds instantly on autopilot.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => setAppMode("app")}
                  className="glow-btn-primary py-4 px-8 text-sm font-bold flex items-center justify-center gap-2"
                >
                  Launch App Dashboard
                  <ArrowUpRight size={18} />
                </button>
                <button 
                  onClick={() => { setTutorialStep(0); setTutorialOpen(true); }}
                  className="btn-secondary py-4 px-8 text-sm font-bold text-amber-400 bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/15"
                >
                  💡 Simple Onboarding Guide
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/5 w-full max-w-2xl">
                <div>
                  <div className="text-[10px] text-[#64748b] font-bold uppercase">Total Value Locked</div>
                  <div className="text-lg sm:text-2xl font-extrabold text-[#f8fafc] mt-1">
                    ${liveTVL.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#64748b] font-bold uppercase">Average APY</div>
                  <div className="text-lg sm:text-2xl font-extrabold text-[#00ff9d] mt-1">17.6%</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#64748b] font-bold uppercase">Active Users</div>
                  <div className="text-lg sm:text-2xl font-extrabold text-[#00e5ff] mt-1">
                    {liveDepositors.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Visualizer Node Graph */}
            <div>
              <h2 className="text-2xl font-bold text-center text-[#f8fafc] mb-8">
                How BasketFlow Routing Works
              </h2>
              <YieldRoutingVisualizer liveApys={liveApys} vaultsList={vaultsList} />
            </div>

            {/* Baskets Preview */}
            <div>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-[#f8fafc]">Featured Yield Baskets</h2>
                  <p className="text-xs text-[#94a3b8] mt-1">Explore some of our preset LP wrapping strategies.</p>
                </div>
                <button 
                  onClick={() => setAppMode("app")}
                  className="btn-secondary py-2 px-4 text-xs font-bold"
                >
                  View All Baskets
                </button>
              </div>

              <div className="cards-grid">
                {Object.keys(vaultsList).slice(0, 3).map((key) => {
                  const vault = vaultsList[key];
                  const apyVal = liveApys[key] !== undefined ? `${liveApys[key]}%` : vault.targetApy;
                  return (
                    <div 
                      key={key} 
                      onClick={() => {
                        setSelectedVaultKey(key);
                        setAppMode("app");
                        setCurrentView("detail");
                      }}
                      className="glass-panel glass-panel-interactive p-6 flex flex-col justify-between relative overflow-hidden group"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00ff9d] to-[#00e5ff] opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            vault.risk === "Minimal" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" :
                            vault.risk === "Low" ? "bg-sky-500/10 text-sky-400 border border-sky-500/10" :
                            vault.risk === "Medium" ? "bg-purple-500/10 text-purple-400 border border-purple-500/10" :
                            "bg-red-500/10 text-red-400 border border-red-500/10"
                          }`}>
                            {vault.risk} Risk
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-[#f8fafc] mb-1">{vault.name}</h3>
                        <p className="text-xs text-[#94a3b8] mb-6 line-clamp-2">{vault.description}</p>
                        
                        <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/5">
                          <div className="text-[10px] text-[#94a3b8] mb-0.5 uppercase tracking-wider font-semibold">Live APY</div>
                          <span className="text-3xl font-extrabold text-[#00ff9d]">{apyVal}</span>
                        </div>
                      </div>
                      <button className="glow-btn-primary w-full py-2.5 text-xs font-bold mt-2">
                        Invest Basket
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
          
          {/* Footer */}
          <footer className="border-t border-white/5 py-8 bg-black/20 mt-auto text-center text-xs text-[#64748b]">
            © {new Date().getFullYear()} BasketFlow. Compounding LP yield on the Mantle Network.
          </footer>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row min-h-screen">
          {/* dAPP CORE SIDEBAR DASHBOARD VIEW */}
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-black/35 flex flex-col justify-between shrink-0">
            <div className="p-6">
              {/* Brand logo */}
              <div 
                onClick={() => setAppMode("landing")}
                className="flex items-center gap-2 cursor-pointer mb-8"
              >
                <span className="text-2xl">🧺</span>
                <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-[#00ff9d] to-[#00e5ff] bg-clip-text text-transparent">
                  BasketFlow
                </span>
              </div>

              {/* Sidebar Navigation */}
              <nav className="flex flex-col gap-1">
                <button
                  onClick={() => setCurrentView("baskets")}
                  className={`flex items-center gap-3 w-full py-3 px-4 rounded-xl text-xs font-bold transition-all text-left ${currentView === "baskets" || currentView === "detail" ? "bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d]" : "text-[#94a3b8] hover:text-white border border-transparent"}`}
                >
                  <TrendingUp size={16} />
                  <span>Invest Baskets</span>
                </button>
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className={`flex items-center gap-3 w-full py-3 px-4 rounded-xl text-xs font-bold transition-all text-left ${currentView === "dashboard" ? "bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d]" : "text-[#94a3b8] hover:text-white border border-transparent"}`}
                >
                  <DollarSign size={16} />
                  <span>My Portfolio</span>
                </button>
                <button
                  onClick={() => setCurrentView("leaderboard")}
                  className={`flex items-center gap-3 w-full py-3 px-4 rounded-xl text-xs font-bold transition-all text-left ${currentView === "leaderboard" ? "bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d]" : "text-[#94a3b8] hover:text-white border border-transparent"}`}
                >
                  <Award size={16} />
                  <span>Leaderboard</span>
                </button>
                <button
                  onClick={() => { setTutorialStep(0); setTutorialOpen(true); }}
                  className="flex items-center gap-3 w-full py-3 px-4 rounded-xl text-xs font-bold text-amber-400 hover:text-amber-300 border border-transparent text-left"
                >
                  <BookOpen size={16} />
                  <span>Beginner Guide</span>
                </button>
              </nav>
            </div>

            {/* Sidebar Bottom Controls */}
            <div className="p-6 border-t border-white/5 flex flex-col gap-4">
              {/* Demo switch */}
              <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs">
                <span className="text-[#94a3b8] font-bold">Simulated Mode</span>
                <button 
                  onClick={() => setDemoMode(!demoMode)} 
                  className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors ${demoMode ? "bg-[#00ff9d]" : "bg-white/10"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-slate-900 transition-transform ${demoMode ? "translate-x-4.5" : "translate-x-0.5"}`} />
                </button>
              </div>

              {/* Wallet info */}
              {!demoMode ? (
                <ConnectButton label="Connect Wallet" />
              ) : (
                <div className="flex items-center gap-2 bg-gradient-to-r from-[#00ff9d]/5 to-[#00e5ff]/5 border border-[#00ff9d]/20 rounded-xl px-3.5 py-2.5 text-xs text-[#00ff9d] font-bold">
                  <ShieldCheck size={16} />
                  Demo Mode Connected
                </div>
              )}
            </div>
          </aside>

          {/* Main Area */}
          <main className="flex-grow flex flex-col md:flex-row pb-24 md:pb-0 overflow-y-auto">
            
            {/* View Viewport */}
            <div className="flex-grow p-6 lg:p-8 max-w-4xl w-full mx-auto flex flex-col gap-6">
              
              {/* Banner for Demo mode active */}
              {demoMode && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#00ff9d]/5 to-[#00e5ff]/5 border border-[#00ff9d]/10 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 text-[#00ff9d] font-semibold">
                    <Activity size={14} className="animate-pulse" />
                    <span>Demo Mode Enabled: Yield Compounds Instantly</span>
                  </div>
                  <button 
                    onClick={() => setDemoBalances({
                      USDT: 2000,
                      USDC: 1200,
                      MNT: 600,
                      shares: { conservative: 0, mantleMax: 0, stableShuffle: 0 }
                    })}
                    className="text-[10px] text-[#94a3b8] hover:text-white underline cursor-pointer"
                  >
                    Reset Balances
                  </button>
                </div>
              )}

              {/* VIEW 1: BASKETS GRID */}
              {currentView === "baskets" && (
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-black text-white">Investment Baskets</h2>
                      <p className="text-xs text-[#94a3b8]">Select a vault below to deposit funds and compound yields.</p>
                    </div>
                    <button 
                      onClick={() => setCreateBasketModalOpen(true)}
                      className="glow-btn-primary py-2 px-4 text-xs font-bold"
                    >
                      <Plus size={14} />
                      Custom strategy
                    </button>
                  </div>

                  <div className="cards-grid">
                    {Object.keys(vaultsList).map((key) => {
                      const vault = vaultsList[key];
                      const apyVal = liveApys[key] !== undefined ? `${liveApys[key]}%` : vault.targetApy;
                      const direction = apyDirection[key];
                      const borderGlowClass = direction === "up" ? "card-glow-up" : direction === "down" ? "card-glow-down" : "";
                      const apyColorClass = direction === "up" ? "text-emerald-400" : direction === "down" ? "text-red-400" : "text-[#00ff9d]";

                      return (
                        <div 
                          key={key}
                          onClick={() => {
                            setSelectedVaultKey(key);
                            setCurrentView("detail");
                          }}
                          className={`glass-panel glass-panel-interactive p-5 flex flex-col justify-between relative overflow-hidden group transition-all duration-500 ${borderGlowClass}`}
                        >
                          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00ff9d] to-[#00e5ff] opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                vault.risk === "Minimal" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" :
                                vault.risk === "Low" ? "bg-sky-500/10 text-sky-400 border border-sky-500/10" :
                                vault.risk === "Medium" ? "bg-purple-500/10 text-purple-400 border border-purple-500/10" :
                                "bg-red-500/10 text-red-400 border border-red-500/10"
                              }`}>
                                {vault.risk} Risk
                              </span>
                              <span className="pulse-dot" />
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1">{vault.name}</h3>
                            <p className="text-xs text-[#94a3b8] mb-5 line-clamp-2">{vault.description}</p>

                            {/* APY Box */}
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex justify-between items-center mb-4">
                              <span className="text-[10px] text-[#94a3b8] font-bold uppercase">Target APY</span>
                              <span className={`text-xl font-extrabold flex items-center gap-1 ${apyColorClass}`}>
                                {apyVal}
                                {direction === "up" && "▲"}
                                {direction === "down" && "▼"}
                              </span>
                            </div>

                            {/* Allocations visualizer */}
                            <div className="flex flex-col gap-1.5 mb-2">
                              <span className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-wider">Asset split</span>
                              <div className="flex h-2 w-full rounded-full overflow-hidden bg-white/5 border border-white/5">
                                {vault.allocations.map((alloc: any, idx: number) => (
                                  <div 
                                    key={idx} 
                                    style={{ width: `${alloc.weight}%` }} 
                                    className={`h-full ${idx === 0 ? "bg-[#00ff9d]" : idx === 1 ? "bg-[#00e5ff]" : "bg-purple-500"}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <button className="btn-secondary w-full py-2 text-xs font-bold mt-4">
                            Select strategy
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* VIEW 2: VAULT DETAIL */}
              {currentView === "detail" && (
                <div className="flex flex-col gap-6">
                  {/* Header info */}
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setCurrentView("baskets")}
                      className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
                    >
                      <ArrowLeft size={12} />
                      Back to Baskets
                    </button>
                    <span className="text-xs text-[#94a3b8] font-bold bg-white/5 border border-white/5 px-2.5 py-1 rounded-md uppercase">Mantle Vault</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Vault Stats */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                      <div className="glass-panel p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h2 className="text-2xl font-bold text-[#f8fafc]">{activeVault.name}</h2>
                            <p className="text-xs text-[#94a3b8] mt-1">{activeVault.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-[#94a3b8] uppercase font-bold">APY Rate</span>
                            <div className="text-2xl font-black text-[#00ff9d]">{liveApys[selectedVaultKey] || activeVault.targetApy}%</div>
                          </div>
                        </div>

                        {/* Chart */}
                        <div className="mt-6">
                          <h4 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider mb-3">Historical yield (30D)</h4>
                          <PerformanceChart vaultKey={selectedVaultKey} />
                        </div>
                      </div>

                      {/* Allocations breakdown */}
                      <div className="glass-panel p-6 flex flex-col sm:flex-row items-center gap-6">
                        <CompositionChart allocations={activeVault.allocations} />
                        <div className="flex-grow flex flex-col gap-3 w-full">
                          <h4 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">LP Component Splits</h4>
                          {activeVault.allocations.map((alloc: any, idx: number) => (
                            <div key={idx} className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className={`w-3 h-3 rounded-full ${idx === 0 ? "bg-[#00ff9d]" : idx === 1 ? "bg-[#00e5ff]" : "bg-purple-500"}`} />
                                <div>
                                  <div className="font-bold text-xs text-[#f8fafc]">{alloc.token.symbol}</div>
                                  <div className="text-[9px] text-[#94a3b8]">{alloc.token.name}</div>
                                </div>
                              </div>
                              <span className="text-sm font-bold text-white">{alloc.weight}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Deposit form */}
                    <div className="glass-panel p-6 border border-[#00ff9d]/15 flex flex-col justify-between gap-6">
                      <div>
                        <h4 className="text-sm font-bold text-[#f8fafc] mb-1">Staking Ledger</h4>
                        <p className="text-[10px] text-[#94a3b8]">Input assets are automatically routed to Moe LP pools.</p>

                        <div className="flex flex-col gap-4 mt-6">
                          {/* Amount Input */}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-[10px] text-[#94a3b8] font-bold">
                              <span>AMOUNT</span>
                              <span>
                                BAL: {demoMode ? `${demoBalances[txToken]} ${txToken}` : "Connected"}
                              </span>
                            </div>
                            <div className="flex items-center bg-black/40 border border-white/5 rounded-xl px-3 py-1.5">
                              <input 
                                type="number" 
                                placeholder="0.00" 
                                value={txAmount}
                                onChange={(e) => setTxAmount(e.target.value)}
                                className="bg-transparent border-none w-full text-base font-bold text-white outline-none"
                              />
                              <select 
                                value={txToken}
                                onChange={(e) => setTxToken(e.target.value as any)}
                                className="bg-[#0f172a] border border-white/5 text-white text-xs font-bold rounded-lg px-2 py-1 outline-none"
                              >
                                <option value="USDT">USDT</option>
                                <option value="USDC">USDC</option>
                                <option value="MNT">MNT</option>
                              </select>
                            </div>
                          </div>

                          {/* Splits preview */}
                          {txAmount && parseFloat(txAmount) > 0 && (
                            <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex flex-col gap-1.5 text-[10px] text-[#94a3b8]">
                              <div className="flex justify-between text-white font-bold">
                                <span>Estimating swaps</span>
                                <span>~{(parseFloat(txAmount) / 2).toFixed(2)} / {(parseFloat(txAmount) / 2).toFixed(2)}</span>
                              </div>
                              <span>Routed to {activeVault.allocations.map((a: any) => a.token.symbol).join(" / ")} Moe pair</span>
                            </div>
                          )}

                          <div className="flex flex-col gap-2 mt-2">
                            <button 
                              onClick={() => handleExecuteTx("deposit")}
                              className="glow-btn-primary py-3 text-xs w-full flex items-center justify-center gap-1.5"
                            >
                              <span>Deposit Stake</span>
                              <ArrowUpRight size={14} />
                            </button>
                            <button 
                              onClick={() => handleExecuteTx("withdraw")}
                              className="btn-secondary py-3 text-xs w-full flex items-center justify-center gap-1.5"
                            >
                              <span>Withdraw Stake</span>
                              <ArrowDownLeft size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Position readout */}
                      {demoBalances.shares[selectedVaultKey] > 0 && (
                        <div className="border-t border-white/5 pt-4 flex flex-col gap-1.5">
                          <div className="flex justify-between text-[10px] text-[#94a3b8]">
                            <span>Active Balance</span>
                            <span className="text-white font-bold">{demoBalances.shares[selectedVaultKey]} shares</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-[#94a3b8]">
                            <span>Yield Earned</span>
                            <InterestTicker 
                              shares={{ [selectedVaultKey]: demoBalances.shares[selectedVaultKey] }} 
                              liveApys={liveApys} 
                              vaultsList={{ [selectedVaultKey]: activeVault }}
                              prefix="+"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 3: USER DASHBOARD */}
              {currentView === "dashboard" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-2xl font-black text-white">Portfolio Dashboard</h2>
                    <p className="text-xs text-[#94a3b8]">Monitor your compound shares and real-time interest accrued.</p>
                  </div>

                  {/* Portfolio Card */}
                  <div className="glass-panel p-6 sm:p-8 bg-gradient-to-r from-[#0a1122]/50 to-[#02040a]/50 border border-[#00ff9d]/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                      <span className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider">Total Position Balance</span>
                      <div className="text-4xl font-extrabold text-[#f8fafc] mt-1">
                        ${(demoBalances.shares.conservative * 1.0 + demoBalances.shares.mantleMax * 1.25 + demoBalances.shares.stableShuffle * 0.95).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </div>
                      <span className="text-[10px] text-[#00ff9d] font-semibold flex items-center gap-1.5 mt-2">
                        <span className="pulse-dot" />
                        Accruing yield continuously
                      </span>
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded-2xl p-5 min-w-[200px]">
                      <span className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider">Total Yield Earned</span>
                      <div className="text-2xl font-bold mt-1">
                        {demoMode ? (
                          <InterestTicker shares={demoBalances.shares} liveApys={liveApys} vaultsList={vaultsList} />
                        ) : (
                          <span className="text-[#94a3b8]">$0.000000</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Active positions list */}
                  <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Staked Allocations</h3>
                    
                    <div className="flex flex-col gap-3">
                      {Object.keys(vaultsList).map((key) => {
                        const vault = vaultsList[key];
                        const shareBal = demoMode ? demoBalances.shares[key] || 0 : 0;
                        if (shareBal <= 0) return null;

                        return (
                          <div key={key} className="p-4 bg-white/2 border border-white/5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">🧺</span>
                              <div>
                                <h4 className="font-bold text-sm text-[#f8fafc]">{vault.name}</h4>
                                <span className="text-[10px] text-[#94a3b8]">{vault.symbol} shares</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6 sm:flex sm:gap-12">
                              <div>
                                <span className="text-[9px] text-[#94a3b8] uppercase font-bold">STAKED</span>
                                <div className="text-xs font-bold text-white">{shareBal} shares</div>
                              </div>
                              <div>
                                <span className="text-[9px] text-[#94a3b8] uppercase font-bold">EST VALUE</span>
                                <div className="text-xs font-bold text-[#00ff9d]">${(shareBal * 1.05).toFixed(2)}</div>
                              </div>
                              <div>
                                <span className="text-[9px] text-[#94a3b8] uppercase font-bold">APY</span>
                                <div className="text-xs font-bold text-white">{liveApys[key]}%</div>
                              </div>
                            </div>

                            <button 
                              onClick={() => {
                                setSelectedVaultKey(key);
                                setCurrentView("detail");
                              }}
                              className="btn-secondary py-1.5 px-3.5 text-xs font-bold"
                            >
                              Manage
                            </button>
                          </div>
                        );
                      })}
                      
                      {Object.values(demoBalances.shares).every(v => v === 0) && (
                        <div className="p-8 text-center text-xs text-[#64748b] border border-dashed border-white/5 rounded-2xl">
                          No active yield positions. Select a basket strategy to begin staking.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 4: GAMIFIED LEADERBOARD */}
              {currentView === "leaderboard" && (
                <div className="flex flex-col gap-6">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-black text-white">Yield Leaderboard</h2>
                    <p className="text-xs text-[#94a3b8]">Real-time leaderboard tracking the top-yielding accounts on Mantle.</p>
                  </div>

                  <div className="glass-panel overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/2 text-[9px] text-[#94a3b8] font-bold uppercase tracking-wider">
                          <th className="p-4 text-center w-16">Rank</th>
                          <th className="p-4">Address</th>
                          <th className="p-4 text-center">Baskets</th>
                          <th className="p-4 text-right">Yield Earned</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs text-[#f8fafc]">
                        {[
                          { rank: 1, address: "replytim.mnt", baskets: 3, yield: "$423.82", badge: "Yield King" },
                          { rank: 2, address: "0x7099...79c8", baskets: 2, yield: demoMode ? <InterestTicker shares={demoBalances.shares} liveApys={liveApys} vaultsList={vaultsList} /> : "$0.00", badge: "You", highlight: true },
                          { rank: 3, address: "vitalik.eth", baskets: 2, yield: "$128.52", badge: "Pioneer" },
                          { rank: 4, address: "0x3c44...62b9", baskets: 1, yield: "$84.21", badge: "Regular" },
                          { rank: 5, address: "0x90f7...72ff", baskets: 1, yield: "$32.40", badge: "Regular" },
                        ].map((row, idx) => (
                          <tr key={idx} className={`${row.highlight ? "bg-[#00ff9d]/5 hover:bg-[#00ff9d]/10" : "hover:bg-white/2"}`}>
                            <td className="p-4 text-center font-bold text-[#00ff9d]">
                              {row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : row.rank}
                            </td>
                            <td className="p-4 font-bold flex items-center gap-2">
                              {row.address}
                              {row.badge && (
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  row.badge === "Yield King" ? "bg-amber-500/10 text-amber-400 border border-amber-500/10" :
                                  row.badge === "You" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" :
                                  "bg-sky-500/10 text-sky-400 border border-sky-500/10"
                                }`}>{row.badge}</span>
                              )}
                            </td>
                            <td className="p-4 text-center text-[#94a3b8] font-semibold">{row.baskets} Baskets</td>
                            <td className="p-4 text-right font-mono font-bold text-[#00ff9d]">{row.yield}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right Activity Sidebar (Only visible on wide desktop view) */}
            <div className="hidden lg:flex flex-col w-80 shrink-0 border-l border-white/5 bg-black/10 p-6 gap-6">
              
              {/* Activity feed */}
              <div className="glass-panel p-4 flex flex-col gap-4">
                <span className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="pulse-dot" />
                  Live Activity Feed
                </span>
                <div className="flex flex-col gap-2">
                  {activities.map((act) => (
                    <div key={act.id} className="p-2.5 rounded-lg bg-white/2 border border-white/5 text-[10px] text-[#94a3b8] flex justify-between items-start gap-1">
                      <span className="font-semibold text-white leading-normal">{act.text}</span>
                      <span className="text-[8px] text-[#64748b] shrink-0">{act.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* visual visualizer node */}
              <div className="glass-panel p-4 flex flex-col gap-3">
                <span className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider">Quick Path Simulator</span>
                <p className="text-[10px] text-[#94a3b8]">Select target basket below to preview compound swaps routing:</p>
                <div className="flex flex-col gap-2">
                  {Object.keys(vaultsList).slice(0, 4).map((k) => (
                    <button
                      key={k}
                      onClick={() => {
                        setSelectedVaultKey(k);
                        setCurrentView("detail");
                      }}
                      className="p-2.5 rounded-lg border border-white/5 bg-black/25 flex justify-between items-center text-left hover:border-[#00ff9d]/30 text-[10px] text-white font-bold transition-all"
                    >
                      <span>{vaultsList[k].name}</span>
                      <ChevronRight size={12} className="text-[#94a3b8]" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </main>

          {/* Bottom mobile menu */}
          <div className="md:hidden mobile-nav-bar">
            <button 
              onClick={() => setCurrentView("baskets")} 
              className={`mobile-nav-item ${currentView === "baskets" || currentView === "detail" ? "active" : ""}`}
            >
              <TrendingUp size={18} />
              <span>Invest</span>
            </button>
            <button 
              onClick={() => setCurrentView("dashboard")} 
              className={`mobile-nav-item ${currentView === "dashboard" ? "active" : ""}`}
            >
              <DollarSign size={18} />
              <span>Portfolio</span>
            </button>
            <button 
              onClick={() => setCurrentView("leaderboard")} 
              className={`mobile-nav-item ${currentView === "leaderboard" ? "active" : ""}`}
            >
              <Award size={18} />
              <span>Leaderboard</span>
            </button>
          </div>
        </div>
      )}

      {/* --- BEGINNER DEFI TUTORIAL MODAL --- */}
      {tutorialOpen && (
        <div className="modal-overlay">
          <div className="glass-panel max-w-xl w-full p-8 mx-4 border border-amber-500/20 relative flex flex-col justify-between min-h-[400px]">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">DeFi Beginner Guide</span>
                <button 
                  onClick={() => setTutorialOpen(false)}
                  className="text-xs text-[#94a3b8] hover:text-white bg-transparent border-none cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              {/* Slide content */}
              {tutorialStep === 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-2xl font-black text-white">💰 1. What are Digital Dollars?</h3>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    Normally, blockchain accounts store volatile tokens like Ethereum whose prices bounce around. But there are also **Stablecoins** (like USDT and USDC) which are pegged directly to the US Dollar.
                  </p>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    Think of stablecoins as **Digital Dollars**. A USDT balance is essentially cash stored in your web wallet. It does not fluctuate in price, making it the perfect foundation for saving and earning interest.
                  </p>
                </div>
              )}

              {tutorialStep === 1 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-2xl font-black text-white">🍏 2. What is a Liquidity Pool?</h3>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    In traditional finance, banks exchange currencies for you. In DeFi, we use automated smart contracts called **Liquidity Pools** (LPs) to trade assets.
                  </p>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    Imagine a shared **Fruit Bowl** containing equal shares of apples (USDC) and oranges (mETH). Traders can throw in apples and grab oranges, paying a tiny credit card swap fee. The pool is funded by normal users (liquidity providers) who store their assets in the bowl and split those swap fees.
                  </p>
                </div>
              )}

              {tutorialStep === 2 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-2xl font-black text-white">📈 3. Where does Yield APY come from?</h3>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    Every time a trader swaps tokens using a liquidity pool, a **0.25% fee** is charged. 
                  </p>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    These fees accumulate inside the pool. Because swap fees are collected in real-time on thousands of trades daily, the pool assets grow larger and larger. The percentage profit generated by these swap fees over a year is called your **Yield APY (Annual Percentage Yield)**.
                  </p>
                </div>
              )}

              {tutorialStep === 3 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-2xl font-black text-white">🧺 4. What does BasketFlow do?</h3>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    Ordinarily, to deposit into a pool, you would have to manually swap half your money, provide equal ratios, sign multiple approval transactions, and pay heavy gas fees.
                  </p>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    **BasketFlow automates this entire headache.** You deposit a single token (USDT or MNT) into a basket. Our smart contract automatically splits the asset, performs swaps, deposits liquidity to Merchant Moe, stakes the LP tokens to accrue returns, and auto-compounds the profit back in—all in **one click** with low gas fees.
                  </p>
                </div>
              )}

              {tutorialStep === 4 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-2xl font-black text-white">🛡️ 5. Safe & Simple Withdrawals</h3>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    When you stake in a basket, you receive **Vault Shares** representing your ownership of the LP assets.
                  </p>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    You are in complete control of your funds. There are no locking periods or exit penalties. At any point, you can request a withdrawal: the contract automatically unstakes your LP tokens, converts the underlying assets back into standard USDT, and transfers it directly to your wallet in a single transaction.
                  </p>
                </div>
              )}
            </div>

            {/* Stepper buttons */}
            <div className="flex justify-between items-center mt-8 pt-4 border-t border-white/5">
              <span className="text-[10px] text-[#64748b] font-bold">Slide {tutorialStep + 1} of 5</span>
              <div className="flex gap-2">
                {tutorialStep > 0 && (
                  <button 
                    onClick={() => setTutorialStep(tutorialStep - 1)} 
                    className="btn-secondary py-1 px-3 text-xs"
                  >
                    Back
                  </button>
                )}
                {tutorialStep < 4 ? (
                  <button 
                    onClick={() => setTutorialStep(tutorialStep + 1)} 
                    className="glow-btn-primary py-1 px-4 text-xs font-bold"
                  >
                    Next Step
                  </button>
                ) : (
                  <button 
                    onClick={() => setTutorialOpen(false)}
                    className="glow-btn-primary py-1 px-4 text-xs font-bold"
                  >
                    Finish Guide
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TRANSACTION STEPS PROGRESS MODAL --- */}
      {txModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel max-w-md w-full p-8 mx-4 border border-[#00ff9d]/25 relative text-center">
            <h3 className="text-xl font-bold text-white mb-6 capitalize">
              {txType === "deposit" ? "Processing Deposit" : "Processing Withdrawal"}
            </h3>

            {/* Loading */}
            {txStatus === "loading" && (
              <div className="flex flex-col gap-6 items-center">
                <RefreshCw size={36} className="animate-spin text-[#00ff9d] mb-2" />
                
                <div className="flex flex-col gap-3 w-full text-left">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${txStep > 1 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-[#00ff9d]/10 text-[#00ff9d] border border-[#00ff9d]/20 animate-pulse"}`}>1</span>
                    <span className={`text-xs font-bold ${txStep > 1 ? "text-emerald-400" : "text-white"}`}>Approving Token Spender Allowance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${txStep > 2 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : txStep === 2 ? "bg-[#00ff9d]/10 text-[#00ff9d] border border-[#00ff9d]/20 animate-pulse" : "bg-white/5 text-[#94a3b8] border border-white/5"}`}>2</span>
                    <span className={`text-xs font-bold ${txStep > 2 ? "text-emerald-400" : txStep === 2 ? "text-white" : "text-[#64748b]"}`}>Exchanging swaps on Merchant Moe</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${txStep > 3 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : txStep === 3 ? "bg-[#00ff9d]/10 text-[#00ff9d] border border-[#00ff9d]/20 animate-pulse" : "bg-white/5 text-[#94a3b8] border border-white/5"}`}>3</span>
                    <span className={`text-xs font-bold ${txStep > 3 ? "text-emerald-400" : txStep === 3 ? "text-white" : "text-[#64748b]"}`}>Staking LP tokens in Compounding Vault</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${txStep > 4 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : txStep === 4 ? "bg-[#00ff9d]/10 text-[#00ff9d] border border-[#00ff9d]/20 animate-pulse" : "bg-white/5 text-[#94a3b8] border border-white/5"}`}>4</span>
                    <span className={`text-xs font-bold ${txStep > 4 ? "text-emerald-400" : txStep === 4 ? "text-white" : "text-[#64748b]"}`}>Issuing BasketFlow shares to wallet</span>
                  </div>
                </div>
                <p className="text-xs text-[#94a3b8] mt-4">Please confirm transactions in MetaMask when prompted.</p>
              </div>
            )}

            {/* Success */}
            {txStatus === "success" && (
              <div className="flex flex-col gap-4 items-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl">
                  ✓
                </div>
                <h4 className="text-xl font-bold text-white">Staking Successful</h4>
                <p className="text-xs text-[#94a3b8]">Your deposit has been swapped, pooled, and staked. Shares have been minted to your address.</p>
                <button 
                  onClick={() => setTxModalOpen(false)}
                  className="glow-btn-primary w-full py-3 mt-4 text-xs font-bold"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

            {/* Error */}
            {txStatus === "error" && (
              <div className="flex flex-col gap-4 items-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-3xl">
                  ✕
                </div>
                <h4 className="text-xl font-bold text-red-500">Transaction Failed</h4>
                <p className="text-xs text-[#94a3b8] max-h-24 overflow-y-auto w-full p-2.5 bg-black/20 rounded-xl border border-white/5 text-left font-mono">
                  {txError}
                </p>
                <button 
                  onClick={() => setTxModalOpen(false)}
                  className="btn-secondary w-full py-3 mt-4 text-xs font-bold"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- CREATE CUSTOM BASKET MODAL --- */}
      {createBasketModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel max-w-md w-full p-8 mx-4 border border-[#00ff9d]/25 relative">
            <h3 className="text-xl font-bold text-center text-white mb-6">Create Custom Strategy</h3>

            {createBasketStatus === "idle" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#94a3b8] font-bold uppercase">Strategy Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. My Custom Hyperpool" 
                    value={newBasketName}
                    onChange={(e) => setNewBasketName(e.target.value)}
                    className="bg-black/40 border border-white/5 text-white rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#94a3b8] font-bold uppercase">Token A</label>
                    <select 
                      value={newBasketTokenA}
                      onChange={(e) => setNewBasketTokenA(e.target.value as any)}
                      className="bg-[#0f172a] border border-white/5 text-white text-xs font-bold rounded-lg px-2 py-2 outline-none"
                    >
                      <option value="USDT">USDT</option>
                      <option value="USDC">USDC</option>
                      <option value="mETH">mETH</option>
                      <option value="MNT">MNT</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#94a3b8] font-bold uppercase">Token B</label>
                    <select 
                      value={newBasketTokenB}
                      onChange={(e) => setNewBasketTokenB(e.target.value as any)}
                      className="bg-[#0f172a] border border-white/5 text-white text-xs font-bold rounded-lg px-2 py-2 outline-none"
                    >
                      <option value="USDT">USDT</option>
                      <option value="USDC">USDC</option>
                      <option value="mETH">mETH</option>
                      <option value="MNT">MNT</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] text-[#94a3b8] font-bold uppercase">
                    <span>Token A Weight</span>
                    <span>{newBasketWeightA}% / {100 - newBasketWeightA}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="90" 
                    step="5" 
                    value={newBasketWeightA}
                    onChange={(e) => setNewBasketWeightA(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#00ff9d]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#94a3b8] font-bold uppercase">Target APY (%)</label>
                    <input 
                      type="number" 
                      placeholder="18.5" 
                      value={newBasketApy}
                      onChange={(e) => setNewBasketApy(e.target.value)}
                      className="bg-black/40 border border-white/5 text-white rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#94a3b8] font-bold uppercase">Risk Profile</label>
                    <select 
                      value={newBasketRisk}
                      onChange={(e) => setNewBasketRisk(e.target.value)}
                      className="bg-[#0f172a] border border-white/5 text-white text-xs font-bold rounded-lg px-2 py-2 outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#94a3b8] font-bold uppercase">Description</label>
                  <textarea 
                    rows={2}
                    placeholder="Describe your strategy goals..." 
                    value={newBasketDesc}
                    onChange={(e) => setNewBasketDesc(e.target.value)}
                    className="bg-black/40 border border-white/5 text-white rounded-xl px-3 py-2 text-xs font-semibold outline-none resize-none"
                  />
                </div>

                <div className="flex gap-4 mt-4">
                  <button 
                    onClick={handleCreateBasket}
                    disabled={!newBasketName}
                    className="glow-btn-primary flex-1 py-3 text-xs font-bold"
                  >
                    Compile & Deploy
                  </button>
                  <button 
                    onClick={() => setCreateBasketModalOpen(false)}
                    className="btn-secondary flex-1 py-3 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {createBasketStatus === "loading" && (
              <div className="flex flex-col gap-6 items-center py-6">
                <RefreshCw size={36} className="animate-spin text-[#00ff9d] mb-2" />
                <div className="flex flex-col gap-3 w-full text-left">
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${createBasketStep > 1 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-[#00ff9d]/10 text-[#00ff9d] border border-[#00ff9d]/20 animate-pulse"}`}>1</span>
                    <span className={`text-xs font-bold ${createBasketStep > 1 ? "text-emerald-400" : "text-white"}`}>Compiling Strategy bytecode (via Yul Optimizer)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${createBasketStep > 2 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : createBasketStep === 2 ? "bg-[#00ff9d]/10 text-[#00ff9d] border border-[#00ff9d]/20 animate-pulse" : "bg-white/5 text-[#94a3b8] border border-white/5"}`}>2</span>
                    <span className={`text-xs font-bold ${createBasketStep > 2 ? "text-emerald-400" : createBasketStep === 2 ? "text-white" : "text-[#64748b]"}`}>Deploying Vault Proxy to Mantle Network</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${createBasketStep > 3 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : createBasketStep === 3 ? "bg-[#00ff9d]/10 text-[#00ff9d] border border-[#00ff9d]/20 animate-pulse" : "bg-white/5 text-[#94a3b8] border border-white/5"}`}>3</span>
                    <span className={`text-xs font-bold ${createBasketStep > 3 ? "text-emerald-400" : createBasketStep === 3 ? "text-white" : "text-[#64748b]"}`}>Registering Moe Router LP configurations</span>
                  </div>
                </div>
              </div>
            )}

            {createBasketStatus === "success" && (
              <div className="flex flex-col gap-4 items-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl">
                  ✓
                </div>
                <h4 className="text-xl font-bold text-white">Strategy Deployed</h4>
                <p className="text-xs text-[#94a3b8]">Your custom strategy contract is now live on the local chain.</p>
              </div>
            )}

            {createBasketStatus === "error" && (
              <div className="flex flex-col gap-4 items-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-2xl">
                  ✕
                </div>
                <h4 className="text-xl font-bold text-red-500">Deployment Failed</h4>
                <p className="text-xs text-[#94a3b8] font-mono bg-black/20 p-2.5 rounded-xl border border-white/5 w-full text-left">
                  {createBasketError}
                </p>
                <div className="flex gap-4 w-full mt-4">
                  <button onClick={handleCreateBasket} className="glow-btn-primary flex-1 py-2 text-xs font-bold">Retry</button>
                  <button onClick={() => { setCreateBasketModalOpen(false); setCreateBasketStatus("idle"); }} className="btn-secondary flex-1 py-2 text-xs font-bold">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
