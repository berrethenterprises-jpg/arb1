import "dotenv/config";
import fetch from "node-fetch";
import { ethers } from "ethers";

import { getUniswapData } from "./dex/uniswap.js";
import { getSushiData } from "./dex/sushiswap.js";
import { getAmountOut, getAmountOutReverse } from "./utils/poolMath.js";
import { createExecutor, executeTrade } from "./execution/executor.js";

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

const LOOP_DELAY = 2000;
const GAS_COST = 0.5;
const TRADE_SIZE_ETH = 0.01;

let totalPNL = 0;
let trades = 0;

const executor = await createExecutor();

const delay = (ms) => new Promise(res => setTimeout(res, ms));
const isValid = (n) => typeof n === "number" && isFinite(n);

// ================= MAIN =================
const runBot = async () => {
  console.log("🚀 ARB1 v26 MULTI-HOP ENGINE");

  while (true) {
    try {
      const [uni, sushi] = await Promise.all([
        getUniswapData(provider),
        getSushiData(provider)
      ]);

      console.log("🧪 RAW:", { uni, sushi });

      if (!uni || !sushi) {
        console.log("⏳ Waiting for data...");
        await delay(LOOP_DELAY);
        continue;
      }

      // ================= PATH 1 =================
      // UNI → SUSHI
      const usdcOut1 = getAmountOut(
        TRADE_SIZE_ETH,
        uni.reserveETH,
        uni.reserveUSDC
      );

      const ethBack1 = getAmountOutReverse(
        usdcOut1,
        sushi.reserveUSDC,
        sushi.reserveETH
      );

      const profit1 = ethBack1 - TRADE_SIZE_ETH;

      console.log(
        `🧠 UNI→SUSHI | End ETH: ${ethBack1.toFixed(6)} | Profit: ${profit1.toFixed(6)}`
      );

      // ================= PATH 2 =================
      // SUSHI → UNI
      const usdcOut2 = getAmountOut(
        TRADE_SIZE_ETH,
        sushi.reserveETH,
        sushi.reserveUSDC
      );

      const ethBack2 = getAmountOutReverse(
        usdcOut2,
        uni.reserveUSDC,
        uni.reserveETH
      );

      const profit2 = ethBack2 - TRADE_SIZE_ETH;

      console.log(
        `🧠 SUSHI→UNI | End ETH: ${ethBack2.toFixed(6)} | Profit: ${profit2.toFixed(6)}`
      );

      // ================= PICK BEST =================
      const best = Math.max(profit1, profit2);

      if (!isValid(best) || best <= 0.0005) {
        continue;
      }

      console.log("🔥 MULTI-HOP ARB FOUND");

      await executeTrade({
        executor,
        amountIn: TRADE_SIZE_ETH,
        expectedProfit: best * 2000, // rough USD conversion
        minOut: TRADE_SIZE_ETH * (1 + best * 0.995)
      });

      totalPNL += best * 2000;
      trades++;

      console.log(`📈 TOTAL PNL: $${totalPNL.toFixed(2)} | Trades: ${trades}`);

    } catch (err) {
      console.log("❌ ERROR:", err.message);
    }

    await delay(LOOP_DELAY);
  }
};

runBot();