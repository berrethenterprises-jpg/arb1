import { ethers } from "ethers";
import { sendPrivateTx } from "./privateTx.js";

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);

export const executeArb = async (contract, params) => {

    const tx = await contract.populateTransaction.executeFlashLoan(
        params.asset,
        params.amount,
        params.data
    );

    return await sendPrivateTx(wallet, tx);
};