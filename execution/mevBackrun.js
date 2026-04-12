import { ethers } from "ethers";

const SWAP_SIG = "0x414bf389";

export const detectBackrun = (tx) => {
    if (!tx || !tx.data) return false;

    if (!tx.data.startsWith(SWAP_SIG)) return false;

    if (!tx.value || tx.value < ethers.parseEther("3")) return false;

    return true;
};