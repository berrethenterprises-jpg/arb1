import { ethers } from "ethers";

const PAIR = "0x397FF1542f962076d0BFE58eA045FfA2d347ACa0";

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)"
];

export const getSushiData = async (provider) => {
  try {
    const c = new ethers.Contract(PAIR, ABI, provider);
    const [r0, r1] = await c.getReserves();

    const reserveUSDC = parseFloat(ethers.utils.formatUnits(r0, 6));
    const reserveETH = parseFloat(ethers.utils.formatUnits(r1, 18));

    return {
      price: reserveUSDC / reserveETH,
      reserveUSDC,
      reserveETH
    };

  } catch {
    return null;
  }
};