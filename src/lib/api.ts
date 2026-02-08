import axios, { AxiosInstance, AxiosError } from "axios";
import * as fs from "fs";
import * as path from "path";

const API_URL = process.env.ALPHA_TERM_API_URL || "https://api.neonalpha.me/api/v1";
const CONFIG_DIR = path.join(process.env.HOME || "", ".alpha-term");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const TOKEN_FILE = path.join(CONFIG_DIR, "token");

interface TokenData {
  access_token: string;
  refresh_token?: string;
}

export interface Config {
  soundEnabled: boolean;
  saveToFile?: string;
}

export interface Alert {
  id: string;
  monitor_id: string;
  tweet_id: string;
  tweet_text: string;
  author_handle: string;
  author_name: string;
  author_avatar: string;
  created_at: string;
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
  private isRefreshing = false;

  constructor() {
    this.config = this.loadConfig();

    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use(async (config) => {
      const tokens = this.loadTokens();
      if (tokens?.access_token) {
        config.headers.Authorization = `Bearer ${tokens.access_token}`;
      }
      return config;
    });

    // Add 401 response interceptor for auto-refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !this.isRefreshing
        ) {
          originalRequest._retry = true;
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            const tokens = this.loadTokens();
            if (tokens?.access_token) {
              originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
            }
            return this.client(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private loadConfig(): Config {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    if (!fs.existsSync(CONFIG_FILE)) {
      const defaultConfig: Config = {
        soundEnabled: false,
      };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }

    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  }

  saveConfig(): void {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
  }

  loadTokens(): TokenData | null {
    if (!fs.existsSync(TOKEN_FILE)) {
      return null;
    }
    const raw = fs.readFileSync(TOKEN_FILE, "utf-8").trim();
    if (!raw) return null;

    // Support both JSON format and raw token string
    try {
      return JSON.parse(raw) as TokenData;
    } catch {
      // Legacy: raw token string (no refresh token)
      return { access_token: raw };
    }
  }

  saveTokens(tokens: TokenData): void {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2), { mode: 0o600 });
  }

  private async refreshAccessToken(): Promise<boolean> {
    const tokens = this.loadTokens();
    if (!tokens?.refresh_token) {
      return false;
    }

    this.isRefreshing = true;
    try {
      // Use raw axios to avoid the interceptor loop
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refresh_token: tokens.refresh_token,
      });

      const { access_token, refresh_token } = response.data;
      this.saveTokens({
        access_token,
        refresh_token: refresh_token || tokens.refresh_token,
      });
      return true;
    } catch {
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  async validateSubscription(): Promise<SubscriptionStatus> {
    const tokens = this.loadTokens();
    if (!tokens?.access_token) {
      return {
        valid: false,
        tier: null,
        error: "Not logged in. Run 'alpha-term login' first.",
      };
    }

    try {
      const response = await this.client.get("/auth/me");
      const { subscription_tier } = response.data;

      // Check if tier allows CLI access
      if (!subscription_tier || subscription_tier === "free") {
        return {
          valid: false,
          tier: (subscription_tier || "free") as "free",
          error: "Alpha-Term CLI requires Pro or Elite subscription.\nVisit https://neonalpha.me/upgrade to upgrade.",
        };
      }

      return {
        valid: true,
        tier: subscription_tier as "pro" | "elite",
      };
    } catch (error) {
      if ((error as AxiosError).response?.status === 401) {
        return {
          valid: false,
          tier: null,
          error: "Session expired. Please run 'alpha-term login' to sign in again.",
        };
      }
      return {
        valid: false,
        tier: null,
        error: "Failed to validate subscription. Please try again.",
      };
    }
  }

  async login(email: string, password: string): Promise<{ access_token: string; refresh_token: string }> {
    // The API uses OAuth2PasswordRequestForm which expects form-encoded data
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);

    const response = await axios.post(`${API_URL}/auth/login`, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response.data;
  }

  async getAlerts(limit: number = 20): Promise<Alert[]> {
    const response = await this.client.get("/alerts", { params: { limit } });
    return response.data;
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
