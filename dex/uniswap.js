import { ethers } from "ethers";

const FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

const FACTORY_ABI = [
  "function allPairs(uint) view returns (address)"
];

const PAIR_ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

// 🔥 PRE-SELECTED HIGH INDEX RANGE (avoids allPairsLength)
const START_INDEX = 300000; // high activity zone
const BATCH_SIZE = 40;

export const getUniswapPools = async (provider) => {
  const factory = new ethers.Contract(FACTORY, FACTORY_ABI, provider);

  const out = [];

  for (let i = START_INDEX; i < START_INDEX + BATCH_SIZE; i++) {
    try {
      const addr = await factory.allPairs(i);

      const pair = new ethers.Contract(addr, PAIR_ABI, provider);

      const [r0, r1] = await pair.getReserves();

      if (r0.isZero() || r1.isZero()) continue;

      const t0 = (await pair.token0()).toLowerCase();
      const t1 = (await pair.token1()).toLowerCase();

      out.push({
        dex: "UNI",
        token0: t0,
        token1: t1,
        reserve0: Number(ethers.utils.formatEther(r0)),
        reserve1: Number(ethers.utils.formatEther(r1))
      });

    } catch {}
  }

  console.log(`🦄 UNI pools loaded: ${out.length}`);

  return out;
};