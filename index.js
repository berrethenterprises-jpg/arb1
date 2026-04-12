import "dotenv/config";
import fetch from "node-fetch";
import { ethers } from "ethers";
import { getUniswapPrice } from "./dex/uniswap.js";
import { getSushiPrice } from "./dex/sushiswap.js";

// ================= CONFIG =================
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

const LOOP_DELAY = 1500;
const MIN_SPREAD = 0.002; // 0.2%
const GAS_COST = 0.50;

let totalPNL = 0;
let trades = 0;

// ================= CEX =================
const getCEXPrice = async () => {
  try {
    const res = await fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot");
    const json = await res.json();
    const price = parseFloat(json?.data?.amount);
    return isFinite(price) ? price : null;
  } catch {
    return null;
  }
};

// ================= VALIDATION =================
const isValid = (n) => typeof n === "number" && isFinite(n);

// ================= MAIN =================
const runBot = async () => {
  console.log("🚀 ARB1 MULTI-DEX ENGINE STARTED");

  while (true) {
    try {
      // ===== FETCH ALL PRICES =====
      const [uni, sushi, cex] = await Promise.all([
        getUniswapPrice(provider),
        getSushiPrice(provider),
        getCEXPrice()
      ]);

      const dexPrices = [
        { name: "Uniswap", price: uni },
        { name: "Sushi", price: sushi }
      ].filter(p => isValid(p.price));

      console.log("🧪 RAW:", { uni, sushi, cex });

      if (!dexPrices.length || !isValid(cex)) {
        console.log("⏳ Waiting for valid data...");
        await delay(LOOP_DELAY);
        continue;
      }

      // ===== BEST DEX =====
      const bestDEX = dexPrices.reduce((a, b) =>
        a.price > b.price ? a : b
      );

      const spread = (bestDEX.price - cex) / cex;

      console.log(
        `📊 BEST: ${bestDEX.name} ${bestDEX.price.toFixed(2)} | CEX: ${cex.toFixed(2)} | Spread: ${spread.toFixed(5)}`
      );

      // ===== FILTER BAD DATA =====
      if (Math.abs(spread) > 0.05) {
        console.log("🚫 Ignoring unrealistic spread");
        await delay(LOOP_DELAY);
        continue;
      }

      // ===== TRADE =====
      if (spread > MIN_SPREAD) {
        const tradeSize = 100;
        const gross = tradeSize * spread;
        const net = gross - GAS_COST;

        if (!isValid(net) || net <= 0) {
          console.log("🚫 Not profitable after gas");
          await delay(LOOP_DELAY);
          continue;
        }

        totalPNL += net;
        trades++;

        console.log("🔥 REAL ARB TRADE");
        console.log(`🏦 Route: ${bestDEX.name} → CEX`);
        console.log(`💰 Net Profit: $${net.toFixed(2)}`);
        console.log(`📈 TOTAL PNL: $${totalPNL.toFixed(2)} | Trades: ${trades}`);
      }

    } catch (err) {
      console.log("❌ LOOP ERROR:", err.message);
    }

    await delay(LOOP_DELAY);
  }
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));

runBot();