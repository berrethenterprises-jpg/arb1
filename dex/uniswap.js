import { ethers } from "ethers";

const PAIRS = [
  "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc"
];

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)"
];

export const getUniswapPools = async (provider) => {
  const results = [];

  for (const address of PAIRS) {
    try {
      const c = new ethers.Contract(address, ABI, provider);
      const [r0, r1] = await c.getReserves();

      results.push({
        dex: "UNI",
        reserveUSDC: parseFloat(ethers.utils.formatUnits(r0, 6)),
        reserveETH: parseFloat(ethers.utils.formatUnits(r1, 18))
      });

    } catch {}
  }

  return results;
};