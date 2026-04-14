let lastTrigger = 0;
const COOLDOWN = 2500; // slightly slower = more stable

export const startMempool = (provider, onTrigger) => {
  try {
    // 🔥 CRITICAL: remove ALL previous listeners
    provider.removeAllListeners("pending");

    provider.on("pending", async (txHash) => {
      const now = Date.now();

      // ⛔ cooldown protection
      if (now - lastTrigger < COOLDOWN) return;

      // ⛔ basic validation
      if (!txHash || txHash.length < 66) return;

      lastTrigger = now;

      console.log("⚡ Mempool trigger");

      try {
        await onTrigger();
      } catch (err) {
        console.log("❌ Trigger error:", err.message);
      }
    });

    console.log("✅ Mempool monitoring active (single listener)");

  } catch (err) {
    console.log("❌ Mempool error:", err.message);
  }
};