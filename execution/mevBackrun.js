import { ethers } from "ethers";

const SWAP_SIG = "0x414bf389"; // swapExactTokensForTokens

export const detectBackrun = (tx) => {

    if (!tx || !tx.data) return false;

    // 🔥 ROXY FIX: only look at swap calls
    if (!tx.data.startsWith(SWAP_SIG)) return false;

    // 🔥 filter large tx only
    if (!tx.value || tx.value < ethers.parseEther("3")) return false;

    return true;
};
