export const findOpportunity = ({ coinbase, binance }) => {
    const spread = (coinbase - binance) / binance;

    return {
        spread,
        direction: spread > 0 ? "BUY_BINANCE_SELL_COINBASE" : "BUY_COINBASE_SELL_BINANCE"
    };
};