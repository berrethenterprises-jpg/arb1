import WebSocket from "ws";
import https from "https";

let price = null;
let lastUpdate = 0;

let useWebSocket = true;
let wsDisabledUntil = 0;

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

// WebSocket connect (ONE ATTEMPT ONLY)
const connectWS = () => {
    if (Date.now() < wsDisabledUntil) return;

    const ws = new WebSocket(
        "wss://stream.binance.com:9443/ws/ethusdt@bookTicker"
    );

    let opened = false;

    ws.on("open", () => {
        console.log("✅ WebSocket connected");
        opened = true;
        useWebSocket = true;
    });

    ws.on("message", (data) => {
        try {
            const msg = JSON.parse(data);
            price = (parseFloat(msg.b) + parseFloat(msg.a)) / 2;
            lastUpdate = Date.now();
        } catch {}
    });

    ws.on("close", () => {
        if (!opened) {
            console.log("❌ WS blocked → disabling for 5 min");
            useWebSocket = false;
            wsDisabledUntil = Date.now() + 5 * 60 * 1000; // 5 min cooldown
        }
    });

    ws.on("error", () => {
        console.log("❌ WS error → fallback to REST");
        useWebSocket = false;
        wsDisabledUntil = Date.now() + 5 * 60 * 1000;
    });
};

// Start system
export const startFeed = () => {
    connectWS();

    // REST polling loop
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

    // Try WS again every 5 min
    setInterval(() => {
        if (!useWebSocket && Date.now() > wsDisabledUntil) {
            console.log("🔄 Retrying WebSocket...");
            connectWS();
        }
    }, 30000);
};

// Unified getter
export const getLivePrice = () => {
    if (!price) return null;

    return {
        price,
        latency: Date.now() - lastUpdate
    };
};