import express from "express";
import cors from "cors";
import { PORT } from "./config.js";
import { getCachedApys, startApyScheduler, updateApys } from "./services/apy.js";
import { calculateQuote, QuoteRequest } from "./services/quotes.js";
import { getIndexerData, startIndexerScheduler } from "./services/indexer.js";

const app = express();

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// APY Endpoint
app.get("/api/apy", (req, res) => {
  const apys = getCachedApys();
  res.json(apys);
});

// Force APY update trigger
app.post("/api/apy/refresh", async (req, res) => {
  try {
    const apys = await updateApys();
    res.json({ success: true, data: apys });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to force APY update" });
  }
});

// Slippage and Quote Calculation Endpoint
app.post("/api/quote", async (req, res) => {
  const {
    inputTokenSymbol,
    amountIn,
    targetTokenASymbol,
    targetTokenBSymbol,
    slippageTolerance,
  } = req.body as QuoteRequest;

  if (!inputTokenSymbol || !amountIn || !targetTokenASymbol || !targetTokenBSymbol) {
    res.status(400).json({ error: "Missing required query parameters." });
    return;
  }

  try {
    const quote = await calculateQuote({
      inputTokenSymbol,
      amountIn,
      targetTokenASymbol,
      targetTokenBSymbol,
      slippageTolerance: slippageTolerance || 0.5,
    });
    res.json(quote);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to compute quote" });
  }
});

// Retrieve User Indexed Positions
app.get("/api/positions/:address", (req, res) => {
  const userAddress = req.params.address.toLowerCase();
  const indexerData = getIndexerData();
  const userShares = indexerData.userShares[userAddress] || {};
  
  res.json({
    address: userAddress,
    positions: userShares,
    timestamp: new Date().toISOString(),
  });
});

// Retrieve Indexed Transaction Events
app.get("/api/transactions", (req, res) => {
  const indexerData = getIndexerData();
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  
  // Return last N transactions sorted descending by timestamp
  const sortedTx = [...indexerData.transactions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  res.json(sortedTx);
});

// --- SERVER START & SCHEDULERS ---

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🧺 BasketFlow Backend Engine successfully started`);
  console.log(`📡 Server listening on port: ${PORT}`);
  console.log(`🚀 API: http://localhost:${PORT}/api`);
  console.log(`===============================================`);

  // Start cron schedulers
  startApyScheduler();
  startIndexerScheduler();
});
