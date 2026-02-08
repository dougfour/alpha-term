import { Alert, api } from "../lib/api.js";

// ANSI colors
const GREEN = "\x1b[92m";
const CYAN = "\x1b[96m";
const YELLOW = "\x1b[93m";
const RED = "\x1b[91m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

// Box drawing
const BOX_TL = "┌", BOX_TR = "┐", BOX_BL = "└", BOX_BR = "┘";
const BOX_H = "─", BOX_V = "│";
const BOX_ML = "├", BOX_MR = "┤";

interface RunOptions {
  keyword?: string;
  handle?: string;
  json?: boolean;
  limit?: number;
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

function renderAlert(alert: Alert, isLast: boolean): string {
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

  const limit = options.limit || 20;

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

    // Header
    const title = options.handle ? `@${options.handle.replace(/^@/, "")}` : "ALL ALERTS";
    const timeStr = new Date().toLocaleTimeString();

    console.log(`${GREEN}${BOX_TL}${BOX_H.repeat(8)} ALPHA-TERM ${BOX_H.repeat(8)}${BOX_TR}${RESET}`);
    console.log(`${GREEN}${BOX_V}${RESET} ${BOLD}${CYAN}NeonAlpha Alerts${RESET}                     ${GREEN}${BOX_V}${RESET}`);
    console.log(`${GREEN}${BOX_V}${RESET} ${title} | ${GREEN}*${RESET} ${timeStr}              ${GREEN}${BOX_V}${RESET}`);
    console.log(`${GREEN}${BOX_ML}${BOX_H.repeat(75)}${BOX_MR}${RESET}`);

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
