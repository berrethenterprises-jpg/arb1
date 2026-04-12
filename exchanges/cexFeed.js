import WebSocket from "ws";

let orderbook = {
    bid: 0,
    ask: 0,
    lastUpdate: 0
};

let connected = false;

export const startFeed = () => {
    const ws = new WebSocket("wss://stream.binance.com:9443/ws/ethusdt@bookTicker");

    ws.on("open", () => {
        console.log("✅ Binance WebSocket connected");
        connected = true;
    });

    ws.on("message", (data) => {
        const msg = JSON.parse(data);

        orderbook.bid = parseFloat(msg.b);
        orderbook.ask = parseFloat(msg.a);
        orderbook.lastUpdate = Date.now();
    });

    ws.on("close", () => {
        console.log("⚠️ WebSocket closed, reconnecting...");
        connected = false;
        setTimeout(startFeed, 2000);
    });

    ws.on("error", (err) => {
        console.log("WebSocket error:", err.message);
    });
};

export const getLivePrice = () => {
    if (!connected) return null;

    return {
        price: (orderbook.bid + orderbook.ask) / 2,
        latency: Date.now() - orderbook.lastUpdate
    };
};
