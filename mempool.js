let lastTrigger = 0;
const COOLDOWN = 2500;

export const startMempool = (provider, onTrigger) => {
  provider.removeAllListeners("pending");

  provider.on("pending", async (txHash) => {
    const now = Date.now();

    if (now - lastTrigger < COOLDOWN) return;
    if (!txHash || txHash.length < 66) return;

    lastTrigger = now;

    console.log("⚡ Mempool trigger");

    await onTrigger();
  });

  console.log("✅ Mempool monitoring active (single listener)");
};