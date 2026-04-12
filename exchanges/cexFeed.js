import https from "https";

let price = null;
let lastUpdate = 0;

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
                        const p = parseFloat(json.price);
                        resolve(p);
                    } catch {
                        resolve(null);
                    }
                });
            }
        ).on("error", (err) => {
            console.log("❌ REST error:", err.message);
            resolve(null);
        });
    });
};

export const startFeed = async () => {
    console.log("🚀 Starting REST feed...");

    // 🔥 immediate fetch (CRITICAL)
    const first = await fetchREST();
    if (first) {
        price = first;
        lastUpdate = Date.now();
        console.log("✅ FIRST PRICE:", first);
    } else {
        console.log("❌ Initial price fetch failed");
    }

    // loop
    setInterval(async () => {
        const p = await fetchREST();

        if (p) {
            price = p;
            lastUpdate = Date.now();
            console.log("🔁 PRICE:", p);
        }
    }, 1000);
};

export const getLivePrice = () => {
    if (!price) return null;

    return {
        price,
        latency: Date.now() - lastUpdate
    };
};