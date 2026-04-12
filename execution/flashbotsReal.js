import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

export const initFlashbots = async (provider, wallet) => {
    try {
        const fb = await FlashbotsBundleProvider.create(provider, wallet);
        return fb;
    } catch (e) {
        console.log("⚠️ Flashbots init failed:", e.message);
        return null;
    }
};

export const sendBundle = async ({ flashbots, tx, wallet }) => {
    try {
        if (!flashbots) return null;

        const signed = await wallet.signTransaction(tx);

        const bundle = [{ signedTransaction: signed }];

        const block = await flashbots.provider.getBlockNumber();

        const sim = await flashbots.simulate(bundle, block + 1);

        if ("error" in sim) {
            console.log("❌ Flashbots simulation failed");
            return null;
        }

        return await flashbots.sendBundle(bundle, block + 1);

    } catch (e) {
        console.log("❌ Flashbots error:", e.message);
        return null;
    }
};