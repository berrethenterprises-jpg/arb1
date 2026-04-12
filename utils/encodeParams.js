import { ethers } from "ethers";

export const encodeFlashParams = (router, swapData) => {
    return ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "bytes"],
        [router, swapData]
    );
};
