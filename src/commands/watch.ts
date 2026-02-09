import { Alert, api } from "../lib/api.js";
import {
  GREEN, CYAN, YELLOW, RED, RESET, DIM, CLEAR_LINE,
  BOX_H,
  renderAlert, printBanner,
} from "../lib/render.js";
import * as fs from "fs";

interface WatchOptions {
  sound?: boolean;
  save?: string;
  keyword?: string;
  handle?: string;
  json?: boolean;
  test?: boolean;
}

function formatDateTime(createdAt: string): string {
  try {
    let isoStr = createdAt;
    if (!isoStr.endsWith("Z") && !isoStr.includes("+")) {
      isoStr += "Z";
    }
    const dt = new Date(isoStr);
    const y = dt.getFullYear();
    const mo = (dt.getMonth() + 1).toString().padStart(2, "0");
    const d = dt.getDate().toString().padStart(2, "0");
    const h = dt.getHours().toString().padStart(2, "0");
    const mi = dt.getMinutes().toString().padStart(2, "0");
    const s = dt.getSeconds().toString().padStart(2, "0");
    const tzName = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
      .formatToParts(dt)
      .find((p) => p.type === "timeZoneName")?.value || "";
    return `${y}-${mo}-${d} ${h}:${mi}:${s} ${tzName}`;
  } catch {
    return createdAt;
  }
}

function localTimeNow(): string {
  const dt = new Date();
  const h = dt.getHours().toString().padStart(2, "0");
  const m = dt.getMinutes().toString().padStart(2, "0");
  const s = dt.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export async function watchCommand(options: WatchOptions): Promise<void> {

  // Demo mode if --test flag is passed
  if (options.test) {
    await runWatchDemo(options);
    return;
  }

  // Check subscription for non-demo mode
  console.log(`\n${CYAN}Validating subscription...${RESET}\n`);
  const subscription = await api.validateSubscription();

  if (!subscription.valid) {
    console.log(`${RED}${subscription.error}${RESET}\n`);
    console.log(`${GREEN}${BOX_H.repeat(55)}${RESET}`);
    console.log(`${YELLOW}Alpha-Term CLI is available for Pro and Elite subscribers only.${RESET}`);
    console.log(`${GREEN}${BOX_H.repeat(55)}${RESET}\n`);
    return;
  }

  console.log(`${GREEN}${subscription.tier?.toUpperCase()}${RESET} subscription validated\n`);

  // Display banner
  printBanner();

  console.log(`${CYAN}Press Ctrl+C to quit${RESET}`);
  console.log(`${YELLOW}Waiting for new tweets...${RESET}\n`);

  // Track which alerts we've already shown
  const shownIds = new Set<string>();
  let firstRun = true;
  let tweetCount = 0;
  const POLL_INTERVAL = 30000;

  const poll = async () => {
    try {
      const alerts = await api.getAlerts(50);

      // Filter by handle/keyword if specified via CLI options
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

      if (firstRun) {
        // On first run, record existing IDs but don't display them
        for (const alert of filtered) {
          shownIds.add(alert.id);
        }
        firstRun = false;
      } else {
        // Only show alerts we haven't seen before
        const newAlerts = filtered.filter((a) => !shownIds.has(a.id));

        // Clear heartbeat line before printing alerts
        if (newAlerts.length > 0) {
          process.stdout.write(`\r${CLEAR_LINE}`);
        }

        // Show oldest first
        for (const alert of newAlerts.reverse()) {
          tweetCount++;
          shownIds.add(alert.id);

          // Save to file if requested
          if (options.save) {
            const line = `--- @${alert.author_handle} | ${formatDateTime(alert.created_at)} ---\n${alert.tweet_text}\nID: ${alert.id}\n\n`;
            fs.appendFileSync(options.save, line);
          }

          if (options.json) {
            console.log(JSON.stringify(alert, null, 2));
          } else {
            console.log();
            console.log(renderAlert(alert));
          }
        }

        if (newAlerts.length > 0) {
          if (options.sound) {
            process.stdout.write("\x07"); // Terminal bell
          }
          console.log(`${GREEN}✓ Got ${newAlerts.length} new tweet(s) · ${tweetCount} total this session${RESET}`);
        } else {
          process.stdout.write(`\r${CLEAR_LINE}${DIM}· listening ━━━━━━━━━━ ${localTimeNow()}${RESET}`);
        }

        // Prevent unbounded growth of shown IDs
        if (shownIds.size > 1000) {
          const entries = Array.from(shownIds);
          shownIds.clear();
          for (const id of entries.slice(-500)) {
            shownIds.add(id);
          }
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        console.log(`\n${RED}Session expired. Please run 'alpha-term login' to sign in again.${RESET}\n`);
        process.exit(1);
      }
      if (error?.response?.status === 429) {
        console.log(`${YELLOW}Rate limited. Waiting before next check...${RESET}`);
        return;
      }
      console.error(`${RED}Error fetching alerts:${RESET}`, error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Initial poll, then schedule next after completion
  const loop = async () => {
    await poll();
    setTimeout(loop, POLL_INTERVAL);
  };
  await loop();
}

async function runWatchDemo(options: WatchOptions): Promise<void> {
  printBanner();

  const demoAlert: Alert = {
    id: "demo-1",
    monitor_id: "demo",
    tweet_id: "demo",
    tweet_text: "$BTC showing strong momentum. Accumulation phase continuing. Watch for breakout above $76K. The bull run is just getting started. #bitcoin #crypto",
    author_handle: "elonmusk",
    author_name: "Elon Musk",
    author_avatar: "",
    created_at: new Date().toISOString(),
  };

  console.log();
  console.log(renderAlert(demoAlert));

  console.log(`${GREEN}${BOX_H.repeat(55)}${RESET}`);
  console.log(`${YELLOW}To use alpha-term for real:${RESET}`);
  console.log(`  1. Subscribe to Pro or Elite at ${CYAN}https://neonalpha.me${RESET}`);
  console.log(`  2. Run '${GREEN}alpha-term login${RESET}'`);
  console.log(`  3. Run '${GREEN}alpha-term watch${RESET}'`);
  console.log(`${GREEN}${BOX_H.repeat(55)}${RESET}\n`);
}
