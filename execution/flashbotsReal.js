import { ethers } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

export const initFlashbots = async (provider, wallet) => {
    return await FlashbotsBundleProvider.create(provider, wallet);
};

export const sendBundle = async ({
    flashbots,
    tx,
    wallet
}) => {

    const signed = await wallet.signTransaction(tx);

    const bundle = [{ signedTransaction: signed }];

    const block = await flashbots.provider.getBlockNumber();

    // 🔥 ROXY FIX: simulate before sending
    const sim = await flashbots.simulate(bundle, block + 1);

    if ("error" in sim) {
        console.log("❌ Simulation failed");
        return null;
    }

    return await flashbots.sendBundle(bundle, block + 1);
};
