export const findOpportunity = (prices) => {
    const { coinbase, binance } = prices;

    if (!coinbase || !binance) return null;

    const spread = (coinbase - binance) / binance;

    return {
        spread,
        buy: spread > 0 ? "binance" : "coinbase",
        sell: spread > 0 ? "coinbase" : "binance"
    };
};