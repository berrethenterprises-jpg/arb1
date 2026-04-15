import fs from "fs";

const FILE = "./pools.json";

export const loadCache = () => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf-8"));
  } catch {
    return [];
  }
};

export const saveCache = (data) => {
  try {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  } catch {}
};