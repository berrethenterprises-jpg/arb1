import { ethers } from "ethers";

export const createExecutor = async (provider) => {
  console.log("⚡ Initializing Executor...");

  if (!process.env.PRIVATE_KEY) {
    throw new Error("Missing PRIVATE_KEY");
  }

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("✅ Executor ready (REALISTIC SIM)");

  const ETH_PRICE = 3000;

  return {
    execute: async (opp) => {
      try {
        if (!opp) return;

        // 🔥 get real gas price
        const feeData = await provider.getFeeData();

        const gasPrice =
          feeData.maxFeePerGas || feeData.gasPrice;

        if (!gasPrice) return;

        const gasUsed = 220000;

        const gasCostETH =
          (Number(gasPrice) / 1e18) * gasUsed;

        const gasCostUSD = gasCostETH * ETH_PRICE;

        const profitUSD = opp.profitETH * ETH_PRICE;
        const net = profitUSD - gasCostUSD;

        if (net <= 0) {
          console.log("⛔ Not profitable after gas");
          return;
        }

        console.log("✅ REALISTIC TRADE PASSED");
        console.log({
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