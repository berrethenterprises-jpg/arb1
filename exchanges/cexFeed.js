import https from "https";

let price = null;
let lastUpdate = 0;

// ✅ Coinbase price fetch (VERY reliable)
const fetchPrice = () => {
    return new Promise((resolve) => {
        https.get(
            "https://api.exchange.coinbase.com/products/ETH-USD/ticker",
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
        ).on("error", (err) => {
            console.log("❌ Coinbase API error:", err.message);
            resolve(null);
        });
    });
};

export const startFeed = async () => {
    console.log("🚀 Starting Coinbase feed...");

    // 🔥 FORCE FIRST PRICE (critical)
    while (!price) {
        const p = await fetchPrice();

        if (p) {
            price = p;
            lastUpdate = Date.now();
            console.log("✅ FIRST PRICE:", p);
        } else {
            console.log("⏳ Retrying price fetch...");
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    // continuous updates
    setInterval(async () => {
        const p = await fetchPrice();

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