import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

export const sendBundle = async (wallet, tx) => {

    const signedTx = await wallet.signTransaction(tx);

    // ⚠️ Placeholder (Flashbots SDK needed for full prod)
    return await provider.send("eth_sendRawTransaction", [signedTx]);
};
