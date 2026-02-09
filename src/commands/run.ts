import { api } from "../lib/api.js";
import {
  GREEN, CYAN, YELLOW, RED, RESET,
  BOX_H,
  renderAlert, printBanner,
} from "../lib/render.js";

interface RunOptions {
  keyword?: string;
  handle?: string;
  json?: boolean;
  limit?: number;
}

export async function runCommand(options: RunOptions): Promise<void> {
  // Check subscription
  console.log(`\n${CYAN}Validating subscription...${RESET}\n`);
  const subscription = await api.validateSubscription();

  if (!subscription.valid) {
    console.log(`${RED}${subscription.error}${RESET}\n`);
    console.log(`${GREEN}${BOX_H.repeat(55)}${RESET}`);
    console.log(`${YELLOW}Alpha-Term CLI is available for Pro and Elite subscribers only.${RESET}`);
    console.log(`${GREEN}${BOX_H.repeat(55)}${RESET}\n`);
    return;
  }

  const config = api.getConfig();
  const limit = options.limit || config.defaultLimit || 20;

  try {
    const alerts = await api.getAlerts(limit);

    // Filter by handle/keyword if specified
    let filtered = alerts;
    if (options.handle) {
      const handle = options.handle.replace(/^@/, "").toLowerCase();
      filtered = filtered.filter(
        (a) => a.author_handle.toLowerCase() === handle
      );
    }
    if (options.keyword) {
      const kw = options.keyword.toLowerCase();
      filtered = filtered.filter((a) =>
        a.tweet_text.toLowerCase().includes(kw)
      );
    }

    if (filtered.length === 0) {
      console.log(`${YELLOW}No alerts yet.${RESET}`);
      console.log(`Alerts will appear here once your monitored accounts tweet.\n`);
      console.log(`Manage your watch list at ${CYAN}https://neonalpha.me/dashboard${RESET}\n`);
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(filtered, null, 2));
      return;
    }

    // Banner
    printBanner();

    // Show alerts oldest first (newest at bottom)
    const sorted = [...filtered].reverse();
    for (let i = 0; i < sorted.length; i++) {
      console.log(renderAlert(sorted[i], i === sorted.length - 1));
    }

    // Footer
    console.log(`\n${CYAN}ALPHA-TERM | Showing ${filtered.length} alert(s) | ${subscription.tier?.toUpperCase()} | neonalpha.me${RESET}\n`);
  } catch (error: any) {
    if (error?.response?.status === 401) {
      console.log(`\n${RED}Session expired. Please run 'alpha-term login' to sign in again.${RESET}\n`);
      return;
    }
    console.error(`${RED}Error fetching alerts:${RESET}`, error instanceof Error ? error.message : "Unknown error");
  }
}
