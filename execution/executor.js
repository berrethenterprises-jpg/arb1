export const createExecutor = async () => {
  console.log("✅ Executor ready (safe)");

  return {
    execute: async (opp) => {
      console.log("⚡ Simulated trade");

      return {
        success: true,
        profit: opp.profitUSD || 0
      };
    }
  };
};