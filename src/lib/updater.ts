import * as fs from "fs";
import * as path from "path";

// Version - replaced at build time (same as cli.ts)
export const CURRENT_VERSION = "{{VERSION}}";

const REPO = "dougfour/alpha-term";
const GITHUB_API = `https://api.github.com/repos/${REPO}/releases/latest`;
const CACHE_DIR = path.join(process.env.HOME || "", ".alpha-term");
const CACHE_FILE = path.join(CACHE_DIR, "update-check.json");

interface CacheData {
  lastCheck: number;
  lastVersion: string;
}

function getCache(): CacheData | null {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    }
  } catch {
    // Ignore
  }
  return null;
}

function saveCache(data: CacheData): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch {
    // Ignore
  }
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export async function checkForUpdates(force: boolean = false): Promise<{ hasUpdate: boolean; latestVersion?: string }> {
  if (process.env.NO_UPDATE_CHECK === "1") {
    return { hasUpdate: false };
  }

  // Throttle to once per day (unless forced)
  const cache = getCache();
  if (!force && cache) {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (Date.now() - cache.lastCheck < ONE_DAY) {
      // Use cached result
      const current = CURRENT_VERSION.includes("VERSION") ? "0.0.0" : CURRENT_VERSION;
      const hasUpdate = compareVersions(cache.lastVersion, current) > 0;
      return { hasUpdate, latestVersion: cache.lastVersion };
    }
  }

  try {
    const response = await fetch(GITHUB_API);
    if (!response.ok) return { hasUpdate: false };

    const data = await response.json() as { tag_name: string };
    const latestVersion = data.tag_name.replace("v", "");

    saveCache({ lastCheck: Date.now(), lastVersion: latestVersion });

    const current = CURRENT_VERSION.includes("VERSION") ? "0.0.0" : CURRENT_VERSION;
    const hasUpdate = compareVersions(latestVersion, current) > 0;

    return { hasUpdate, latestVersion };
  } catch {
    return { hasUpdate: false };
  }
}
