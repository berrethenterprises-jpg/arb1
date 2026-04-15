import fs from "fs";

const FILE = "./pools.json";

export const loadCache = () => {
  try {
    const data = fs.readFileSync(FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveCache = (pools) => {
  try {
    fs.writeFileSync(FILE, JSON.stringify(pools, null, 2));
  } catch {}
};