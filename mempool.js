let lastTrigger = 0;
const COOLDOWN = 2000; // 2 seconds

export const startMempool = (provider, onTrigger) => {
  try {
    provider.on("pending", async (txHash) => {
      const now = Date.now();

      // ⛔ throttle
      if (now - lastTrigger < COOLDOWN) return;

      // 🎯 lightweight filtering
      if (!txHash || txHash.length < 10) return;

      lastTrigger = now;

      console.log("⚡ Mempool trigger (filtered)");

      try {
        await onTrigger();
      } catch {}
    });

    console.log("✅ Mempool monitoring active (throttled)");

  } catch (err) {
    console.log("❌ Mempool error:", err.message);
  }
};