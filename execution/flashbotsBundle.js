import { ethers } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

export const createFlashbotsProvider = async (provider, wallet) => {
    return await FlashbotsBundleProvider.create(
        provider,
        wallet
    );
};

export const sendFlashbotsBundle = async ({
    flashbots,
    wallet,
    tx
}) => {

    const signed = await wallet.signTransaction(tx);

    const bundle = [
        {
            signedTransaction: signed
        }
    ];

    const block = await flashbots.provider.getBlockNumber();

    return await flashbots.sendBundle(bundle, block + 1);
};
