import { Alert, api } from "../lib/api.js";
import * as fs from "fs";

// ANSI colors
const GREEN = "\x1b[92m";
const CYAN = "\x1b[96m";
const YELLOW = "\x1b[93m";
const RED = "\x1b[91m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const MAGENTA = "\x1b[95m";

// Box drawing
const BOX_TL = "┌", BOX_TR = "┐", BOX_BL = "└", BOX_BR = "┘";
const BOX_H = "─", BOX_V = "│";
const BOX_ML = "├", BOX_MR = "┤";

interface WatchOptions {
  sound?: boolean;
  save?: string;
  keyword?: string;
  handle?: string;
  json?: boolean;
  test?: boolean;
}

function wrapText(text: string, width: number = 60): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(" ");
    let current = "";
    for (const word of words) {
      if (current.length + word.length + 1 <= width) {
        current += (current ? " " : "") + word;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function formatTime(createdAt: string): string {
  try {
    const dt = new Date(createdAt);
    return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" });
  } catch {
    return createdAt;
  }
}

function formatDateTime(createdAt: string): string {
  try {
    const dt = new Date(createdAt);
    return dt.toLocaleString([], { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" });
  } catch {
    return createdAt;
  }
}

function renderAlert(alert: Alert, isLast: boolean = true): string {
  const author = alert.author_handle;
  const text = alert.tweet_text;
  const timeStr = formatTime(alert.created_at);

  const bottom = isLast ? BOX_BL : BOX_ML;
  const right = isLast ? BOX_BR : BOX_MR;

  const lines: string[] = [];
  lines.push(`${GREEN}${BOX_V}${RESET}  ${YELLOW}🔔${RESET}  ${BOLD}${CYAN}@${author}${RESET}`);
  lines.push(`${GREEN}${BOX_V}${RESET}  ${CYAN}${BOX_H.repeat(30)}${RESET}`);

  const wrapped = wrapText(text);
  for (const line of wrapped) {
    lines.push(`${GREEN}${BOX_V}${RESET}  ${line}`);
  }

  lines.push(`${GREEN}${BOX_V}${RESET}`);
  lines.push(`${GREEN}${BOX_V}${RESET}  ${GREEN}*${RESET} ${timeStr}`);
  lines.push(`${GREEN}${bottom}${BOX_H.repeat(75)}${right}${RESET}`);

  return lines.join("\n");
}

function renderNewBanner(count: number): string {
  if (count === 0) return "";
  const lines: string[] = [];
  lines.push(`\n${YELLOW}${BOX_TL}${BOX_H.repeat(6)} >> NEW ALERTS >> ${BOX_H.repeat(6)}${BOX_TR}`);
  lines.push(`${BOX_V}  ${count} new tweet(s) since last refresh  ${BOX_V}`);
  lines.push(`${BOX_BL}${BOX_H.repeat(34)}${BOX_BR}${RESET}\n`);
  return lines.join("\n");
}

export async function watchCommand(options: WatchOptions): Promise<void> {
  const config = api.getConfig();

  // Update config with options
  if (options.sound) {
    api.updateConfig({ soundEnabled: true });
  }
  if (options.save) {
    api.updateConfig({ saveToFile: options.save });
  }

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
  console.log(`${GREEN}${BOX_TL}${BOX_H.repeat(75)}${BOX_TR}${RESET}`);
  console.log(`${GREEN}${BOX_V}${RESET}                                                                           ${GREEN}${BOX_V}${RESET}`);
  console.log(`${GREEN}${BOX_V}${RESET}                    ${BOLD}${CYAN}<<< ALPHA-TERM LIVE MODE >>>${RESET}                        ${GREEN}${BOX_V}${RESET}`);
  console.log(`${GREEN}${BOX_V}${RESET}                                                                           ${GREEN}${BOX_V}${RESET}`);
  console.log(`${GREEN}${BOX_ML}${BOX_H.repeat(75)}${BOX_MR}${RESET}`);

  console.log(`\n${GREEN}>>> ALPHA-TERM LIVE MODE <<<${RESET}`);
  console.log(`${CYAN}Press Ctrl+C to quit | Polling every ${(config.pollInterval || 30000) / 1000}s${RESET}`);
  console.log(`${YELLOW}Waiting for new tweets...${RESET}\n`);

  // Track which alerts we've already shown
  const shownIds = new Set<string>();
  let firstRun = true;
  let tweetCount = 0;
  const pollInterval = config.pollInterval || 30000;

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
        console.log(`${CYAN}Tracking ${filtered.length} existing alert(s). Waiting for new tweets...${RESET}\n`);
      } else {
        // Only show alerts we haven't seen before
        const newAlerts = filtered.filter((a) => !shownIds.has(a.id));

        if (newAlerts.length > 0) {
          console.log(renderNewBanner(newAlerts.length));
        }

        // Show oldest first
        for (const alert of newAlerts.reverse()) {
          tweetCount++;
          shownIds.add(alert.id);

          // Save to file if requested
          const saveFile = options.save || config.saveToFile;
          if (saveFile) {
            const line = `--- @${alert.author_handle} | ${formatDateTime(alert.created_at)} ---\n${alert.tweet_text}\nID: ${alert.id}\n\n`;
            fs.appendFileSync(saveFile, line);
          }

          if (options.json) {
            console.log(JSON.stringify(alert, null, 2));
          } else {
            console.log();
            console.log(renderAlert(alert));
            console.log(`${CYAN}>>> #${tweetCount} | ${new Date().toLocaleTimeString()}${RESET}\n`);
          }
        }

        if (newAlerts.length > 0) {
          if (options.sound) {
            process.stdout.write("\x07"); // Terminal bell
          }
          console.log(`${GREEN}✓ Got ${newAlerts.length} new tweet(s)${RESET}`);
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        console.log(`\n${RED}Session expired. Please run 'alpha-term login' to sign in again.${RESET}\n`);
        process.exit(1);
      }
      console.error(`${RED}Error fetching alerts:${RESET}`, error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Initial poll
  await poll();

  // Set up polling
  setInterval(poll, pollInterval);
}

async function runWatchDemo(options: WatchOptions): Promise<void> {
  console.log(`\n${GREEN}${BOX_TL}${BOX_H.repeat(75)}${BOX_TR}${RESET}`);
  console.log(`${GREEN}${BOX_V}${RESET}                                                                           ${GREEN}${BOX_V}${RESET}`);
  console.log(`${GREEN}${BOX_V}${RESET}                    ${BOLD}${CYAN}<<< ALPHA-TERM DEMO MODE >>>${RESET}                        ${GREEN}${BOX_V}${RESET}`);
  console.log(`${GREEN}${BOX_V}${RESET}                                                                           ${GREEN}${BOX_V}${RESET}`);
  console.log(`${GREEN}${BOX_ML}${BOX_H.repeat(75)}${BOX_MR}${RESET}`);

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
  console.log(`${CYAN}>>> #1 | ${new Date().toLocaleTimeString()}${RESET}\n`);

  console.log(`${GREEN}${BOX_H.repeat(55)}${RESET}`);
  console.log(`${YELLOW}To use alpha-term for real:${RESET}`);
  console.log(`  1. Subscribe to Pro or Elite at ${CYAN}https://neonalpha.me${RESET}`);
  console.log(`  2. Run '${GREEN}alpha-term login${RESET}'`);
  console.log(`  3. Run '${GREEN}alpha-term watch${RESET}'`);
  console.log(`${GREEN}${BOX_H.repeat(55)}${RESET}\n`);
}
