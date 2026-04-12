import https from "https";

let price = null;
let lastUpdate = 0;

// REST fetch (primary source now)
const fetchREST = () => {
    return new Promise((resolve) => {
        https.get(
            "https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT",
            (res) => {
                let data = "";

                res.on("data", chunk => data += chunk);
                res.on("end", () => {
                    try {
                        const json = JSON.parse(data);
                        resolve(parseFloat(json.price));
                    } catch {
                        resolve(null);
                    }
                });
            }
        ).on("error", () => resolve(null));
    });
};

// Start feed (REST only — stable)
export const startFeed = () => {
    setInterval(async () => {
        const p = await fetchREST();

        if (p) {
            price = p;
            lastUpdate = Date.now();

            console.log("🔁 PRICE:", p);
        }
    }, 1000);
};

// Getter
export const getLivePrice = () => {
    if (!price) return null;

    return {
        price,
        latency: Date.now() - lastUpdate
    };
};