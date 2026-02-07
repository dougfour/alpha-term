import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const REPO = "dougfour/alpha-term";
const GITHUB_API = `https://api.github.com/repos/${REPO}/releases/latest`;
const CACHE_DIR = path.join(process.env.HOME || "", ".alpha-term");
const CACHE_FILE = path.join(CACHE_DIR, "update-check.json");

// Read version from package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8")
);
export const CURRENT_VERSION = packageJson.version;

interface ReleaseInfo {
  tag_name: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

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
    // Ignore cache errors
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
    // Ignore cache write errors
  }
}

function shouldCheck(): boolean {
  const cache = getCache();
  if (!cache) return true;
  
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();
  
  // Check if it's been more than a day
  return now - cache.lastCheck > ONE_DAY_MS;
}

export async function checkForUpdates(
  options: { force?: boolean; silent?: boolean } = {}
): Promise<{ hasUpdate: boolean; latestVersion?: string; message?: string }> {
  const { force = false, silent = false } = options;
  
  // Check if update checks are disabled
  if (process.env.NO_UPDATE_CHECK === "1") {
    return { hasUpdate: false };
  }
  
  // Throttle checks to once per day
  if (!force && !shouldCheck()) {
    return { hasUpdate: false };
  }
  
  try {
    const response = await fetch(GITHUB_API);
    
    if (!response.ok) {
      return { hasUpdate: false };
    }
    
    const data: ReleaseInfo = await response.json();
    const latestVersion = data.tag_name.replace("v", "");
    
    // Update cache
    saveCache({
      lastCheck: Date.now(),
      lastVersion: latestVersion,
    });
    
    // Compare versions
    const hasUpdate = compareVersions(latestVersion, CURRENT_VERSION) > 0;
    
    if (hasUpdate && !silent) {
      return {
        hasUpdate: true,
        latestVersion,
        message: `📣 Update available: ${CURRENT_VERSION} → ${latestVersion}\nRun 'alpha-term update' to install!`,
      };
    }
    
    return { hasUpdate: false };
  } catch {
    // Silent fail if offline
    return { hasUpdate: false };
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

export async function performUpdate(): Promise<{ success: boolean; message: string; newVersion?: string }> {
  try {
    // Fetch latest release info
    const response = await fetch(GITHUB_API);
    
    if (!response.ok) {
      return { success: false, message: "Failed to fetch release information." };
    }
    
    const data: ReleaseInfo = await response.json();
    const latestVersion = data.tag_name.replace("v", "");
    
    // Detect platform
    const os = getPlatform();
    const arch = getArch();
    
    // Find matching asset
    const assetName = `alpha-term-${os}-${arch}`;
    const asset = data.assets.find((a) => a.name.includes(`${os}-${arch}`));
    
    if (!asset) {
      return {
        success: false,
        message: `No binary available for ${os}-${arch}. Please download manually from GitHub.`,
      };
    }
    
    // Download and install
    const tempPath = path.join(CACHE_DIR, `alpha-term-temp-${Date.now()}`);
    
    console.log(`⬇️  Downloading Alpha-Term v${latestVersion}...`);
    
    const downloadResponse = await fetch(asset.browser_download_url);
    
    if (!downloadResponse.ok) {
      return { success: false, message: "Failed to download binary." };
    }
    
    // Write to temp file
    const buffer = await downloadResponse.arrayBuffer();
    fs.writeFileSync(tempPath, Buffer.from(buffer));
    
    // Make executable (Unix only)
    if (os !== "windows") {
      fs.chmodSync(tempPath, 0o755);
    }
    
    // Find current binary path
    const currentPath = process.execPath;
    
    // On Windows, we need to be clever since you can't overwrite running exe
    // On Unix, we can replace the binary
    if (os === "windows") {
      // Windows: Try to replace, fallback to telling user to run again
      try {
        fs.unlinkSync(currentPath + ".old");
      } catch {
        // Ignore
      }
      
      try {
        fs.renameSync(currentPath, currentPath + ".old");
        fs.renameSync(tempPath, currentPath);
        return {
          success: true,
          newVersion: latestVersion,
          message: `✅ Updated to v${latestVersion}! Restart alpha-term to use new version.`,
        };
      } catch {
        return {
          success: true,
          newVersion: latestVersion,
          message: `✅ Downloaded v${latestVersion} to temporary location.\nManual replacement may be required on Windows.`,
        };
      }
    } else {
      // Unix: Replace binary
      try {
        fs.unlinkSync(tempPath);
      } catch {
        // Ignore
      }
      
      // Use cp on Unix for atomic replacement
      const { execSync } = await import("child_process");
      execSync(`cp "${tempPath}" "${currentPath}" && chmod +x "${currentPath}"`);
      
      return {
        success: true,
        newVersion: latestVersion,
        message: `✅ Updated to v${latestVersion}!`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Update failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

function getPlatform(): string {
  switch (process.platform) {
    case "darwin":
      return "macos";
    case "linux":
      return "linux";
    case "win32":
      return "windows";
    default:
      return "linux";
  }
}

function getArch(): string {
  switch (process.arch) {
    case "x64":
      return "x64";
    case "arm64":
      return "arm64";
    default:
      return "x64";
  }
}

export function getBinaryName(): string {
  const os = getPlatform();
  const arch = getArch();
  return `alpha-term-${os}-${arch}`;
}
