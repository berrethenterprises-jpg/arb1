import "dotenv/config";
import fetch from "node-fetch";
import { ethers } from "ethers";
import { getUniswapPrice } from "./dex/uniswap.js";

// ================= CONFIG =================
const RPC_URL = process.env.RPC_URL;
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

const LOOP_DELAY = 1500; // ms
const MIN_SPREAD = 0.002; // 0.2% realistic threshold

let totalPNL = 0;
let trades = 0;

// ================= CEX PRICE =================
const getCEXPrice = async () => {
  try {
    const res = await fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot");
    const json = await res.json();

    const price = parseFloat(json?.data?.amount);

    if (!price || isNaN(price)) return null;

    return price;
  } catch {
    return null;
  }
};

// ================= SAFE NUMBER =================
const isValid = (n) => typeof n === "number" && !isNaN(n) && isFinite(n);

// ================= MAIN LOOP =================
const runBot = async () => {
  console.log("🚀 ARB1 MULTI-POOL ENGINE STARTED");

  while (true) {
    try {
      // ===== FETCH PRICES =====
      const [dexPrice, cexPrice] = await Promise.all([
        getUniswapPrice(provider),
        getCEXPrice()
      ]);

      console.log("🧪 RAW:", { dexPrice, cexPrice });

      // ===== VALIDATION =====
      if (!isValid(dexPrice) || !isValid(cexPrice)) {
        console.log("⏳ Waiting for valid price data...");
        await delay(LOOP_DELAY);
        continue;
      }

      // ===== SPREAD =====
      const spread = (dexPrice - cexPrice) / cexPrice;

      console.log(
        `📊 BEST DEX: ${dexPrice.toFixed(2)} | CEX: ${cexPrice.toFixed(2)} | Spread: ${spread.toFixed(5)}`
      );

      // ===== FILTER BAD DATA =====
      if (Math.abs(spread) > 0.05) {
        console.log("🚫 Ignoring unrealistic spread");
        await delay(LOOP_DELAY);
        continue;
      }

      // ===== TRADE CONDITION =====
      if (spread > MIN_SPREAD) {
        const tradeSize = 100; // simulated size
        const profit = tradeSize * spread;

        if (!isValid(profit)) {
          console.log("❌ Invalid profit calc");
          await delay(LOOP_DELAY);
          continue;
        }

        totalPNL += profit;
        trades++;

        console.log("🔥 ARB OPPORTUNITY FOUND");
        console.log(`💰 Profit: $${profit.toFixed(2)}`);
        console.log(`📈 TOTAL PNL: $${totalPNL.toFixed(2)} | Trades: ${trades}`);
      }

    } catch (err) {
      console.log("❌ LOOP ERROR:", err.message);
    }

    await delay(LOOP_DELAY);
  }
};

// ================= DELAY =================
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ================= START =================
runBot();