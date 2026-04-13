import "dotenv/config";
import fetch from "node-fetch";
import { ethers } from "ethers";
import { getUniswapPrice } from "./dex/uniswap.js";
import { getSushiPrice } from "./dex/sushiswap.js";

// ================= CONFIG =================
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

const LOOP_DELAY = 1500;
const MIN_SPREAD = 0.002;
const GAS_COST = 0.50;

let totalPNL = 0;
let trades = 0;

// ================= CEX =================
const getCEXPrices = async () => {
  try {
    const [eth, btc] = await Promise.all([
      fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot").then(r => r.json()),
      fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot").then(r => r.json())
    ]);

    return {
      ETH: parseFloat(eth?.data?.amount),
      BTC: parseFloat(btc?.data?.amount)
    };
  } catch {
    return null;
  }
};

// ================= TRIANGULAR =================
const checkTriangular = (prices) => {
  if (!prices?.ETH || !prices?.BTC) return null;

  // simple triangle sim
  const ethToBtc = prices.ETH / prices.BTC;
  const btcToUsd = prices.BTC;

  const loop = ethToBtc * btcToUsd;

  return loop - prices.ETH;
};

// ================= DYNAMIC SIZE =================
const getTradeSize = (spread) => {
  if (spread > 0.01) return 500;
  if (spread > 0.005) return 250;
  return 100;
};

// ================= MAIN =================
const runBot = async () => {
  console.log("🚀 ARB1 PRO ENGINE STARTED");

  while (true) {
    try {
      const [uni, sushi, cex] = await Promise.all([
        getUniswapPrice(provider),
        getSushiPrice(provider),
        getCEXPrices()
      ]);

      console.log("🧪 RAW:", { uni, sushi, cex });

      if (!cex?.ETH) {
        console.log("⏳ Waiting for CEX...");
        await delay(LOOP_DELAY);
        continue;
      }

      const dexPrices = [
        { name: "UNI", price: uni },
        { name: "SUSHI", price: sushi }
      ].filter(p => isValid(p.price));

      if (!dexPrices.length) {
        console.log("⏳ No DEX data...");
        await delay(LOOP_DELAY);
        continue;
      }

      const best = dexPrices.reduce((a, b) => a.price > b.price ? a : b);

      const spread = (best.price - cex.ETH) / cex.ETH;

      console.log(`📊 ${best.name}: ${best.price} | CEX: ${cex.ETH} | Spread: ${spread}`);

      // ===== FILTER =====
      if (Math.abs(spread) > 0.05) continue;

      // ===== TRADE =====
      if (spread > MIN_SPREAD) {
        const size = getTradeSize(spread);
        const profit = size * spread - GAS_COST;

        if (profit <= 0) {
          console.log("🚫 No profit after gas");
          continue;
        }

        totalPNL += profit;
        trades++;

        console.log("🔥 ARB TRADE");
        console.log(`DEX: ${best.name}`);
        console.log(`💰 Profit: $${profit.toFixed(2)}`);
      }

      // ===== TRIANGULAR =====
      const tri = checkTriangular(cex);
      if (tri && tri > 1) {
        console.log("🔺 TRIANGULAR OPPORTUNITY:", tri.toFixed(2));
      }

      // ===== MEMPOOL (LIGHT) =====
      provider.getBlockNumber().then(() => {
        console.log("📡 Mempool heartbeat");
      });

    } catch (err) {
      console.log("❌ ERROR:", err.message);
    }

    await delay(LOOP_DELAY);
  }
};

const isValid = (n) => typeof n === "number" && isFinite(n);
const delay = (ms) => new Promise(res => setTimeout(res, ms));

runBot();