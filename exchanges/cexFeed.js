import WebSocket from "ws";

let orderbook = {
    bid: 0,
    ask: 0,
    lastUpdate: 0
};

let ws;
let reconnectDelay = 2000;
let heartbeatInterval;

const connect = () => {
    ws = new WebSocket(
        "wss://stream.binance.com:9443/ws/ethusdt@bookTicker"
    );

    ws.on("open", () => {
        console.log("✅ WebSocket connected");

        reconnectDelay = 2000;

        // ❤️ Heartbeat (prevents disconnects)
        heartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
            }
        }, 15000);
    });

    ws.on("message", (data) => {
        try {
            const msg = JSON.parse(data);

            orderbook.bid = parseFloat(msg.b);
            orderbook.ask = parseFloat(msg.a);
            orderbook.lastUpdate = Date.now();
        } catch (e) {}
    });

    ws.on("close", () => {
        console.log("⚠️ WebSocket closed");

        clearInterval(heartbeatInterval);

        reconnect();
    });

    ws.on("error", (err) => {
        console.log("WebSocket error:", err.message);
    });
};

const reconnect = () => {
    console.log(`🔄 Reconnecting in ${reconnectDelay}ms...`);

    setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 1.5, 15000);
        connect();
    }, reconnectDelay);
};

export const startFeed = () => {
    connect();
};

export const getLivePrice = () => {
    if (!orderbook.lastUpdate) return null;

    return {
        price: (orderbook.bid + orderbook.ask) / 2,
        latency: Date.now() - orderbook.lastUpdate
    };
};