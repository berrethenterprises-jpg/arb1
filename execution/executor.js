import { ethers } from "ethers";

export const createExecutor = async (provider) => {
  console.log("⚡ Initializing Executor...");

  if (!process.env.PRIVATE_KEY) {
    throw new Error("❌ Missing PRIVATE_KEY");
  }

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("✅ Executor ready (SAFE SIMULATION)");

  const GAS_PRICE_GWEI = 30;
  const ETH_PRICE = 3000;

  return {
    execute: async (opp) => {
      try {
        if (!opp || opp.profitUSD < 5) return;

        console.log("⚡ Simulating execution (local)...");

        // 🔥 simulate realistic gas
        const gasUsed = 220000;

        const gasCost =
          gasUsed *
          (GAS_PRICE_GWEI * 1e-9) *
          ETH_PRICE;

        const net = opp.profitUSD - gasCost;

        if (net <= 0) {
          console.log("⛔ Not profitable after gas");
          return;
        }

        console.log("✅ EXECUTION SIM SUCCESS");
        console.log({
          gross: opp.profitUSD.toFixed(2),
          gas: gasCost.toFixed(2),
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