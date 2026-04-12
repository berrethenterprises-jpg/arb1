import https from "https";

const fetch = (url) => {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    resolve(null);
                }
            });
        }).on("error", () => resolve(null));
    });
};

export const getPrices = async (symbol) => {
    const [coinbase, binance] = await Promise.all([
        fetch(`https://api.exchange.coinbase.com/products/${symbol.replace("USDT","-USD")}/ticker`),
        fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`)
    ]);

    const c = coinbase ? parseFloat(coinbase.price) : null;
    const b = binance ? parseFloat(binance.price) : null;

    // 🔥 fallback protection
    if (!c && !b) return null;

    return {
        coinbase: c || b,
        binance: b || c
    };
};