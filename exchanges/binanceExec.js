import crypto from "crypto";
import https from "https";

const API_KEY = process.env.BINANCE_KEY;
const API_SECRET = process.env.BINANCE_SECRET;

const BASE = "https://api.binance.com";

const sign = (query) => {
    return crypto
        .createHmac("sha256", API_SECRET)
        .update(query)
        .digest("hex");
};

export const placeOrder = async (symbol, side, quantity) => {
    const timestamp = Date.now();

    const query = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}&timestamp=${timestamp}`;
    const signature = sign(query);

    const url = `${BASE}/api/v3/order?${query}&signature=${signature}`;

    return new Promise((resolve) => {
        const req = https.request(url, {
            method: "POST",
            headers: {
                "X-MBX-APIKEY": API_KEY
            }
        }, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => resolve(JSON.parse(data)));
        });

        req.on("error", () => resolve(null));
        req.end();
    });
};
