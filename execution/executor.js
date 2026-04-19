import { ethers } from "ethers";

export const createExecutor = async (provider) => {
  console.log("⚡ Initializing Executor...");

  if (!process.env.PRIVATE_KEY) {
    throw new Error("❌ Missing PRIVATE_KEY");
  }

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("✅ Executor ready (REALISTIC SIMULATION)");

  const ETH_PRICE = 3000;
  const GAS_LIMIT = 220000;

  return {
    execute: async (opp) => {
      try {
        if (!opp) return;

        const feeData = await provider.getFeeData();

        const maxFeePerGas =
          feeData.maxFeePerGas || feeData.gasPrice;

        if (!maxFeePerGas) {
          console.log("⚠️ No gas data");
          return;
        }

        const gasPriceETH = Number(maxFeePerGas) / 1e18;

        const gasCostETH = gasPriceETH * GAS_LIMIT;
        const gasCostUSD = gasCostETH * ETH_PRICE;

        const profitUSD = opp.profitETH * ETH_PRICE;
        const net = profitUSD - gasCostUSD;

        if (net <= 0) {
          console.log("⛔ Not profitable after gas");
          return;
        }

        console.log("✅ REALISTIC TRADE PASSED");
        console.log({
          route: opp.route,
          gross: profitUSD.toFixed(2),
          gas: gasCostUSD.toFixed(2),
          net: net.toFixed(2)
        });

        return {
          success: true,
          profit: net
        };

      } catch (e) {
        console.log("❌ Executor error:", e.message);
      }
    }
  };
};