import { ethers } from "ethers";

const PAIRS = [
  "0x397FF1542f962076d0BFE58eA045FfA2d347ACa0"
];

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)"
];

export const getSushiPools = async (provider) => {
  const results = [];

  for (const address of PAIRS) {
    try {
      const c = new ethers.Contract(address, ABI, provider);
      const [r0, r1] = await c.getReserves();

      results.push({
        dex: "SUSHI",
        reserveUSDC: parseFloat(ethers.utils.formatUnits(r0, 6)),
        reserveETH: parseFloat(ethers.utils.formatUnits(r1, 18))
      });

    } catch {}
  }

  return results;
};