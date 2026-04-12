import ccxt from "ccxt";

const exchange = new ccxt.binance({
    apiKey: process.env.BINANCE_KEY,
    secret: process.env.BINANCE_SECRET,
    enableRateLimit: true
});

export const getBinancePrice = async (symbol) => {
    const ticker = await exchange.fetchTicker(symbol);
    return ticker.last;
};

export const marketBuy = async (symbol, amount) => {
    return await exchange.createMarketBuyOrder(symbol, amount);
};

export const marketSell = async (symbol, amount) => {
    return await exchange.createMarketSellOrder(symbol, amount);
};