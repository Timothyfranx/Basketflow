import { useState, useEffect, memo, useRef } from "react";
import { 
  Award, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  ArrowLeft, 
  ShieldCheck, 
  Activity, 
  Plus, 
  ChevronRight,
  Clock,
  Compass,
  Layers,
  HelpCircle
} from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { 
  useAccount, 
  useWriteContract, 
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import { TOKENS, VAULTS, VAULT_ABI, ERC20_ABI } from "./contracts";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// --- MEMOIZED COUNTERS & PERFORMANCE TICKERS (DIRECT-DOM OPTIMIZATION TO PREVENT LAGGING) ---
interface InterestTickerProps {
  shares: Record<string, number>;
  liveApys: Record<string, number>;
  vaultsList: Record<string, any>;
  speedUp?: number;
  prefix?: string;
}

export const InterestTicker = memo(({ shares, liveApys, vaultsList, speedUp = 3.0, prefix = "" }: InterestTickerProps) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const accruedRef = useRef<number>(0);

  useEffect(() => {
    let totalYieldPerSecond = 0;
    Object.keys(vaultsList).forEach((key) => {
      const shareBal = shares[key] || 0;
      const apy = liveApys[key] || 10.0;
      // Yield formula: (Balance * APY%) / (Seconds in year * 100)
      const positionYieldPerSecond = (shareBal * (apy / 100)) / (365 * 24 * 3600);
      totalYieldPerSecond += positionYieldPerSecond;
    });

    if (totalYieldPerSecond === 0) {
      accruedRef.current = 0;
      if (spanRef.current) spanRef.current.textContent = `${prefix}$0.000000`;
      return;
    }

    const intervalMs = 250; // 4 updates per second (was 60ms) to prevent lag
    const increment = (totalYieldPerSecond * (intervalMs / 1000)) * speedUp;

    const timer = setInterval(() => {
      accruedRef.current += increment;
      if (spanRef.current) {
        spanRef.current.textContent = `${prefix}$${accruedRef.current.toFixed(6)}`;
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [shares, liveApys, vaultsList, speedUp, prefix]);

  return <span ref={spanRef} className="yield-ticker text-emerald-400 font-bold font-mono">{prefix}$0.000000</span>;
});

// --- PERFORMANCE SVG CHART ---
export const PerformanceChart = memo(({ vaultKey }: { vaultKey: string }) => {
  let pathD = "M0,80 Q70,75 140,55 T280,45 T420,25 T500,15";
  let areaD = "M0,80 Q70,75 140,55 T280,45 T420,25 T500,15 L500,100 L0,100 Z";
  let colorStart = "#00ff88";
  let colorEnd = "#00e5ff";
  
  if (vaultKey === "stableShuffle") {
    pathD = "M0,75 Q90,78 180,72 T360,70 T500,68";
    areaD = "M0,75 Q90,78 180,72 T360,70 T500,68 L500,100 L0,100 Z";
    colorStart = "#6366f1";
    colorEnd = "#a855f7";
  } else if (vaultKey === "moePowerhouse" || vaultKey === "hyperDrive") {
    pathD = "M0,85 Q60,65 120,78 T240,35 T360,55 T500,8";
    areaD = "M0,85 Q60,65 120,78 T240,35 T360,55 T500,8 L500,100 L0,100 Z";
    colorStart = "#fbbf24";
    colorEnd = "#f43f5e";
  } else if (vaultKey === "mantleMax") {
    pathD = "M0,70 Q80,45 160,58 T320,28 T500,4";
    areaD = "M0,70 Q80,45 160,58 T320,28 T500,4 L500,100 L0,100 Z";
    colorStart = "#00ff88";
    colorEnd = "#059669";
  }

  const gradIdLine = `lineGrad-${vaultKey}`;
  const gradIdArea = `areaGrad-${vaultKey}`;

  return (
    <div className="w-full h-40 bg-black/30 rounded-xl border border-white/5 p-2 relative">
      <svg viewBox="0 0 500 100" className="w-full h-full overflow-visible">
        <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
        <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
        <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
        
        <path d={areaD} fill={`url(#${gradIdArea})`} style={{ opacity: 0.15 }} />
        <path d={pathD} fill="none" stroke={`url(#${gradIdLine})`} strokeWidth="2.5" strokeLinecap="round" />
        
        <defs>
          <linearGradient id={gradIdLine} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
          <linearGradient id={gradIdArea} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorStart} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colorStart} stopOpacity="0.0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute bottom-1.5 left-2.5 text-[9px] text-slate-500 font-bold font-mono">30D AGO</div>
      <div className="absolute bottom-1.5 right-2.5 text-[9px] text-slate-500 font-bold font-mono">TODAY</div>
    </div>
  );
});

// --- ALLOCATION DONUT CHART ---
export const CompositionChart = memo(({ allocations }: { allocations: any[] }) => {
  return (
    <div className="flex justify-center">
      <svg width="130" height="130" viewBox="0 0 36 36" className="overflow-visible transform -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4.5" />
        
        {allocations.map((alloc: any, idx: number) => {
          let previousWeightsSum = 0;
          for (let i = 0; i < idx; i++) {
            previousWeightsSum += allocations[i].weight;
          }
          const strokeColors = ["#00ff88", "#00e5ff", "#6366f1", "#fbbf24"];
          const strokeColor = strokeColors[idx % strokeColors.length];
          return (
            <circle 
              key={idx}
              cx="18" 
              cy="18" 
              r="15.9" 
              fill="none" 
              stroke={strokeColor} 
              strokeWidth="4.5" 
              strokeDasharray={`${alloc.weight} ${100 - alloc.weight}`} 
              strokeDashoffset={100 - previousWeightsSum + 25} 
              className="transition-all duration-300 hover:stroke-[5.5px] cursor-pointer"
            />
          );
        })}
        
        <circle cx="18" cy="18" r="11" fill="#050814" />
        
        <g transform="rotate(90 18 18)">
          <text x="18" y="16.5" textAnchor="middle" fill="#64748b" fontSize="2.8" fontWeight="800" letterSpacing="0.05">SPLITS</text>
          <text x="18" y="21" textAnchor="middle" fill="#f8fafc" fontSize="3.8" fontWeight="800">LP Assets</text>
        </g>
      </svg>
    </div>
  );
});

// --- DYNAMIC HERO STATS TICKER (ISOLATED TO PREVENT PARENT RE-RENDERING) ---
export const HeroStats = memo(() => {
  const [liveTVL, setLiveTVL] = useState<number>(3824000);
  const [liveDepositors, setLiveDepositors] = useState<number>(4590);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTVL((prev) => prev + Math.floor((Math.random() - 0.45) * 350));
      setLiveDepositors((prev) => prev + (Math.random() > 0.85 ? 1 : Math.random() < 0.15 ? -1 : 0));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/5 w-full max-w-xl">
      <div>
        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Total Value Locked</div>
        <div className="text-base sm:text-xl font-extrabold text-white mt-0.5 font-mono">
          ${liveTVL.toLocaleString()}
        </div>
      </div>
      <div>
        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Average APY</div>
        <div className="text-base sm:text-xl font-extrabold text-[#00ff88] mt-0.5 font-mono">18.4%</div>
      </div>
      <div>
        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Active Users</div>
        <div className="text-base sm:text-xl font-extrabold text-[#00e5ff] mt-0.5 font-mono">
          {liveDepositors.toLocaleString()}
        </div>
      </div>
    </div>
  );
});

// --- LIVE EVENT EXPLORER (ISOLATED RENDER CYCLES FOR explorer STREAM) ---
interface LiveEventExplorerProps {
  vaultsList: Record<string, any>;
}

export const LiveEventExplorer = memo(({ vaultsList }: LiveEventExplorerProps) => {
  const [activities, setActivities] = useState<Array<{ id: number; text: string; time: string }>>([
    { id: 1, text: "0x8a...4b deposited $2,500 into Moe Powerhouse", time: "Just now" },
    { id: 2, text: "replytim.mnt staked $1,200 in Stable Shuffle", time: "3m ago" },
    { id: 3, text: "0x9c...7f withdrew $600 from Conservative Care", time: "8m ago" },
  ]);

  useEffect(() => {
    const addresses = ["0x8a", "vitalik.mnt", "replytim.eth", "0xef", "0x5d", "mimi.mnt", "dan.mnt"];
    const actions = ["deposited", "withdrew"];
    const values = [500, 1200, 3000, 7500, 15000];

    const timer = setInterval(() => {
      const keys = Object.keys(vaultsList);
      if (keys.length === 0) return;
      const key = keys[Math.floor(Math.random() * keys.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const amount = values[Math.floor(Math.random() * values.length)];
      const user = addresses[Math.floor(Math.random() * addresses.length)] + (Math.random() > 0.6 ? "" : "...3e");
      
      const text = `${user} ${action} $${amount.toLocaleString()} ${action === "deposited" ? "into" : "from"} ${vaultsList[key].name}`;
      setActivities((prev) => [{ id: Date.now(), text, time: "Just now" }, ...prev.slice(0, 2)]);
    }, 9000);
    return () => clearInterval(timer);
  }, [vaultsList]);

  return (
    <div className="panel p-4 flex flex-col gap-4">
      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
        <span className="pulse-dot" />
        Live Event Explorer
      </span>
      <div className="flex flex-col gap-2">
        {activities.map((act) => (
          <div key={act.id} className="p-2.5 rounded-xl bg-white/2 border border-white/5 text-[9.5px] text-slate-400 flex flex-col gap-1">
            <span className="font-medium text-slate-200 leading-normal">{act.text}</span>
            <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <Clock size={8} />
                {act.time}
              </span>
              <span className="text-[#00e5ff]">MANTLE BLOCK</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// --- HIGH-FIDELITY ROUTING VISUALIZER (SVG ACTIVE PIPELINE WITH HARDWARE-ACCELERATED FLOWS) ---
interface YieldRoutingVisualizerProps {
  vaultsList: Record<string, any>;
}

export const YieldRoutingVisualizer = memo(({ vaultsList }: YieldRoutingVisualizerProps) => {
  const [simAmount, setSimAmount] = useState<string>("1000");
  const [simToken, setSimToken] = useState<"USDT" | "USDC" | "MNT">("USDT");
  const [simVaultKey, setSimVaultKey] = useState<string>("conservative");
  const [simState, setSimState] = useState<"idle" | "routing" | "swapping" | "pooling" | "complete">("idle");
  
  const simYieldSpanRef = useRef<HTMLSpanElement>(null);
  const activeVault = vaultsList[simVaultKey] || vaultsList["conservative"];
  
  // Statically parse strategy APY for simulation
  const apy = (() => {
    if (!activeVault || !activeVault.targetApy) return 10.0;
    const clean = activeVault.targetApy.replace("%", "");
    const parts = clean.split("-");
    if (parts.length === 2) {
      return (parseFloat(parts[0]) + parseFloat(parts[1])) / 2;
    }
    return parseFloat(clean) || 10.0;
  })();

  useEffect(() => {
    let timer: any;
    let yieldInterval: any;

    if (simState === "routing") {
      timer = setTimeout(() => setSimState("swapping"), 1500);
    } else if (simState === "swapping") {
      timer = setTimeout(() => setSimState("pooling"), 1500);
    } else if (simState === "pooling") {
      timer = setTimeout(() => setSimState("complete"), 1500);
    } else if (simState === "complete") {
      const amount = parseFloat(simAmount) || 1000;
      const yieldPerSecond = (amount * (apy / 100)) / (365 * 24 * 3600);
      const speedUp = 300; // Accelerated compound speed

      let accrued = 0;
      const intervalMs = 250; // 4 updates per second (was 50ms) to prevent lag
      yieldInterval = setInterval(() => {
        accrued += (yieldPerSecond * (intervalMs / 1000)) * speedUp;
        if (simYieldSpanRef.current) {
          simYieldSpanRef.current.textContent = `+$${accrued.toFixed(6)}`;
        }
      }, intervalMs);
    } else if (simState === "idle") {
      if (simYieldSpanRef.current) {
        simYieldSpanRef.current.textContent = "+$0.000000";
      }
    }

    return () => {
      clearTimeout(timer);
      clearInterval(yieldInterval);
    };
  }, [simState, simAmount, apy]);

  return (
    <div className="panel p-6 bg-black/40 border border-white/5 relative overflow-hidden flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div>
          <h4 className="text-base font-bold text-white mb-1">Interactive Yield Router</h4>
          <p className="text-xs text-slate-400">Simulate how BasketFlow splits, swaps, and stakes assets in a single click.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="pulse-dot" />
          <span className="text-[10px] text-[#00ff88] font-bold uppercase tracking-wider font-mono">Routing Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left Inputs Card */}
        <div className="p-5 bg-white/2 border border-white/5 rounded-2xl flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-4">
            <div className="input-group">
              <label className="input-label">Select Input Asset</label>
              <div className="flex gap-2">
                {(["USDT", "USDC", "MNT"] as const).map((t) => (
                  <button
                    key={t}
                    disabled={simState !== "idle"}
                    onClick={() => setSimToken(t)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      simToken === t 
                        ? "bg-[#00ff88]/10 border-[#00ff88]/40 text-[#00ff88]" 
                        : "bg-black/20 border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Simulated Amount</label>
              <div className="input-container">
                <input
                  type="number"
                  disabled={simState !== "idle"}
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="input-field"
                />
                <span className="text-xs text-slate-400 font-bold ml-2">{simToken}</span>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Target Strategy Basket</label>
              <select
                disabled={simState !== "idle"}
                value={simVaultKey}
                onChange={(e) => setSimVaultKey(e.target.value)}
                className="token-select w-full"
                style={{ padding: '8px 12px' }}
              >
                {Object.keys(vaultsList).map((key) => (
                  <option key={key} value={key}>{vaultsList[key].name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => setSimState(simState === "idle" ? "routing" : "idle")}
            className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              simState === "idle" 
                ? "btn-primary" 
                : "btn-secondary text-rose-400 border-rose-500/10 hover:bg-rose-500/5 hover:border-rose-500/25"
            }`}
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

        {/* Right Node Canvas Visualizer */}
        <div className="lg:col-span-2 p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col justify-between relative min-h-[220px]">
          
          {/* Node SVG network with Hardware Accelerated CSS Dash Flows */}
          <div className="w-full h-full relative min-h-[170px] flex items-center justify-center">
            <svg 
              viewBox="0 0 600 160" 
              className="w-full h-full absolute inset-0 z-0 overflow-visible"
              style={{ transform: 'translate3d(0,0,0)', willChange: 'transform' }}
            >
              
              {/* Pipeline paths */}
              {/* Path 1: Wallet -> Router */}
              <path d="M 50,80 L 220,80" stroke="rgba(255,255,255,0.03)" strokeWidth="3.5" fill="none" />
              
              {/* Path 2A: Router -> Token A */}
              <path d="M 220,80 C 270,80 290,40 370,40" stroke="rgba(255,255,255,0.03)" strokeWidth="3" fill="none" />
              
              {/* Path 2B: Router -> Token B */}
              <path d="M 220,80 C 270,80 290,120 370,120" stroke="rgba(255,255,255,0.03)" strokeWidth="3" fill="none" />
              
              {/* Path 3A: Token A -> Vault */}
              <path d="M 370,40 C 450,40 470,80 540,80" stroke="rgba(255,255,255,0.03)" strokeWidth="3" fill="none" />
              
              {/* Path 3B: Token B -> Vault */}
              <path d="M 370,120 C 450,120 470,80 540,80" stroke="rgba(255,255,255,0.03)" strokeWidth="3" fill="none" />

              {/* Glowing active flow overlays animated in GPU via CSS stroke-dashoffset */}
              {(simState === "routing" || simState === "complete") && (
                <path 
                  d="M 50,80 L 220,80" 
                  stroke="#00ff88" 
                  strokeWidth="3.5" 
                  fill="none" 
                  className="flow-line-active" 
                />
              )}
              
              {(simState === "swapping" || simState === "complete") && (
                <>
                  <path 
                    d="M 220,80 C 270,80 290,40 370,40" 
                    stroke="#00e5ff" 
                    strokeWidth="3" 
                    fill="none" 
                    className="flow-line-active" 
                  />
                  <path 
                    d="M 220,80 C 270,80 290,120 370,120" 
                    stroke="#00e5ff" 
                    strokeWidth="3" 
                    fill="none" 
                    className="flow-line-active" 
                  />
                </>
              )}

              {(simState === "pooling" || simState === "complete") && (
                <>
                  <path 
                    d="M 370,40 C 450,40 470,80 540,80" 
                    stroke="#6366f1" 
                    strokeWidth="3" 
                    fill="none" 
                    className="flow-line-active" 
                  />
                  <path 
                    d="M 370,120 C 450,120 470,80 540,80" 
                    stroke="#6366f1" 
                    strokeWidth="3" 
                    fill="none" 
                    className="flow-line-active" 
                  />
                </>
              )}

              {/* Wallet Node Group */}
              <g>
                <rect 
                  x="30" 
                  y="60" 
                  width="40" 
                  height="40" 
                  rx="8" 
                  ry="8" 
                  fill="rgba(5, 8, 20, 0.9)" 
                  stroke={simState !== "idle" ? "#00ff88" : "rgba(255, 255, 255, 0.05)"} 
                  strokeWidth="1.5" 
                  className="transition-all duration-300"
                  style={{
                    filter: simState !== "idle" ? "drop-shadow(0 0 8px rgba(0, 255, 136, 0.25))" : "none"
                  }}
                />
                <text x="50" y="78" textAnchor="middle" fontSize="14">💳</text>
                <text x="50" y="92" textAnchor="middle" fontSize="8" fill="#ffffff" fontWeight="bold" fontFamily="monospace">{simAmount}</text>
                <text x="50" y="115" textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="bold" letterSpacing="0.05em" fontFamily="monospace">{simToken}</text>
              </g>

              {/* Router Node Group */}
              <g>
                <circle 
                  cx="220" 
                  cy="80" 
                  r="24" 
                  fill="rgba(5, 8, 20, 0.9)" 
                  stroke={
                    simState === "swapping" ? "#00e5ff" : 
                    simState === "pooling" || simState === "complete" ? "#6366f1" : 
                    "rgba(255, 255, 255, 0.05)"
                  } 
                  strokeWidth="1.5" 
                  className="transition-all duration-500"
                  style={{
                    filter: simState === "swapping" ? "drop-shadow(0 0 8px rgba(0, 229, 255, 0.25))" : 
                            simState === "pooling" || simState === "complete" ? "drop-shadow(0 0 8px rgba(99, 102, 241, 0.25))" : "none"
                  }}
                />
                {simState === "swapping" && (
                  <circle 
                    cx="220" 
                    cy="80" 
                    r="20" 
                    fill="none" 
                    stroke="#00e5ff" 
                    strokeWidth="1" 
                    strokeDasharray="4, 4" 
                    className="animate-spin" 
                    style={{ transformOrigin: '220px 80px' }} 
                  />
                )}
                <text x="220" y="81" textAnchor="middle" fontSize="14">🧺</text>
                <text x="220" y="92" textAnchor="middle" fontSize="5.5" fill="#64748b" fontWeight="bold" letterSpacing="0.1em" fontFamily="monospace">ROUTER</text>
              </g>

              {/* LP Splits Node (Token A / B) */}
              <g>
                {/* Token A */}
                <rect 
                  x="352" 
                  y="27" 
                  width="36" 
                  height="26" 
                  rx="6" 
                  ry="6" 
                  fill="rgba(5, 8, 20, 0.9)" 
                  stroke={
                    simState === "swapping" || simState === "pooling" || simState === "complete" ? "#00e5ff" : 
                    "rgba(255, 255, 255, 0.05)"
                  } 
                  strokeWidth="1.5" 
                  className="transition-all duration-500"
                />
                <text x="370" y="38" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold" fontFamily="monospace">{activeVault.allocations[0]?.token.symbol || "USDT"}</text>
                <text x="370" y="47" textAnchor="middle" fontSize="6.5" fill="#00e5ff" fontWeight="bold" fontFamily="monospace">{activeVault.allocations[0]?.weight || 50}%</text>

                {/* Token B */}
                <rect 
                  x="352" 
                  y="107" 
                  width="36" 
                  height="26" 
                  rx="6" 
                  ry="6" 
                  fill="rgba(5, 8, 20, 0.9)" 
                  stroke={
                    simState === "swapping" || simState === "pooling" || simState === "complete" ? "#00e5ff" : 
                    "rgba(255, 255, 255, 0.05)"
                  } 
                  strokeWidth="1.5" 
                  className="transition-all duration-500"
                />
                <text x="370" y="118" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold" fontFamily="monospace">{activeVault.allocations[1]?.token.symbol || "USDC"}</text>
                <text x="370" y="127" textAnchor="middle" fontSize="6.5" fill="#00e5ff" fontWeight="bold" fontFamily="monospace">{activeVault.allocations[1]?.weight || 50}%</text>
              </g>

              {/* Target Vault Node Group */}
              <g>
                <rect 
                  x="520" 
                  y="60" 
                  width="40" 
                  height="40" 
                  rx="8" 
                  ry="8" 
                  fill="rgba(5, 8, 20, 0.9)" 
                  stroke={simState === "complete" ? "#00ff88" : "rgba(255, 255, 255, 0.05)"} 
                  strokeWidth="1.5" 
                  className="transition-all duration-300"
                  style={{
                    filter: simState === "complete" ? "drop-shadow(0 0 10px rgba(0, 255, 136, 0.3))" : "none"
                  }}
                />
                <text x="540" y="78" textAnchor="middle" fontSize="14">🛡️</text>
                <text x="540" y="92" textAnchor="middle" fontSize="7" fill="#ffffff" fontWeight="bold" fontFamily="monospace">{activeVault.symbol}</text>
                <text x="540" y="115" textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="bold" letterSpacing="0.05em" fontFamily="monospace">STAKED</text>
              </g>
            </svg>
          </div>

          {/* Description status updates */}
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-center text-[10.5px] text-slate-400 font-medium">
            {simState === "idle" && "Configure inputs and select 'Simulate Routing' to start the transaction flow."}
            {simState === "routing" && `Analyzing liquidity routes for ${simAmount} ${simToken} on Mantle network...`}
            {simState === "swapping" && `Swapping ${simToken} into dynamic LP pool tokens at optimum rates...`}
            {simState === "pooling" && `Depositing splits into Moe liquidity pools & acquiring compounder shares...`}
            {simState === "complete" && `Vault shares issued to wallet. Auto-compounding yield accrues below:`}
          </div>
        </div>
      </div>

      {simState === "complete" && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#00ff88]/5 to-[#00e5ff]/5 border border-[#00ff88]/15 flex justify-between items-center animate-float">
          <div>
            <h5 className="text-xs font-bold text-[#00ff88] flex items-center gap-1.5">
              <span className="pulse-dot" />
              Compounding Active
            </h5>
            <p className="text-[10px] text-slate-400 mt-0.5">Compounding mock yield at 300x speed (Strategy APY: {apy}%):</p>
          </div>
          <span ref={simYieldSpanRef} className="text-lg font-mono font-bold text-[#00ff88] animate-pulse">+$0.000000</span>
        </div>
      )}
    </div>
  );
});

// --- MAIN CLIENT COMPONENT ---
export default function App() {
  const { isConnected, address, chain } = useAccount();
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [appMode, setAppMode] = useState<"landing" | "app">("landing");
  const [currentView, setCurrentView] = useState<"baskets" | "detail" | "dashboard" | "leaderboard" | "synthesizer">("baskets");
  
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
      USDT: 5000.0,
      USDC: 3500.0,
      MNT: 1200.0,
      shares: initialShares,
    };
  });

  // Action variables
  const [txAmount, setTxAmount] = useState<string>("");
  const [txToken, setTxToken] = useState<"USDT" | "USDC" | "MNT">("USDT");
  const [txModalOpen, setTxModalOpen] = useState<boolean>(false);
  const [txType, setTxType] = useState<"deposit" | "withdraw">("deposit");
  const [txStatus, setTxStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [txStep, setTxStep] = useState<number>(0);
  const [txError, setTxError] = useState<string>("");

  // Live stats triggers
  const [liveApys, setLiveApys] = useState<Record<string, number>>(() => {
    const initialApys: Record<string, number> = {};
    Object.keys(VAULTS).forEach((key) => {
      const range = VAULTS[key as keyof typeof VAULTS].targetApy.replace("%", "").split("-");
      initialApys[key] = range.length === 2 ? (parseFloat(range[0]) + parseFloat(range[1])) / 2 : parseFloat(range[0]);
    });
    return initialApys;
  });
  const [apyDirection, setApyDirection] = useState<Record<string, "up" | "down" | "flat">>({});

  // Onboarding Tutorial slides
  const [tutorialOpen, setTutorialOpen] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(0);

  // Strategy Creator / Synthesizer states
  const [synthName, setSynthName] = useState<string>("");
  const [synthTokenA, setSynthTokenA] = useState<keyof typeof TOKENS>("USDC");
  const [synthTokenB, setSynthTokenB] = useState<keyof typeof TOKENS>("mETH");
  const [synthWeightA, setSynthWeightA] = useState<number>(50);
  const [synthRisk, setSynthRisk] = useState<string>("Medium");
  const [synthApy, setSynthApy] = useState<string>("16.5");
  const [synthDesc, setSynthDesc] = useState<string>("");
  const [synthStatus, setSynthStatus] = useState<"idle" | "compiling" | "broadcasting" | "success" | "error">("idle");
  const [synthLogs, setSynthLogs] = useState<string[]>([]);
  const [synthError, setSynthError] = useState<string>("");

  // Real Web3 hooks
  const { writeContract, data: txHash, error: web3WriteError } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  // Load initial APY figures from the backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/apy`)
      .then((res) => res.json())
      .then((data) => {
        const newApys: Record<string, number> = {};
        Object.keys(data).forEach((key) => {
          if (key !== "lastUpdated") {
            newApys[key] = data[key];
          }
        });
        setLiveApys(newApys);
      })
      .catch((err) => console.log("Failed to seed initial APYs from backend:", err));
  }, []);

  // APY dynamic fluctuation loops
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveApys((prev) => {
        const next = { ...prev };
        const dirs: Record<string, "up" | "down" | "flat"> = {};
        Object.keys(next).forEach((key) => {
          const change = (Math.random() - 0.5) * 0.25;
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
        setTimeout(() => setApyDirection({}), 2200);
        return next;
      });
    }, 30000);
    return () => clearInterval(timer);
  }, [vaultsList]);

  // Execute Deposit / Withdraw transactions
  const handleExecuteTx = async (type: "deposit" | "withdraw") => {
    if (!txAmount || parseFloat(txAmount) <= 0) return;
    setTxType(type);
    setTxStatus("loading");
    setTxModalOpen(true);
    setTxError("");

    if (demoMode) {
      try {
        const amount = parseFloat(txAmount);
        if (type === "deposit") {
          if (demoBalances[txToken] < amount) throw new Error("Insufficient balance in simulated wallet.");
          
          setTxStep(1); await new Promise((res) => setTimeout(res, 1000));
          setTxStep(2); await new Promise((res) => setTimeout(res, 1200));
          setTxStep(3); await new Promise((res) => setTimeout(res, 1200));
          setTxStep(4); await new Promise((res) => setTimeout(res, 800));

          setDemoBalances((prev) => ({
            ...prev,
            [txToken]: prev[txToken] - amount,
            shares: { ...prev.shares, [selectedVaultKey]: prev.shares[selectedVaultKey] + amount }
          }));
        } else {
          if (demoBalances.shares[selectedVaultKey] < amount) throw new Error("Insufficient strategy shares to withdraw.");
          
          setTxStep(1); await new Promise((res) => setTimeout(res, 1000));
          setTxStep(2); await new Promise((res) => setTimeout(res, 1200));
          setTxStep(3); await new Promise((res) => setTimeout(res, 1200));
          setTxStep(4); await new Promise((res) => setTimeout(res, 800));

          setDemoBalances((prev) => ({
            ...prev,
            [txToken]: prev[txToken] + amount,
            shares: { ...prev.shares, [selectedVaultKey]: Math.max(0, prev.shares[selectedVaultKey] - amount) }
          }));
        }
        setTxStatus("success");
        setTxAmount("");
      } catch (err: any) {
        setTxStatus("error");
        setTxError(err.message || "Simulated transaction failed.");
      }
    } else {
      if (!isConnected || !address) {
        setTxStatus("error");
        setTxError("Web3 account not connected. Please connect wallet.");
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
          
          // Query backend Quote API
          const quoteRes = await fetch(`${API_BASE_URL}/api/quote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inputTokenSymbol: txToken,
              amountIn: txAmount,
              targetTokenASymbol: activeVault.allocations[0].token.symbol,
              targetTokenBSymbol: activeVault.allocations[1].token.symbol,
              slippageTolerance: 0.5,
            }),
          });
          const quote = await quoteRes.json();

          const decimalsA = activeVault.allocations[0].token.decimals;
          const decimalsB = activeVault.allocations[1].token.decimals;
          const amountAMin = parseUnits(quote.minAmountAOut || "0", decimalsA);
          const amountBMin = parseUnits(quote.minAmountBOut || "0", decimalsB);
          
          // Apply additional 2% slippage protection for the pool deposit step itself
          const amountAMinPool = (amountAMin * 98n) / 100n;
          const amountBMinPool = (amountBMin * 98n) / 100n;
          const minShares = ((amountWei / 2n) * 98n) / 100n; // Conservative min shares expectation

          await writeContract({
            address: activeVault.address,
            abi: VAULT_ABI,
            functionName: "depositWithERC20",
            args: [
              TOKENS[txToken].address,
              amountWei,
              minShares,
              quote.pathA,
              quote.pathB,
              amountAMin,
              amountBMin,
              amountAMinPool,
              amountBMinPool,
              deadline,
            ],
          });
        } else {
          setTxStep(1);
          
          // Request quote to estimate output values and minimum parameters for withdrawal
          const tokenASymbol = activeVault.allocations[0].token.symbol;
          const tokenBSymbol = activeVault.allocations[1].token.symbol;
          
          // Query pool split estimates (using txToken as a mock baseline weight structure)
          const quoteRes = await fetch(`${API_BASE_URL}/api/quote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inputTokenSymbol: txToken,
              amountIn: txAmount,
              targetTokenASymbol: tokenASymbol,
              targetTokenBSymbol: tokenBSymbol,
              slippageTolerance: 0.5,
            }),
          });
          const quote = await quoteRes.json();

          const decimalsA = activeVault.allocations[0].token.decimals;
          const decimalsB = activeVault.allocations[1].token.decimals;
          
          const amountAEstimate = parseUnits(quote.amountAOut || "0", decimalsA);
          const amountBEstimate = parseUnits(quote.amountBOut || "0", decimalsB);
          
          // Call quote API for Token A -> txToken
          const quoteResA = await fetch(`${API_BASE_URL}/api/quote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inputTokenSymbol: tokenASymbol,
              amountIn: quote.amountAOut,
              targetTokenASymbol: txToken,
              targetTokenBSymbol: txToken,
              slippageTolerance: 0.5,
            }),
          });
          const quoteA = await quoteResA.json();

          // Call quote API for Token B -> txToken
          const quoteResB = await fetch(`${API_BASE_URL}/api/quote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inputTokenSymbol: tokenBSymbol,
              amountIn: quote.amountBOut,
              targetTokenASymbol: txToken,
              targetTokenBSymbol: txToken,
              slippageTolerance: 0.5,
            }),
          });
          const quoteB = await quoteResB.json();

          const minAmountA = (amountAEstimate * 98n) / 100n;
          const minAmountB = (amountBEstimate * 98n) / 100n;
          const amountAMinOut = parseUnits(quoteA.minAmountAOut || "0", decimals);
          const amountBMinOut = parseUnits(quoteB.minAmountBOut || "0", decimals);
          const minOutputOut = amountAMinOut + amountBMinOut;

          const pathA = [activeVault.allocations[0].token.address, TOKENS[txToken].address];
          const pathB = [activeVault.allocations[1].token.address, TOKENS[txToken].address];

          await writeContract({
            address: activeVault.address,
            abi: VAULT_ABI,
            functionName: "withdrawToERC20",
            args: [
              amountWei,
              TOKENS[txToken].address,
              minAmountA,
              minAmountB,
              pathA,
              pathB,
              amountAMinOut,
              amountBMinOut,
              minOutputOut,
              deadline,
            ],
          });
        }
      } catch (err: any) {
        setTxStatus("error");
        setTxError(err.message || "Blockchain wallet write request rejected.");
      }
    }
  };

  // Watch real Web3 receipts
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
      setTxError(web3WriteError.message || "EVM transaction failed on-chain.");
    }
  }, [isTxConfirming, isTxConfirmed, web3WriteError]);

  // Synthesize and Compile strategy
  const handleSynthesizeStrategy = async () => {
    if (!synthName) return;
    setSynthStatus("compiling");
    setSynthLogs([]);
    setSynthError("");

    const pushLog = (msg: string, delay: number) => {
      return new Promise<void>((res) => {
        setTimeout(() => {
          setSynthLogs((prev) => [...prev, msg]);
          res();
        }, delay);
      });
    };

    try {
      await pushLog("> [INFO] Initializing Yul Bytecode compiler...", 600);
      await pushLog("> [INFO] Verifying token liquidity pools on Merchant Moe...", 700);
      await pushLog(`> [INFO] Resolving pair swaps mapping for inputs USDT -> ${synthTokenA}/${synthTokenB}...`, 800);
      await pushLog(`> [WARN] Slip check warning: target weight distribution ${synthWeightA}% / ${100 - synthWeightA}%`, 600);
      await pushLog("> [INFO] Optimizing contract layouts for minimal EVM execution gas...", 800);
      
      setSynthStatus("broadcasting");
      await pushLog("> [INFO] Strategy bytecode compiled successfully: 4,120 bytes.", 500);
      await pushLog("> [INFO] Broadcasting custom proxy contract to local node...", 800);
      await pushLog("> [INFO] Mining transaction index. Submitting gas limits...", 900);
      
      const newKey = synthName.toLowerCase().replace(/\s+/g, "");
      const newVaultAddress = "0x" + Math.random().toString(16).substring(2, 42);
      
      await pushLog(`> [SUCCESS] Vault deployed at ${newKey}.proxy.basketflow.mnt (${newVaultAddress.slice(0, 10)}...)`, 400);

      const newVault = {
        id: Object.keys(vaultsList).length + 1,
        name: synthName,
        symbol: `bf${synthName.substring(0, 4).toUpperCase()}`,
        address: newVaultAddress,
        description: synthDesc || "Custom structured strategy compiled by designer.",
        targetApy: `${synthApy}%`,
        risk: synthRisk,
        allocations: [
          { token: TOKENS[synthTokenA], weight: synthWeightA },
          { token: TOKENS[synthTokenB], weight: 100 - synthWeightA },
        ]
      };

      setVaultsList((prev) => ({ ...prev, [newKey]: newVault }));
      setLiveApys((prev) => ({ ...prev, [newKey]: parseFloat(synthApy) }));
      
      setSynthStatus("success");
      setTimeout(() => {
        setSynthStatus("idle");
        setSynthName("");
        setSynthDesc("");
        setSelectedVaultKey(newKey);
        setCurrentView("detail");
      }, 1800);
    } catch (err: any) {
      setSynthStatus("error");
      setSynthError(err.message || "Compilation failed. Memory overflow in EVM compiler.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#03060f] relative overflow-hidden">
      
      {/* Background radial overlays */}
      <div className="bg-glow-purple" />
      <div className="bg-glow-mint" />

      {/* --- 1. LANDING PAGE VIEW --- */}
      {appMode === "landing" ? (
        <div className="flex flex-col min-h-screen z-10 relative">
          
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#03060f]/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl animate-float">🧺</span>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#00ff88] to-[#00e5ff] bg-clip-text text-transparent font-display">
                  BasketFlow
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { setTutorialStep(0); setTutorialOpen(true); }}
                  className="btn-secondary py-1.5 px-3.5 text-xs text-[#fbbf24] border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10 font-bold"
                >
                  💡 1-Min Guide
                </button>
                <button 
                  onClick={() => setAppMode("app")}
                  className="btn-primary py-1.5 px-4 text-xs font-bold"
                >
                  Launch App
                </button>
              </div>
            </div>
          </header>

          {/* Hero Main Area */}
          <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-12 flex flex-col gap-12">
            
            {/* Banner block */}
            <div className="relative overflow-hidden rounded-3xl bg-black/40 border border-white/5 p-8 sm:p-14 text-center flex flex-col items-center gap-6">
              <span className="text-[10px] font-bold px-3.5 py-1 rounded-full bg-gradient-to-r from-[#00ff88]/10 to-[#00e5ff]/10 border border-[#00ff88]/20 text-[#00ff88] uppercase tracking-wider font-mono">
                ⚡ Mantle Network Yield Aggregator
              </span>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight max-w-2xl leading-tight text-white font-display">
                DeFi yield portfolios,{" "}
                <span className="bg-gradient-to-r from-[#00ff88] to-[#00e5ff] bg-clip-text text-transparent">
                  in a single click.
                </span>
              </h1>

              <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
                Deposit digital dollars or gas assets into custom risk-tiered baskets. 
                Our smart contracts automatically swap, split, and compound your returns on Merchant Moe LPs.
              </p>

              <div className="mt-2 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setAppMode("app")}
                  className="btn-primary py-3 px-6 text-xs font-bold flex items-center justify-center gap-2"
                >
                  Launch App Dashboard
                  <ArrowUpRight size={14} />
                </button>
                <button 
                  onClick={() => { setTutorialStep(0); setTutorialOpen(true); }}
                  className="btn-secondary py-3 px-6 text-xs font-bold text-[#fbbf24] bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10"
                >
                  💡 Simple Onboarding Guide
                </button>
              </div>

              {/* Ticker Stats */}
              <HeroStats />
            </div>

            {/* Signature animated routing node flow */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-center text-white">How Dynamic Yield Routing Works</h2>
              <YieldRoutingVisualizer vaultsList={vaultsList} />
            </div>

            {/* Preset Baskets Grid */}
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-xl font-bold text-white">Featured Preset Baskets</h2>
                  <p className="text-xs text-slate-400 mt-1">Explore preset LP wrap strategies compiled on Mantle.</p>
                </div>
                <button 
                  onClick={() => setAppMode("app")}
                  className="btn-secondary py-1.5 px-3.5 text-xs font-bold"
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
                      className="panel panel-interactive p-5 flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            vault.risk === "Minimal" ? "pill-mint" :
                            vault.risk === "Low" ? "pill-teal" :
                            vault.risk === "Medium" ? "pill-indigo" :
                            "pill-rose"
                          }`}>
                            {vault.risk} Risk
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">MANTLE</span>
                        </div>
                        <h3 className="text-base font-bold text-white mb-1">{vault.name}</h3>
                        <p className="text-xs text-slate-400 mb-4 line-clamp-2">{vault.description}</p>
                        
                        <div className="bg-white/3 rounded-xl p-3 mb-4 border border-white/5">
                          <div className="text-[9px] text-slate-400 mb-0.5 uppercase tracking-wider font-bold">Estimated APY</div>
                          <span className="text-2xl font-black text-[#00ff88] font-mono">{apyVal}</span>
                        </div>
                      </div>
                      <button className="btn-primary w-full py-2.5 text-xs font-bold">
                        Stake Basket
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
          
          {/* Footer */}
          <footer className="border-t border-white/5 py-6 bg-black/30 mt-auto text-center text-xs text-slate-500 font-medium font-mono">
            © {new Date().getFullYear()} BASKETFLOW. STABLE AUTO-COMPOUNDING ON MANTLE.
          </footer>
        </div>
      ) : (
        
        // --- 2. DAPP CORE DASHBOARD VIEW ---
        <div className="flex flex-col min-h-screen z-10 relative bg-[#03060f]">
          
          {/* Sticky Top Header */}
          <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#03060f]/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              
              <div className="flex items-center gap-8">
                {/* Brand Logo */}
                <div 
                  onClick={() => setAppMode("landing")}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-xl animate-float">🧺</span>
                  <span className="sidebar-logo text-base font-bold text-white tracking-tight">BasketFlow</span>
                </div>
                
                {/* Desktop Tabs */}
                <nav className="hidden md:flex items-center gap-1">
                  <button
                    onClick={() => setCurrentView("baskets")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentView === "baskets" || currentView === "detail"
                        ? "bg-white/10 text-white font-bold" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Invest Baskets
                  </button>
                  <button
                    onClick={() => setCurrentView("dashboard")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentView === "dashboard" 
                        ? "bg-white/10 text-white font-bold" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    My Portfolio
                  </button>
                  <button
                    onClick={() => setCurrentView("synthesizer")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentView === "synthesizer" 
                        ? "bg-white/10 text-white font-bold" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Synthesize
                  </button>
                  <button
                    onClick={() => setCurrentView("leaderboard")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentView === "leaderboard" 
                        ? "bg-white/10 text-white font-bold" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Leaderboard
                  </button>
                </nav>
              </div>

              {/* Right Side Info & Controls */}
              <div className="flex items-center gap-3">
                
                {/* Technical status widget */}
                <div className="relative group hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 cursor-help font-mono text-[9px] text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00ff88] animate-pulse" />
                  <span>{chain?.name || "Mantle Sepolia"}</span>
                  
                  {/* Tooltip */}
                  <div className="absolute right-0 top-9 hidden group-hover:flex flex-col gap-1.5 p-3 w-40 bg-[#0a0d14] border border-white/5 rounded-xl shadow-2xl z-50 text-[9px] text-slate-400 font-mono">
                    <div className="flex justify-between">
                      <span>CHAIN ID:</span>
                      <span className="text-white font-bold">{chain?.id || 5003}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>BLOCKS:</span>
                      <span className="text-[#00e5ff] font-bold">#10432</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GAS:</span>
                      <span className="text-[#fbbf24] font-bold">12 Gwei</span>
                    </div>
                  </div>
                </div>

                {/* Sandbox toggle */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs">
                  <span className="text-slate-400 font-bold font-mono text-[9px] tracking-wider">SANDBOX</span>
                  <button 
                    onClick={() => setDemoMode(!demoMode)} 
                    className={`relative inline-flex h-4.5 w-8 shrink-0 items-center rounded-full transition-colors outline-none cursor-pointer ${
                      demoMode ? "bg-[#00ff88]" : "bg-white/10"
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-slate-900 transition-transform ${
                      demoMode ? "translate-x-4" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>

                {/* Wallet Info */}
                {!demoMode ? (
                  <ConnectButton label="Connect Wallet" />
                ) : (
                  <div className="flex items-center gap-1.5 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-lg px-2.5 py-1 text-xs text-[#00ff88] font-bold font-mono">
                    <ShieldCheck size={13} />
                    <span>Sandbox User</span>
                  </div>
                )}

                {/* Guide button */}
                <button
                  onClick={() => { setTutorialStep(0); setTutorialOpen(true); }}
                  className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-[#fbbf24] border border-amber-500/20"
                  title="Beginner Guide"
                >
                  <HelpCircle size={15} />
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Viewport */}
          <main className="flex-grow flex flex-col pb-20 md:pb-0 overflow-y-auto">
            
            {/* Core Views Column */}
            <div className="flex-grow p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto flex flex-col gap-6">
              
              {/* Sandbox info banner */}
              {demoMode && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-[#00ff88]/5 to-[#00e5ff]/5 border border-[#00ff88]/10 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 text-[#00ff88] font-bold font-mono text-[10px]">
                    <Activity size={14} className="animate-pulse" />
                    <span>SANDBOX ACCRUAL ACTIVE (300X SPEED)</span>
                  </div>
                  <button 
                    onClick={() => setDemoBalances({
                      USDT: 5000,
                      USDC: 3500,
                      MNT: 1200,
                      shares: { conservative: 0, mantleMax: 0, stableShuffle: 0 }
                    })}
                    className="text-[9px] text-slate-400 hover:text-white underline font-bold"
                  >
                    Reset Balances
                  </button>
                </div>
              )}

              {/* VIEW 1: BASKETS GRID */}
              {currentView === "baskets" && (
                <div className="flex flex-col gap-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-black text-white">Investment Baskets</h2>
                      <p className="text-xs text-slate-400">Select a preset strategy below to stake assets and compound yield.</p>
                    </div>
                    <button 
                      onClick={() => setCurrentView("synthesizer")}
                      className="btn-primary py-2 px-3.5 text-xs font-bold"
                    >
                      <Plus size={14} />
                      Create Strategy
                    </button>
                  </div>

                  <div className="cards-grid">
                    {Object.keys(vaultsList).map((key) => {
                      const vault = vaultsList[key];
                      const apyVal = liveApys[key] !== undefined ? `${liveApys[key]}%` : vault.targetApy;
                      const direction = apyDirection[key];
                      const glowClass = direction === "up" ? "flash-up" : direction === "down" ? "flash-down" : "";
                      const apyColor = direction === "up" ? "text-emerald-400" : direction === "down" ? "text-rose-400" : "text-[#00ff88]";

                      return (
                        <div 
                          key={key}
                          onClick={() => {
                            setSelectedVaultKey(key);
                            setCurrentView("detail");
                          }}
                          className={`panel panel-interactive p-5 flex flex-col justify-between group transition-all duration-300 ${glowClass}`}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                vault.risk === "Minimal" ? "pill-mint" :
                                vault.risk === "Low" ? "pill-teal" :
                                vault.risk === "Medium" ? "pill-indigo" :
                                "pill-rose"
                              }`}>
                                {vault.risk} Risk
                              </span>
                              <span className="pulse-dot" />
                            </div>

                            <h3 className="text-base font-bold text-white mb-1">{vault.name}</h3>
                            <p className="text-xs text-slate-400 mb-4 line-clamp-2">{vault.description}</p>

                            {/* APY metrics box */}
                            <div className="bg-white/2 rounded-xl p-3 border border-white/5 flex justify-between items-center mb-4">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Target APY</span>
                              <span className={`text-lg font-black font-mono flex items-center gap-1 ${apyColor}`}>
                                {apyVal}
                                {direction === "up" && "▲"}
                                {direction === "down" && "▼"}
                              </span>
                            </div>

                            {/* splits ratios slider preview */}
                            <div className="flex flex-col gap-1.5 mb-2">
                              <span className="text-[9px] text-slate-505 font-bold uppercase tracking-wider">Asset splits</span>
                              <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-white/5">
                                {vault.allocations.map((alloc: any, idx: number) => {
                                  const splitColors = ["bg-[#00ff88]", "bg-[#00e5ff]", "bg-[#6366f1]", "bg-[#fbbf24]"];
                                  const colorClass = splitColors[idx % splitColors.length];
                                  return (
                                    <div 
                                      key={idx} 
                                      style={{ width: `${alloc.weight}%` }} 
                                      className={`h-full ${colorClass}`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          
                          <button className="btn-secondary w-full py-2 text-xs font-bold mt-4">
                            Select Strategy
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* VIEW 2: VAULT DETAIL */}
              {currentView === "detail" && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setCurrentView("baskets")}
                      className="btn-secondary py-1.5 px-3.5 text-xs flex items-center gap-1.5 font-bold"
                    >
                      <ArrowLeft size={12} />
                      Back to Baskets
                    </button>
                    <span className="text-[9px] text-slate-500 font-bold bg-white/3 border border-white/5 px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">Mantle Vault</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Detail Charts */}
                    <div className="lg:col-span-2 flex flex-col gap-5">
                      <div className="panel p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h2 className="text-xl font-bold text-white">{activeVault.name}</h2>
                            <p className="text-xs text-slate-400 mt-1">{activeVault.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-500 uppercase font-bold font-mono">LIVE APY</span>
                            <div className="text-xl font-black text-[#00ff88] font-mono">
                              {liveApys[selectedVaultKey] || activeVault.targetApy}%
                            </div>
                          </div>
                        </div>

                        {/* Chart */}
                        <div className="mt-4">
                          <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Historical Yield Progress (30D)</h4>
                          <PerformanceChart vaultKey={selectedVaultKey} />
                        </div>
                      </div>

                      {/* Splits compositions panel */}
                      <div className="panel p-5 flex flex-col sm:flex-row items-center gap-6">
                        <CompositionChart allocations={activeVault.allocations} />
                        <div className="flex-grow flex flex-col gap-2 w-full">
                          <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">LP Allocation Weights</h4>
                          {activeVault.allocations.map((alloc: any, idx: number) => {
                            const splitColors = ["bg-[#00ff88]", "bg-[#00e5ff]", "bg-[#6366f1]", "bg-[#fbbf24]"];
                            const colorClass = splitColors[idx % splitColors.length];
                            return (
                              <div key={idx} className="p-2.5 bg-white/2 border border-white/5 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                                  <div>
                                    <div className="font-bold text-xs text-white">{alloc.token.symbol}</div>
                                    <div className="text-[8px] text-slate-500 font-bold uppercase">{alloc.token.name}</div>
                                  </div>
                                </div>
                                <span className="text-xs font-mono font-bold text-white">{alloc.weight}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right Staking Form */}
                    <div className="panel p-5 border border-[#00ff88]/15 flex flex-col justify-between gap-5">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Staking Ledger</h4>
                        <p className="text-[9.5px] text-slate-400">Funds are routed and deposited directly on Merchant Moe LPs.</p>

                        <div className="flex flex-col gap-4 mt-6">
                          <div className="input-group">
                            <div className="flex justify-between text-[9px] text-slate-400 font-bold font-mono">
                              <span>AMOUNT</span>
                              <span>BAL: {demoMode ? `${demoBalances[txToken]} ${txToken}` : "Connected"}</span>
                            </div>
                            <div className="input-container">
                              <input 
                                type="number" 
                                placeholder="0.00" 
                                value={txAmount}
                                onChange={(e) => setTxAmount(e.target.value)}
                                className="input-field"
                              />
                              <select 
                                value={txToken}
                                onChange={(e) => setTxToken(e.target.value as any)}
                                className="token-select"
                              >
                                <option value="USDT">USDT</option>
                                <option value="USDC">USDC</option>
                                <option value="MNT">MNT</option>
                              </select>
                            </div>
                          </div>

                          {/* Splits dynamic preview */}
                          {txAmount && parseFloat(txAmount) > 0 && (
                            <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex flex-col gap-1 text-[10px] text-slate-400 font-mono">
                              <div className="flex justify-between text-white font-bold">
                                <span>LP swap splits</span>
                                <span>~{(parseFloat(txAmount) * (activeVault.allocations[0]?.weight || 50) / 100).toFixed(2)} / {(parseFloat(txAmount) * (activeVault.allocations[1]?.weight || 50) / 100).toFixed(2)}</span>
                              </div>
                              <span>Route: {activeVault.allocations.map((a: any) => a.token.symbol).join(" / ")} Pair</span>
                            </div>
                          )}

                          <div className="flex flex-col gap-2 mt-2">
                            <button 
                              onClick={() => handleExecuteTx("deposit")}
                              className="btn-primary py-3 text-xs w-full flex items-center justify-center gap-1.5"
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

                      {/* Live user position details */}
                      {demoBalances.shares[selectedVaultKey] > 0 && (
                        <div className="border-t border-white/5 pt-4 flex flex-col gap-1 text-[10.5px]">
                          <div className="flex justify-between text-slate-400">
                            <span>Active Balance:</span>
                            <span className="text-white font-bold font-mono">{demoBalances.shares[selectedVaultKey]} shares</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Accrued Yield:</span>
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

              {/* VIEW 3: USER PORTFOLIO DASHBOARD */}
              {currentView === "dashboard" && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2 className="text-xl font-black text-white">Portfolio Dashboard</h2>
                    <p className="text-xs text-slate-400">Monitor your active yield-bearing allocations and overall accrued interest.</p>
                  </div>

                  {/* Portfolio values banner */}
                  <div className="panel p-6 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Aggregate Position Balance</span>
                      <div className="text-3xl font-extrabold text-white mt-1 font-mono">
                        ${(demoBalances.shares.conservative * 1.0 + demoBalances.shares.mantleMax * 1.25 + demoBalances.shares.stableShuffle * 0.95).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </div>
                      <span className="text-[10px] text-[#00ff88] font-bold flex items-center gap-1.5 mt-2">
                        <span className="pulse-dot" />
                        Yield updates in real-time
                      </span>
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 min-w-[200px]">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Total Yield Earned</span>
                      <div className="text-xl font-bold mt-1">
                        {demoMode ? (
                          <InterestTicker shares={demoBalances.shares} liveApys={liveApys} vaultsList={vaultsList} />
                        ) : (
                          <span className="text-slate-505 font-mono">$0.000000</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* List of positions */}
                  <div className="panel p-5">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Active Strategy Shares</h3>
                    
                    <div className="flex flex-col gap-3">
                      {Object.keys(vaultsList).map((key) => {
                        const vault = vaultsList[key];
                        const shareBal = demoMode ? demoBalances.shares[key] || 0 : 0;
                        if (shareBal <= 0) return null;

                        return (
                          <div key={key} className="p-4 bg-white/2 border border-white/5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl animate-float">🧺</span>
                              <div>
                                <h4 className="font-bold text-xs text-white">{vault.name}</h4>
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">{vault.symbol} Shares</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6 sm:flex sm:gap-10 font-mono">
                              <div>
                                <span className="text-[8px] text-slate-500 uppercase font-bold">STAKED</span>
                                <div className="text-xs font-bold text-white">{shareBal}</div>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-500 uppercase font-bold">EST VAL</span>
                                <div className="text-xs font-bold text-[#00ff88]">${(shareBal * 1.05).toFixed(2)}</div>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-500 uppercase font-bold">APY RATE</span>
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
                        <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-white/5 rounded-2xl font-medium">
                          No active strategy shares. Select an investment basket to stake assets.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 4: STRATEGY SYNTHESIZER / CREATOR */}
              {currentView === "synthesizer" && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2 className="text-xl font-black text-white">Strategy Synthesizer</h2>
                    <p className="text-xs text-slate-400">Compile and deploy custom structured yields on Mantle network.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Control Form */}
                    <div className="panel p-5 flex flex-col gap-4">
                      {synthStatus === "idle" ? (
                        <>
                          <div className="input-group">
                            <label className="input-label">Strategy Name</label>
                            <div className="input-container">
                              <input 
                                type="text" 
                                placeholder="e.g. HyperMNT Compounder" 
                                value={synthName}
                                onChange={(e) => setSynthName(e.target.value)}
                                className="input-field"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="input-group">
                              <label className="input-label">Token A Component</label>
                              <select 
                                value={synthTokenA}
                                onChange={(e) => setSynthTokenA(e.target.value as any)}
                                className="token-select w-full"
                              >
                                <option value="USDT">USDT</option>
                                <option value="USDC">USDC</option>
                                <option value="mETH">mETH</option>
                                <option value="MNT">MNT</option>
                              </select>
                            </div>
                            <div className="input-group">
                              <label className="input-label">Token B Component</label>
                              <select 
                                value={synthTokenB}
                                onChange={(e) => setSynthTokenB(e.target.value as any)}
                                className="token-select w-full"
                              >
                                <option value="USDT">USDT</option>
                                <option value="USDC">USDC</option>
                                <option value="mETH">mETH</option>
                                <option value="MNT">MNT</option>
                              </select>
                            </div>
                          </div>

                          <div className="input-group">
                            <div className="flex justify-between text-[9px] font-bold font-mono text-slate-400 uppercase">
                              <span>Asset split allocation</span>
                              <span>{synthWeightA}% {synthTokenA} / {100 - synthWeightA}% {synthTokenB}</span>
                            </div>
                            <input 
                              type="range" 
                              min="10" 
                              max="90" 
                              step="5" 
                              value={synthWeightA}
                              onChange={(e) => setSynthWeightA(parseInt(e.target.value))}
                              className="w-full mt-1"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="input-group">
                              <label className="input-label">Target APY (%)</label>
                              <div className="input-container">
                                <input 
                                  type="number" 
                                  placeholder="15.5" 
                                  value={synthApy}
                                  onChange={(e) => setSynthApy(e.target.value)}
                                  className="input-field"
                                />
                              </div>
                            </div>
                            <div className="input-group">
                              <label className="input-label">Risk Profile</label>
                              <select 
                                value={synthRisk}
                                onChange={(e) => setSynthRisk(e.target.value)}
                                className="token-select w-full"
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                              </select>
                            </div>
                          </div>

                          <div className="input-group">
                            <label className="input-label">Description</label>
                            <textarea 
                              rows={2}
                              placeholder="Brief strategy goals..." 
                              value={synthDesc}
                              onChange={(e) => setSynthDesc(e.target.value)}
                              className="token-select w-full resize-none bg-black/40 border border-white/5 rounded-xl text-xs"
                              style={{ padding: '8px 12px' }}
                            />
                          </div>

                          <button 
                            onClick={handleSynthesizeStrategy}
                            disabled={!synthName}
                            className="btn-primary w-full py-3 mt-2 text-xs font-bold"
                          >
                            Compile & Synthesize
                          </button>
                        </>
                      ) : (
                        
                        /* Compiler Output terminal log screen */
                        <div className="flex flex-col gap-4 py-2">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <RefreshCw size={12} className="animate-spin text-[#00ff88]" />
                            <span>Bytecode compilation terminal</span>
                          </h4>
                          <div className="compiler-log">
                            {synthLogs.map((log, idx) => {
                              const isSuccess = log.includes("SUCCESS");
                              const isWarn = log.includes("WARN");
                              const lineClass = isSuccess ? "compiler-line-success" : isWarn ? "compiler-line-warn" : "compiler-line-info";
                              return (
                                <div key={idx} className={lineClass}>
                                  {log}
                                </div>
                              );
                            })}
                          </div>
                          
                          {synthStatus === "success" && (
                            <div className="text-center p-3.5 bg-emerald-500/5 border border-[#00ff88]/20 rounded-xl text-xs text-[#00ff88] font-bold font-mono">
                              ✓ strategy Deployed successfully. redirecting...
                            </div>
                          )}
                          {synthStatus === "error" && (
                            <div className="text-center p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-xl text-xs text-rose-500 font-bold font-mono">
                              ✕ Compilation Error: {synthError}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Preview Panel visualizer */}
                    <div className="panel p-5 bg-black/30 flex flex-col justify-between gap-5 text-center">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Live strategy preview</h4>
                        
                        <div className="my-6 flex justify-center items-center gap-6">
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-lg bg-black/60 border border-[#00e5ff] flex items-center justify-center font-bold text-xs text-white">
                              {synthTokenA}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold mt-1.5 font-mono">{synthWeightA}%</span>
                          </div>
                          <span className="text-slate-500 text-lg">✖</span>
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-lg bg-black/60 border border-[#6366f1] flex items-center justify-center font-bold text-xs text-white">
                              {synthTokenB}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold mt-1.5 font-mono">{100 - synthWeightA}%</span>
                          </div>
                        </div>

                        <div className="p-4 bg-white/2 border border-white/5 rounded-xl flex flex-col gap-2 text-left text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Vault Symbol:</span>
                            <span className="text-white font-bold font-mono">bf{synthName ? synthName.substring(0, 4).toUpperCase() : "STRT"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Risk Profile:</span>
                            <span className="text-[#fbbf24] font-bold">{synthRisk} Risk</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Target APY:</span>
                            <span className="text-[#00ff88] font-bold font-mono">{synthApy}% APY</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-[10px] text-slate-500 font-mono">
                        Vault structures utilize ERC-4626 standard wrappers.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 5: LEADERBOARD */}
              {currentView === "leaderboard" && (
                <div className="flex flex-col gap-5">
                  <div className="text-center mb-2">
                    <h2 className="text-xl font-black text-white">Yield Leaderboard</h2>
                    <p className="text-xs text-slate-400">Real-time stats tracking top compounding addresses on Mantle Network.</p>
                  </div>

                  <div className="panel overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/2 text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                          <th className="p-4 text-center w-16">Rank</th>
                          <th className="p-4">Staker Address</th>
                          <th className="p-4 text-center">Baskets</th>
                          <th className="p-4 text-right">Yield Earned</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs text-[#f8fafc]">
                        {[
                          { rank: 1, address: "replytim.mnt", baskets: 4, yield: "$423.82", badge: "Yield King" },
                          { rank: 2, address: "0x7099...79c8", baskets: 3, yield: demoMode ? <InterestTicker shares={demoBalances.shares} liveApys={liveApys} vaultsList={vaultsList} /> : "$0.00", badge: "You", highlight: true },
                          { rank: 3, address: "vitalik.eth", baskets: 2, yield: "$128.52", badge: "Pioneer" },
                          { rank: 4, address: "0x3c44...62b9", baskets: 1, yield: "$84.21", badge: "Regular" },
                          { rank: 5, address: "0x90f7...72ff", baskets: 1, yield: "$32.40", badge: "Regular" },
                        ].map((row, idx) => (
                          <tr key={idx} className={`${row.highlight ? "bg-[#00ff88]/5 hover:bg-[#00ff88]/10" : "hover:bg-white/2"}`}>
                            <td className="p-4 text-center font-bold text-[#00ff88] font-mono">
                              {row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : row.rank}
                            </td>
                            <td className="p-4 font-bold flex items-center gap-2">
                              <span className="font-mono">{row.address}</span>
                              {row.badge && (
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  row.badge === "Yield King" ? "pill-amber" :
                                  row.badge === "You" ? "pill-mint" :
                                  "pill-teal"
                                }`}>{row.badge}</span>
                              )}
                            </td>
                            <td className="p-4 text-center text-slate-400 font-semibold">{row.baskets} strategy</td>
                            <td className="p-4 text-right font-mono font-bold text-[#00ff88]">{row.yield}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar Block Explorer (Only visible on wide screens) */}
            <div className="hidden lg:flex flex-col w-72 shrink-0 border-l border-white/5 bg-black/10 p-5 gap-5">
              
              {/* Explorer block */}
              <LiveEventExplorer vaultsList={vaultsList} />

              {/* quick preview node flow router */}
              <div className="panel p-4 flex flex-col gap-3">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Quick Strategy Inspect</span>
                <p className="text-[9.5px] text-slate-400">Select target basket below to view historical yield chart:</p>
                <div className="flex flex-col gap-1.5">
                  {Object.keys(vaultsList).slice(0, 4).map((k) => (
                    <button
                      key={k}
                      onClick={() => {
                        setSelectedVaultKey(k);
                        setCurrentView("detail");
                      }}
                      className="p-2 rounded-lg border border-white/5 bg-black/25 flex justify-between items-center text-left hover:border-[#00ff88]/30 text-[10px] text-white font-bold transition-all"
                    >
                      <span>{vaultsList[k].name}</span>
                      <ChevronRight size={11} className="text-slate-500" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </main>

          {/* Bottom navigation bar for mobile viewports */}
          <div className="md:hidden mobile-nav-bar">
            <button 
              onClick={() => setCurrentView("baskets")} 
              className={`mobile-nav-item ${currentView === "baskets" || currentView === "detail" ? "active" : ""}`}
            >
              <Compass size={18} />
              <span>Invest</span>
            </button>
            <button 
              onClick={() => setCurrentView("dashboard")} 
              className={`mobile-nav-item ${currentView === "dashboard" ? "active" : ""}`}
            >
              <Layers size={18} />
              <span>Portfolio</span>
            </button>
            <button 
              onClick={() => setCurrentView("synthesizer")} 
              className={`mobile-nav-item ${currentView === "synthesizer" ? "active" : ""}`}
            >
              <Plus size={18} />
              <span>Synthesize</span>
            </button>
            <button 
              onClick={() => setCurrentView("leaderboard")} 
              className={`mobile-nav-item ${currentView === "leaderboard" ? "active" : ""}`}
            >
              <Award size={18} />
              <span>Rankings</span>
            </button>
          </div>
        </div>
      )}

      {/* --- BEGINNER DEFI TUTORIAL ONBOARDING MODAL --- */}
      {tutorialOpen && (
        <div className="modal-overlay">
          <div className="panel max-w-lg w-full p-8 mx-4 border border-[#fbbf24]/10 relative flex flex-col justify-between min-h-[360px]">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-[#fbbf24] border border-amber-500/20 uppercase tracking-wider font-mono">DeFi Beginner Guide</span>
                <button 
                  onClick={() => setTutorialOpen(false)}
                  className="text-xs text-slate-500 hover:text-white bg-transparent border-none cursor-pointer font-bold"
                >
                  ✕ Close
                </button>
              </div>

              {/* Guide Contents */}
              {tutorialStep === 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-black text-white">💰 1. What are Digital Dollars?</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Normally, blockchain accounts store volatile tokens like Ethereum whose prices bounce around. But there are also **Stablecoins** (like USDT and USDC) which are pegged directly to the US Dollar.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Think of stablecoins as **Digital Dollars**. A USDT balance is essentially cash stored in your web wallet. It does not fluctuate in price, making it the perfect foundation for saving and earning interest.
                  </p>
                </div>
              )}

              {tutorialStep === 1 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-black text-white">🍏 2. What is a Liquidity Pool?</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    In traditional finance, banks exchange currencies for you. In DeFi, we use automated smart contracts called **Liquidity Pools** (LPs) to trade assets.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Imagine a shared **Fruit Bowl** containing equal shares of apples (USDC) and oranges (mETH). Traders can throw in apples and grab oranges, paying a tiny credit card swap fee. The pool is funded by normal users (liquidity providers) who store their assets in the bowl and split those swap fees.
                  </p>
                </div>
              )}

              {tutorialStep === 2 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-black text-white">📈 3. Where does Yield APY come from?</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Every time a trader swaps tokens using a liquidity pool, a **0.25% fee** is charged. 
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    These fees accumulate inside the pool. Because swap fees are collected in real-time on thousands of trades daily, the pool assets grow larger and larger. The percentage profit generated by these swap fees over a year is called your **Yield APY (Annual Percentage Yield)**.
                  </p>
                </div>
              )}

              {tutorialStep === 3 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-black text-white">🧺 4. What does BasketFlow do?</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ordinarily, to deposit into a pool, you would have to manually swap half your money, provide equal ratios, sign multiple approval transactions, and pay heavy gas fees.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    **BasketFlow automates this entire headache.** You deposit a single token (USDT or MNT) into a basket. Our smart contract automatically splits the asset, performs swaps, deposits liquidity to Merchant Moe, stakes the LP tokens to accrue returns, and auto-compounds the profit back in—all in **one click** with low gas fees.
                  </p>
                </div>
              )}

              {tutorialStep === 4 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-black text-white">🛡️ 5. Safe & Simple Withdrawals</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    When you stake in a basket, you receive **Vault Shares** representing your ownership of the LP assets.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    You are in complete control of your funds. There are no locking periods or exit penalties. At any point, you can request a withdrawal: the contract automatically unstakes your LP tokens, converts the underlying assets back into standard USDT, and transfers it directly to your wallet in a single transaction.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
              <span className="text-[9px] text-slate-500 font-bold font-mono">STEP {tutorialStep + 1} OF 5</span>
              <div className="flex gap-2">
                {tutorialStep > 0 && (
                  <button 
                    onClick={() => setTutorialStep(tutorialStep - 1)} 
                    className="btn-secondary py-1 px-3.5 text-xs font-bold"
                  >
                    Back
                  </button>
                )}
                {tutorialStep < 4 ? (
                  <button 
                    onClick={() => setTutorialStep(tutorialStep + 1)} 
                    className="btn-primary py-1 px-4 text-xs font-bold"
                  >
                    Next Step
                  </button>
                ) : (
                  <button 
                    onClick={() => setTutorialOpen(false)}
                    className="btn-primary py-1 px-4 text-xs font-bold"
                  >
                    Finish Guide
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TRANSACTION PROGRESS STEP MODAL --- */}
      {txModalOpen && (
        <div className="modal-overlay">
          <div className="panel max-w-md w-full p-8 mx-4 border border-[#00ff88]/15 relative text-center">
            <h3 className="text-base font-bold text-white mb-6 uppercase tracking-wider font-display">
              {txType === "deposit" ? "Processing Deposit Stake" : "Processing Withdrawal Stake"}
            </h3>

            {/* Staking active states */}
            {txStatus === "loading" && (
              <div className="flex flex-col gap-6 items-center">
                <RefreshCw size={30} className="animate-spin text-[#00ff88] mb-1" />
                
                <div className="flex flex-col gap-2.5 w-full text-left font-medium">
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      txStep > 1 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 animate-pulse"
                    }`}>1</span>
                    <span className={`text-xs ${txStep > 1 ? "text-emerald-400 font-bold" : "text-white"}`}>Approving Token Spender Allowance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      txStep > 2 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : txStep === 2 
                          ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 animate-pulse" 
                          : "bg-white/5 text-slate-500 border border-white/5"
                    }`}>2</span>
                    <span className={`text-xs ${txStep > 2 ? "text-emerald-400 font-bold" : txStep === 2 ? "text-white" : "text-slate-500"}`}>Exchanging swaps on Merchant Moe</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      txStep > 3 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : txStep === 3 
                          ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 animate-pulse" 
                          : "bg-white/5 text-slate-500 border border-white/5"
                    }`}>3</span>
                    <span className={`text-xs ${txStep > 3 ? "text-emerald-400 font-bold" : txStep === 3 ? "text-white" : "text-slate-500"}`}>Staking LP tokens in Compounding Vault</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      txStep > 4 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : txStep === 4 
                          ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 animate-pulse" 
                          : "bg-white/5 text-slate-500 border border-white/5"
                    }`}>4</span>
                    <span className={`text-xs ${txStep > 4 ? "text-emerald-400 font-bold" : txStep === 4 ? "text-white" : "text-slate-500"}`}>Issuing BasketFlow shares to wallet</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-mono">Confirm transactions in MetaMask when prompted.</p>
              </div>
            )}

            {/* Success */}
            {txStatus === "success" && (
              <div className="flex flex-col gap-4 items-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-[#00ff88]/30 flex items-center justify-center text-xl text-[#00ff88] font-bold">
                  ✓
                </div>
                <h4 className="text-base font-bold text-white">Staking Successful</h4>
                <p className="text-xs text-slate-400 px-4">Your deposit has been successfully swapped, pooled, and staked. Shares have been issued to your address.</p>
                <button 
                  onClick={() => setTxModalOpen(false)}
                  className="btn-primary w-full py-3 mt-4 text-xs font-bold"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

            {/* Error */}
            {txStatus === "error" && (
              <div className="flex flex-col gap-4 items-center">
                <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-[#f43f5e]/30 flex items-center justify-center text-xl text-[#f43f5e] font-bold">
                  ✕
                </div>
                <h4 className="text-base font-bold text-[#f43f5e]">Transaction Failed</h4>
                <p className="text-xs text-slate-400 max-h-24 overflow-y-auto w-full p-2.5 bg-black/40 rounded-xl border border-white/5 text-left font-mono text-[10.5px]">
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
    </div>
  );
}
