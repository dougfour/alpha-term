import axios, { AxiosInstance, AxiosError } from "axios";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_DIR = path.join(process.env.HOME || "", ".alpha-term");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const TOKEN_FILE = path.join(CONFIG_DIR, "token");

export interface Config {
  apiUrl: string;
  pollInterval: number;
  soundEnabled: boolean;
  saveToFile?: string;
  monitors: Monitor[];
}

export interface Monitor {
  handle: string;
  keyword?: string;
  lastTweetId?: string;
}

export interface Alert {
  id: string;
  text: string;
  handle: string;
  timestamp: number;
  url: string;
}

export interface SubscriptionStatus {
  valid: boolean;
  tier: "free" | "pro" | "elite" | null;
  expiresAt?: string;
  error?: string;
}

class NeonAlphaClient {
  private client: AxiosInstance;
  private config: Config;

  constructor() {
    this.config = this.loadConfig();
    
    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use(async (config) => {
      const token = await this.loadToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  private loadConfig(): Config {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    if (!fs.existsSync(CONFIG_FILE)) {
      const defaultConfig: Config = {
        apiUrl: "https://api.neonalpha.me/v1",
        pollInterval: 30000, // 30 seconds
        soundEnabled: false,
        monitors: [],
      };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }

    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  }

  saveConfig(): void {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
  }

  async loadToken(): Promise<string | null> {
    if (!fs.existsSync(TOKEN_FILE)) {
      return null;
    }
    return fs.readFileSync(TOKEN_FILE, "utf-8").trim();
  }

  async saveToken(token: string): Promise<void> {
    fs.writeFileSync(TOKEN_FILE, token);
  }

  async validateSubscription(): Promise<SubscriptionStatus> {
    const token = await this.loadToken();
    if (!token) {
      return {
        valid: false,
        tier: null,
        error: "Not logged in. Run 'alpha-term login' first.",
      };
    }

    try {
      const response = await this.client.post("/cli/validate");
      const { valid, tier, expires_at } = response.data;

      if (!valid) {
        return {
          valid: false,
          tier: null,
          error: "Subscription is inactive or expired.",
        };
      }

      // Check if tier allows CLI access
      if (tier === "free") {
        return {
          valid: false,
          tier: "free",
          error: "Alpha-Term CLI requires Pro or Elite subscription.\nVisit https://neonalpha.me/upgrade to upgrade.",
        };
      }

      return {
        valid: true,
        tier: tier as "pro" | "elite",
        expiresAt: expires_at,
      };
    } catch (error) {
      if (AxiosError && (error as AxiosError).response?.status === 403) {
        return {
          valid: false,
          tier: null,
          error: "Access denied. Pro or Elite subscription required.\nVisit https://neonalpha.me/upgrade",
        };
      }
      return {
        valid: false,
        tier: null,
        error: "Failed to validate subscription. Please try again.",
      };
    }
  }

  async getAlerts(params: {
    handle?: string;
    keyword?: string;
    limit?: number;
  }): Promise<Alert[]> {
    const response = await this.client.get("/alerts", { params });
    return response.data;
  }

  async addMonitor(handle: string, keyword?: string): Promise<void> {
    const exists = this.config.monitors.find((m) => m.handle === handle);
    if (exists) {
      if (keyword) {
        exists.keyword = keyword;
      }
    } else {
      this.config.monitors.push({ handle, keyword });
    }
    this.saveConfig();
  }

  async removeMonitor(handle: string): Promise<void> {
    this.config.monitors = this.config.monitors.filter((m) => m.handle !== handle);
    this.saveConfig();
  }

  getMonitors(): Monitor[] {
    return this.config.monitors;
  }

  getConfig(): Config {
    return this.config;
  }

  updateConfig(updates: Partial<Config>): void {
    Object.assign(this.config, updates);
    this.saveConfig();
  }
}

export const api = new NeonAlphaClient();
