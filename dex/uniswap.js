import { ethers } from "ethers";

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

// 🔥 CORE TOKENS ONLY (HIGH CONNECTIVITY)
const CORE = [
  "0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
  "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
  "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"  // WBTC
];

// 🔥 VERIFIED PAIRS (CONNECTED GRAPH)
const PAIRS = [
  // WETH routes
  "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc",
  "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11",
  "0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852",
  "0xBb2b8038a1640196FbE3e38816F3e67Cba72D940",

  // STABLE INTERCONNECT
  "0x3041CbD36888bECc7bbCBc0045E3B1f144466f5f",
  "0xAE461cA67B15dc8d2dA7c1dD4A90c3c6C5E7eF9A",

  // BTC/STABLE
  "0x004375Dff511095CC5A197A54140a24eFEF3A416"
];

export const getUniswapPools = async (provider) => {
  const calls = PAIRS.map(async (addr) => {
    try {
      const c = new ethers.Contract(addr, ABI, provider);

      const [reserves, t0, t1] = await Promise.all([
        c.getReserves(),
        c.token0(),
        c.token1()
      ]);

      const token0 = t0.toLowerCase();
      const token1 = t1.toLowerCase();

      // 🔥 ONLY KEEP CORE CONNECTED POOLS
      if (!CORE.includes(token0) && !CORE.includes(token1)) {
        return null;
      }

      return {
        dex: "UNI",
        token0,
        token1,
        reserve0: Number(ethers.utils.formatEther(reserves[0])),
        reserve1: Number(ethers.utils.formatEther(reserves[1]))
      };

    } catch {
      return null;
    }
  });

  const result = (await Promise.all(calls)).filter(Boolean);

  console.log(`🦄 UNI pools: ${result.length}`);

  return result;
};