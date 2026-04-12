let prices = [];
let results = [];

export const updatePrice = (p) => {
    prices.push(p);
    if (prices.length > 50) prices.shift();
};

export const recordResult = (p) => {
    results.push(p);
    if (results.length > 50) results.shift();
};

const momentum = () => {
    if (prices.length < 3) return 0;
    return prices[prices.length - 1] - prices[prices.length - 3];
};

const velocity = () => {
    if (prices.length < 5) return 0;
    return prices[prices.length - 1] - prices[prices.length - 5];
};

const consistency = () => {
    let up = 0;
    for (let i = 1; i < prices.length; i++) {
        if (prices[i] > prices[i - 1]) up++;
    }
    return up / prices.length;
};

const historyEdge = () => {
    if (results.length < 5) return 1;
    const avg = results.reduce((a, b) => a + b, 0) / results.length;
    return avg > 0 ? 1.2 : 0.8;
};

export const getAlpha = (volatility, lossStreak) => {
    let a =
        momentum() * 2 +
        velocity() * 1.5 +
        consistency() * 3;

    a *= historyEdge();

    if (volatility < 0.0015) a *= 0.5;
    if (lossStreak > 3) a *= 0.7;

    return Math.min(a, 2);
};