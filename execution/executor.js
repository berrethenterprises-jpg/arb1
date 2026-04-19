import { ethers } from "ethers";

export const createExecutor = async (provider) => {
  console.log("✅ Executor ready (safe)");

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const SAFE_MODE = true;
  const MIN_PROFIT = 5;

  return {
    execute: async (opp) => {
      if (!opp || opp.profitUSD < MIN_PROFIT) {
        console.log("⏳ Skipping low profit");
        return;
      }

      const gasCost = 3;
      const net = opp.profitUSD - gasCost;

      if (net <= 0) {
        console.log("❌ Not profitable after gas");
        return;
      }

      if (SAFE_MODE) {
        console.log("🧪 SAFE MODE execution");
        return {
          success: true,
          profit: net
        };
      }

      // REAL EXECUTION (disabled)
      /*
      const tx = await wallet.sendTransaction({
        to: wallet.address,
        value: 0
      });

      await tx.wait();
      */

      return {
        success: true,
        profit: net
      };
    }
  };
};