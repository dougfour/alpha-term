import { Alert, api } from "../lib/api.js";
import { format } from "date-fns";
import * as fs from "fs";

interface WatchOptions {
  sound?: boolean;
  save?: string;
  keyword?: string;
  handle?: string;
  json?: boolean;
  test?: boolean;
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
    console.log("\n🧪 Running in TEST MODE\n");
    await runWatchDemo(options);
    return;
  }

  // Check subscription for non-demo mode
  console.log("\n🔐 Validating subscription...\n");
  const subscription = await api.validateSubscription();

  if (!subscription.valid) {
    console.log("❌ " + subscription.error + "\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Alpha-Term CLI is available for Pro and Elite subscribers only.");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return;
  }

  console.log(`✅ ${subscription.tier?.toUpperCase()} subscription validated\n`);

  // Display banner
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                         ║
║                    <<< ALPHA-TERM LIVE MODE >>>                         ║
║                                                                         ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

  console.log("🔔 Monitoring tweets...");
  console.log("Press Ctrl+C to quit.\n");

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
        console.log(`📡 Tracking ${filtered.length} existing alert(s). Waiting for new tweets...\n`);
      } else {
        // Only show alerts we haven't seen before
        const newAlerts = filtered.filter((a) => !shownIds.has(a.id));

        // Show oldest first
        for (const alert of newAlerts.reverse()) {
          tweetCount++;
          shownIds.add(alert.id);
          displayAlert(alert, options);
          console.log(`>>> #${tweetCount} | ${new Date().toLocaleTimeString()}\n`);
        }

        if (newAlerts.length > 0) {
          if (options.sound) {
            process.stdout.write("\x07"); // Terminal bell
          }
          console.log(`✓ Got ${newAlerts.length} new tweet(s)\n`);
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        console.log("\n⚠️  Session expired. Please run 'alpha-term login' to sign in again.\n");
        process.exit(1);
      }
      console.error("Error fetching alerts:", error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Initial poll
  await poll();

  // Set up polling
  setInterval(poll, pollInterval);
}

async function runWatchDemo(options: WatchOptions): Promise<void> {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                         ║
║                    <<< ALPHA-TERM DEMO MODE >>>                         ║
║                                                                         ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

  console.log("📢 Demo Mode - Showing sample alert\n");
  console.log("🔔 @elonmusk Feb 6, 2026 23:22");
  console.log("─".repeat(75));
  console.log("🚀 $BTC showing strong momentum. Accumulation phase continuing. Watch for");
  console.log("breakout above $76K. The bull run is just getting started. #bitcoin #crypto");
  console.log("");

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("To use alpha-term for real:");
  console.log("  1. Subscribe to Pro or Elite at https://neonalpha.me");
  console.log("  2. Run 'alpha-term login YOUR_API_KEY'");
  console.log("  3. Run 'alpha-term watch'");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

function displayAlert(alert: Alert, options: WatchOptions): void {
  // Play sound
  if (options.sound) {
    process.stdout.write("\x07"); // Terminal bell
  }

  // Save to file
  const saveFile = options.save || api.getConfig().saveToFile;
  if (saveFile) {
    const timestamp = formatTimestamp(alert.created_at);
    const line = `--- @${alert.author_handle} | ${timestamp} ---\n${alert.tweet_text}\nID: ${alert.id}\n\n`;
    fs.appendFileSync(saveFile, line);
  }

  // Output
  if (options.json) {
    console.log(JSON.stringify(alert, null, 2));
  } else {
    const timestamp = formatTimestamp(alert.created_at);
    const icon = options.sound ? "🔔" : "📢";

    console.log(`${icon} @${alert.author_handle} ${timestamp}`);
    console.log("─".repeat(75));

    // Word wrap text at 75 chars
    const maxWidth = 75;
    const words = alert.tweet_text.split(" ");
    let line = "";

    for (const word of words) {
      if ((line + " " + word).trim().length > maxWidth) {
        console.log(line);
        line = word;
      } else {
        line = line ? line + " " + word : word;
      }
    }
    if (line) {
      console.log(line);
    }
    console.log("");
  }
}

function formatTimestamp(createdAt: string): string {
  try {
    return format(new Date(createdAt), "MMM d, yyyy HH:mm:ss");
  } catch {
    return createdAt;
  }
}
