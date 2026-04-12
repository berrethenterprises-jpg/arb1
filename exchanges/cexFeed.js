import WebSocket from "ws";
import https from "https";

let price = null;
let lastUpdate = 0;
let useWebSocket = true;
let reconnectDelay = 2000;

// REST fallback
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

// WebSocket attempt
const connectWS = () => {
    const ws = new WebSocket(
        "wss://stream.binance.com:9443/ws/ethusdt@bookTicker"
    );

    ws.on("open", () => {
        console.log("✅ WebSocket connected");
        useWebSocket = true;
        reconnectDelay = 2000;
    });

    ws.on("message", (data) => {
        try {
            const msg = JSON.parse(data);
            price = (parseFloat(msg.b) + parseFloat(msg.a)) / 2;
            lastUpdate = Date.now();
        } catch {}
    });

    ws.on("close", () => {
        console.log("⚠️ WS closed → switching to REST");
        useWebSocket = false;
        reconnectWS();
    });

    ws.on("error", () => {
        console.log("❌ WS blocked → using REST fallback");
        useWebSocket = false;
    });
};

const reconnectWS = () => {
    setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 1.5, 15000);
        connectWS();
    }, reconnectDelay);
};

// Start system
export const startFeed = () => {
    connectWS();

    setInterval(async () => {
        if (!useWebSocket) {
            const p = await fetchREST();
            if (p) {
                price = p;
                lastUpdate = Date.now();
                console.log("🔁 REST price:", p);
            }
        }
    }, 1000);
};

// Unified getter
export const getLivePrice = () => {
    if (!price) return null;

    return {
        price,
        latency: Date.now() - lastUpdate
    };
};