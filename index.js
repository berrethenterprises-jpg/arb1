import "dotenv/config";
import fetch from "node-fetch";
import { ethers } from "ethers";
import { getUniswapPrice } from "./dex/uniswap.js";
import { getSushiPrice } from "./dex/sushiswap.js";
import { createExecutor, executeTrade } from "./execution/executor.js";

// ================= CONFIG =================
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

const LOOP_DELAY = 2000;
const MIN_SPREAD = 0.002;
const GAS_COST = 0.50;

let totalPNL = 0;
let trades = 0;

const executor = await createExecutor();

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

// ================= VALID =================
const isValid = (n) => typeof n === "number" && isFinite(n);

// ================= MAIN =================
const runBot = async () => {
  console.log("🚀 ARB1 v24 SAFE EXECUTION ENGINE");

  while (true) {
    try {
      const [uni, sushi, cex] = await Promise.all([
        getUniswapPrice(provider),
        getSushiPrice(provider),
        getCEXPrice()
      ]);

      console.log("🧪 RAW:", { uni, sushi, cex });

      if (!isValid(cex)) {
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

      const best = dexPrices.reduce((a, b) =>
        a.price > b.price ? a : b
      );

      const spread = (best.price - cex) / cex;

      console.log(
        `📊 ${best.name}: ${best.price.toFixed(2)} | CEX: ${cex.toFixed(2)} | Spread: ${spread.toFixed(5)}`
      );

      // 🚫 FILTER BAD DATA
      if (Math.abs(spread) > 0.05) {
        console.log("🚫 Ignoring unrealistic spread");
        continue;
      }

      // ================= SAFE TRADE =================
      if (spread > MIN_SPREAD) {
        const tradeSize = 100;
        const profit = tradeSize * spread - GAS_COST;

        if (profit < 2) {
          console.log("🚫 Below safe profit threshold");
          continue;
        }

        console.log("🔥 SAFE TRADE SIGNAL");
        console.log(`💰 Profit: $${profit.toFixed(2)}`);

        await executeTrade({
          executor,
          amountIn: 0.01, // small safe size
          expectedProfit: profit
        });

        totalPNL += profit;
        trades++;

        console.log(`📈 TOTAL PNL: $${totalPNL.toFixed(2)} | Trades: ${trades}`);
      }

    } catch (err) {
      console.log("❌ ERROR:", err.message);
    }

    await delay(LOOP_DELAY);
  }
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));

runBot();