import { ethers } from "ethers";

export const createExecutor = async (provider) => {
  console.log("⚡ Executor (Arbitrum)");

  const ETH_PRICE = 3000;
  const GAS_LIMIT = 200000;

  return {
    execute: async (opp) => {
      if (!opp) return;

      const fee = await provider.getGasPrice();
      const gasCostETH = (Number(fee) / 1e18) * GAS_LIMIT;
      const gasCostUSD = gasCostETH * ETH_PRICE;

      const profitUSD = opp.profitETH * ETH_PRICE;
      const net = profitUSD - gasCostUSD;

      if (net <= 0) {
        console.log("⛔ Not profitable");
        return;
      }

      console.log("✅ TRADE");
      console.log({
        route: opp.route,
        gross: profitUSD.toFixed(2),
        gas: gasCostUSD.toFixed(2),
        net: net.toFixed(2)
      });

      return { success: true, profit: net };
    }
  };
};