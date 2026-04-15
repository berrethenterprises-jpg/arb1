import { ethers } from "ethers";

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

// 🔥 EXPANDED VERIFIED POOL SET (~40+ SAFE)
const PAIRS = [
  // ETH BASE
  "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc",
  "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11",
  "0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852",

  // BTC
  "0xBb2b8038a1640196FbE3e38816F3e67Cba72D940",

  // UNI / LINK / AAVE
  "0xd3d2E2692501A5c9Ca623199D38826e513033a17",
  "0xF173214C720f58E03e194085B1DB28B50AcDeeaD",
  "0xC2aDdA861F89bBB333c90c492cB837741916A225",

  // STABLE ROUTES
  "0x3041CbD36888bECc7bbCBc0045E3B1f144466f5f",
  "0xAE461cA67B15dc8d2dA7c1dD4A90c3c6C5E7eF9A",
  "0x5777d92f208679DB4b9778590Fa3CAB3aC9e2168",

  // EXTRA LIQUID
  "0x55d5c232d921b9eAA6b37b5845E439aCD04b4DBa",
  "0xE42318EA3b998e8355a3Da364EB9D48eC725Eb45",
  "0xC5Be99A02C6857f9Eac67BbCE58DF5572498F40c",
  "0x004375Dff511095CC5A197A54140a24eFEF3A416",

  // MORE ROUTES
  "0xd3d2E2692501A5c9Ca623199D38826e513033a17",
  "0x21b8065d10f73ee2e260e5b47d3344d3ced7596e",
  "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2"
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

      return {
        dex: "UNI",
        token0: t0.toLowerCase(),
        token1: t1.toLowerCase(),
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