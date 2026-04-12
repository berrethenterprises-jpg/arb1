export const findTriangular = (prices) => {

    const { ETH_USDC, USDC_DAI, ETH_DAI } = prices;

    if (!ETH_USDC || !USDC_DAI || !ETH_DAI) return null;

    const cycle =
        (1 / ETH_USDC) *
        (1 / USDC_DAI) *
        ETH_DAI;

    return {
        profitRatio: cycle
    };
};
