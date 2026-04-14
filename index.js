import "dotenv/config";
import fetch from "node-fetch";
import { ethers } from "ethers";

import { getUniswapData } from "./dex/uniswap.js";
import { getSushiData } from "./dex/sushiswap.js";
import { getAmountOut } from "./utils/poolMath.js";
import { createExecutor, executeTrade } from "./execution/executor.js";

// ================= CONFIG =================
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

const LOOP_DELAY = 2000;
const GAS_COST = 0.5;
const TRADE_SIZE_ETH = 0.01;

let totalPNL = 0;
let trades = 0;

// ================= INIT =================
const executor = await createExecutor();

// ================= HELPERS =================
const delay = (ms) => new Promise(res => setTimeout(res, ms));

const isValid = (n) => typeof n === "number" && isFinite(n);

// ================= CEX PRICE =================
const getCEXPrice = async () => {
  try {
    const res = await fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot");
    const json = await res.json();

    const price = parseFloat(json?.data?.amount);
    return isValid(price) ? price : null;

  } catch {
    return null;
  }
};

// ================= MAIN ENGINE =================
const runBot = async () => {
  console.log("🚀 ARB1 v25 SLIPPAGE ENGINE STARTED");

  while (true) {
    try {
      const [uni, sushi, cex] = await Promise.all([
        getUniswapData(provider),
        getSushiData(provider),
        getCEXPrice()
      ]);

      console.log("🧪 RAW:", { uni, sushi, cex });

      // ================= VALIDATION =================
      if (!uni || !sushi || !isValid(cex)) {
        console.log("⏳ Waiting for valid data...");
        await delay(LOOP_DELAY);
        continue;
      }

      const pools = [
        { name: "UNI", ...uni },
        { name: "SUSHI", ...sushi }
      ];

      for (const pool of pools) {
        if (
          !isValid(pool.reserveETH) ||
          !isValid(pool.reserveUSDC)
        ) continue;

        // ================= REAL SWAP SIMULATION =================
        const amountOut = getAmountOut(
          TRADE_SIZE_ETH,
          pool.reserveETH,
          pool.reserveUSDC
        );

        const expectedUSD = amountOut;
        const costUSD = TRADE_SIZE_ETH * cex;

        const profit = expectedUSD - costUSD - GAS_COST;

        console.log(
          `🧠 ${pool.name} Sim | Out: $${expectedUSD.toFixed(2)} | Profit: $${profit.toFixed(2)}`
        );

        // ================= FILTER BAD / FAKE =================
        if (!isValid(profit) || profit < 2) {
          continue;
        }

        // 🚫 Catch insane bugs
        if (profit > 1000) {
          console.log("🚫 Ignoring unrealistic profit");
          continue;
        }

        console.log("🔥 REAL ARB OPPORTUNITY");
        console.log(`💰 Profit: $${profit.toFixed(2)}`);

        // ================= EXECUTE =================
        await executeTrade({
          executor,
          amountIn: TRADE_SIZE_ETH,
          expectedProfit: profit,
          minOut: expectedUSD * 0.995 // 0.5% slippage protection
        });

        totalPNL += profit;
        trades++;

        console.log(
          `📈 TOTAL PNL: $${totalPNL.toFixed(2)} | Trades: ${trades}`
        );
      }

    } catch (err) {
      console.log("❌ ENGINE ERROR:", err.message);
    }

    await delay(LOOP_DELAY);
  }
};

// ================= START =================
runBot();