import { ethers } from "ethers";

export const createExecutor = async () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("✅ Executor ready (flash-loan capable)");

  return { provider, wallet };
};

export const executeTrade = async ({ amountIn, expectedProfit }) => {
  if (expectedProfit < 2) return;

  console.log("⚡ Simulated FLASH TRADE");
  console.log({
    size: amountIn,
    profit: expectedProfit
  });
};