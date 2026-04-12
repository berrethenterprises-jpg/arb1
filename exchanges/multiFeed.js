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

export const getPrices = async () => {
    const coinbase = await fetch("https://api.exchange.coinbase.com/products/ETH-USD/ticker");
    const binance = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT");

    return {
        coinbase: coinbase ? parseFloat(coinbase.price) : null,
        binance: binance ? parseFloat(binance.price) : null
    };
};