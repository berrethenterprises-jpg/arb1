import { ethers } from "ethers";
import axios from "axios";

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

const FALLBACK = [
  "0x397FF1542f962076d0BFE58eA045FfA2d347ACa0",
  "0x06da0fd433C1A5d7a4faa01111c044910A184553"
];

const DECIMALS = {
  "0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2": 18,
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 6,
  "0xdac17f958d2ee523a2206206994597c13d831ec7": 6,
  "0x6b175474e89094c44da98b954eedeac495271d0f": 18
};

const fetchGraph = async () => {
  try {
    const res = await axios.post(
      "https://api.thegraph.com/subgraphs/name/sushiswap/exchange",
      {
        query: `
        {
          pairs(first: 20, orderBy: reserveUSD, orderDirection: desc) {
            id
          }
        }`
      }
    );

    return res.data.data.pairs.map(p => p.id);

  } catch {
    console.log("❌ Graph failed → using fallback (SUSHI)");
    return null;
  }
};

export const getSushiPools = async (provider) => {
  const graph = await fetchGraph();
  const addresses = graph && graph.length ? graph : FALLBACK;

  const results = [];

  for (const address of addresses) {
    try {
      const c = new ethers.Contract(address, ABI, provider);

      const [r0, r1] = await c.getReserves();
      const token0 = (await c.token0()).toLowerCase();
      const token1 = (await c.token1()).toLowerCase();

      const d0 = DECIMALS[token0] || 18;
      const d1 = DECIMALS[token1] || 18;

      results.push({
        dex: "SUSHI",
        token0,
        token1,
        reserve0: Number(ethers.utils.formatUnits(r0, d0)),
        reserve1: Number(ethers.utils.formatUnits(r1, d1))
      });

    } catch (err) {
      console.log("❌ SUSHI pool failed:", address);
    }
  }

  return results;
};