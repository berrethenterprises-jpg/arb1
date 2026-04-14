import { ethers } from "ethers";

const PAIR = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)"
];

export const getUniswapData = async (provider) => {
  try {
    const c = new ethers.Contract(PAIR, ABI, provider);
    const [r0, r1] = await c.getReserves();

    const reserveUSDC = parseFloat(ethers.utils.formatUnits(r0, 6));
    const reserveETH = parseFloat(ethers.utils.formatUnits(r1, 18));

    const price = reserveETH ? reserveUSDC / reserveETH : null;

    return {
      price,
      reserveUSDC,
      reserveETH
    };

  } catch {
    return null;
  }
};