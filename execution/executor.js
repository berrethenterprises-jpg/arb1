export const createExecutor = async () => {
  console.log("✅ Executor ready");

  return {
    execute: async (opp) => {
      console.log("⚡ Simulated MEV trade");

      return {
        success: true,
        profit: opp.profitUSD
      };
    }
  };
};