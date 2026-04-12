import { ethers } from "ethers";

const provider = new ethers.WebSocketProvider(process.env.RPC_WSS);

export const watchMempool = (callback) => {

    provider.on("pending", async (txHash) => {
        try {
            const tx = await provider.getTransaction(txHash);

            if (!tx || !tx.value) return;

            // 🔥 ROXY FIX: filter only large tx
            if (tx.value < ethers.parseEther("5")) return;

            callback({
                hash: txHash,
                value: tx.value
            });

        } catch {}
    });
};
