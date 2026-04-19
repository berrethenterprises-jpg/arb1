import { ethers } from "ethers";
import { TOKENS } from "../config/tokens.js";

const FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

const ABI = [
  "function getPair(address,address) external view returns (address)",
  "function getReserves() external view returns (uint112,uint112,uint32)"
];

// 🔥 batching control
let cursor = 0;
const BATCH_SIZE = 10;

export const getUniswapPools = async (provider) => {
  const factory = new ethers.Contract(FACTORY, ABI, provider);

  const pools = [];
  let count = 0;

  for (let i = cursor; i < TOKENS.length && count < BATCH_SIZE; i++) {
    for (let j = i + 1; j < TOKENS.length && count < BATCH_SIZE; j++) {
      try {
        const t0 = TOKENS[i];
        const t1 = TOKENS[j];

        const pairAddress = await factory.getPair(t0.address, t1.address);

        if (!pairAddress || pairAddress === ethers.constants.AddressZero) continue;

        const pair = new ethers.Contract(pairAddress, ABI, provider);

        const [r0, r1] = await pair.getReserves();

        // 🔥 SAFE parsing
        const reserve0 = parseFloat(
          ethers.utils.formatUnits(r0, t0.decimals)
        );

        const reserve1 = parseFloat(
          ethers.utils.formatUnits(r1, t1.decimals)
        );

        // 🔥 CRITICAL VALIDATION
        if (
          !isFinite(reserve0) ||
          !isFinite(reserve1) ||
          reserve0 <= 0 ||
          reserve1 <= 0
        ) continue;

        // 🔥 prevent insane values
        if (reserve0 > 1e12 || reserve1 > 1e12) continue;

        pools.push({
          dex: "UNI",
          token0: t0.address,
          token1: t1.address,
          reserve0,
          reserve1
        });

        count++;

      } catch {
        // silent fail per pair
      }
    }
  }

  cursor = (cursor + 1) % TOKENS.length;

  console.log(`🦄 UNI pools (batched): ${pools.length}`);

  return pools;
};