export const executeAtomic = async (cexFn, dexFn) => {
    const start = Date.now();

    const [cex, dex] = await Promise.allSettled([
        cexFn(),
        dexFn()
    ]);

    const latency = Date.now() - start;

    if (cex.status !== "fulfilled" || dex.status !== "fulfilled") {
        return { success: false, latency };
    }

    return { success: true, latency };
};
