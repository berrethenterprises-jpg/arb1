export const startMempool = (provider, onTrigger) => {
  try {
    provider.on("pending", async (txHash) => {
      if (!txHash) return;

      // lightweight trigger (no heavy RPC calls)
      if (Math.random() < 0.05) {
        await onTrigger();
      }
    });

    console.log("✅ Mempool monitoring active");

  } catch (err) {
    console.log("❌ Mempool error:", err.message);
  }
};