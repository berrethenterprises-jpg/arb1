export const createExecutor = async () => {
  console.log("✅ Executor ready (v31.8)");

  return {
    execute: async (opp) => {
      // skip weak trades
      if (!opp || opp.profitUSD < 0.1) {
        return { success: false };
      }

      console.log("⚡ Executing trade (simulated)");

      return {
        success: true,
        profit: opp.profitUSD
      };
    }
  };
};