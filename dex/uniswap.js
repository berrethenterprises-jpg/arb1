import { ethers } from "ethers";

const FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

const FACTORY_ABI = [
  "function allPairsLength() view returns (uint)",
  "function allPairs(uint) view returns (address)"
];

const PAIR_ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

// 🔥 LIMIT (prevents overload)
const MAX_PAIRS = 120;

export const getUniswapPools = async (provider) => {
  const factory = new ethers.Contract(FACTORY, FACTORY_ABI, provider);

  const total = await factory.allPairsLength();

  const out = [];

  // 🔥 scan LAST pairs (most active/liquid)
  const start = total - MAX_PAIRS;

  for (let i = start; i < total; i++) {
    try {
      const addr = await factory.allPairs(i);

      const pair = new ethers.Contract(addr, PAIR_ABI, provider);

      const [r0, r1] = await pair.getReserves();
      const t0 = (await pair.token0()).toLowerCase();
      const t1 = (await pair.token1()).toLowerCase();

      // 🔥 filter tiny pools
      if (Number(r0) < 1e6 || Number(r1) < 1e6) continue;

      out.push({
        dex: "UNI",
        token0: t0,
        token1: t1,
        reserve0: Number(ethers.utils.formatEther(r0)),
        reserve1: Number(ethers.utils.formatEther(r1))
      });

    } catch {}
  }

  return out;
};