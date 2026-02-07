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

  console.log(`✅ ${subscription.tier?.toUpperCase()} subscription validated`);
  if (subscription.expiresAt) {
    console.log(`   Expires: ${subscription.expiresAt}\n`);
  }

  // Display banner
  console.clear();
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ██████╗ ██╗   ██╗██████╗ ███████╗██████╗ ██╗  ██╗ █████╗  ██████╗ ║
║  ██╔═══██╗██║   ██║██╔══██╗██╔════╝██╔══██╗██║  ██║██╔══██╗██╔════╝ ║
║  ██║   ██║██║   ██║██████╔╝█████╗  ██████╔╝███████║███████║██║  ███╗║
║  ██║   ██║██║   ██║██╔══██╗██╔══╝  ██╔══██╗██╔══██║██╔══██║██║   ██║║
║  ╚██████╔╝╚██████╔╝██║  ██║███████╗██║  ██║██║  ██║██║  ██║╚██████╔╝║
║   ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ║
║                                                                   ║
║                    <<< TERMINAL ALERTS FOR NEON ALPHA >>>          ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
`);

  console.log("🔔 Monitoring tweets...\n");
  console.log("Press Ctrl+C to quit.\n");

  // Main polling loop
  let pollInterval = config.pollInterval || 30000;
  
  const poll = async () => {
    try {
      const alerts = await api.getAlerts({
        handle: options.handle,
        keyword: options.keyword,
        limit: 10,
      });

      // Filter new alerts
      const monitors = options.handle 
        ? [{ handle: options.handle }]
        : api.getMonitors();

      for (const monitor of monitors) {
        const monitorAlerts = alerts.filter((a) => a.handle === monitor.handle);
        
        for (const alert of monitorAlerts) {
          // Check if we already displayed this
          if (!monitor.lastTweetId || alert.id > monitor.lastTweetId) {
            displayAlert(alert, options);
            
            // Update last tweet id
            monitor.lastTweetId = alert.id;
            api.updateConfig({ monitors: api.getMonitors() });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching alerts:", error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Initial poll
  await poll();

  // Set up polling
  setInterval(poll, pollInterval);
}

async function runWatchDemo(options: WatchOptions): Promise<void> {
  // Demo mode doesn't require subscription
  console.clear();
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ██████╗ ██╗   ██╗██████╗ ███████╗██████╗ ██║  ██╗ █████╗  ██████╗ ║
║  ██╔═══██╗██║   ██║██╔══██╗██╔════╝██╔══██╗██║  ██║██╔══██╗██╔════╝ ║
║  ██║   ██║██║   ██║██████╔╝█████╗  ██████╔╝███████║███████║██║  ███╗║
║  ██║   ██║██║   ██║██╔══██╗██╔══╝  ██╔══██╗██╔══██║██╔══██║██║   ██║║
║  ╚██████╔╝╚██████╔╝██║  ██║███████╗██║  ██║██║  ██║██║  ██║╚██████╔╝║
║   ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ║
║                                                                   ║
║                    <<< TERMINAL ALERTS FOR NEON ALPHA >>>          ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
`);

  console.log("📢 Demo Mode - Showing sample alert\n");
  console.log("🔔 @elonmusk Feb 6, 2026 23:22");
  console.log("─".repeat(75));
  console.log("🚀 $BTC showing strong momentum. Accumulation phase continuing. Watch for");
  console.log("breakout above $76K. The bull run is just getting started. #bitcoin #crypto");
  console.log("🔗 https://twitter.com/elonmusk/status/1234567890\n");

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("To use alpha-term for real:");
  console.log("  1. Subscribe to Pro or Elite at https://neonalpha.me");
  console.log("  2. Run 'alpha-term login YOUR_API_KEY'");
  console.log("  3. Run 'alpha-term add @elonmusk'");
  console.log("  4. Run 'alpha-term watch'");
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
    const line = JSON.stringify({
      id: alert.id,
      text: alert.text,
      handle: alert.handle,
      timestamp: alert.timestamp,
      url: alert.url,
    }) + "\n";
    fs.appendFileSync(saveFile, line);
  }

  // Output
  if (options.json) {
    console.log(JSON.stringify(alert, null, 2));
  } else {
    const timestamp = format(new Date(alert.timestamp), "MMM d, yyyy HH:mm:ss");
    const icon = options.sound ? "🔔" : "📢";
    
    console.log(`${icon} ${alert.handle} ${timestamp}`);
    console.log("─".repeat(75));
    
    // Word wrap text at 75 chars
    const maxWidth = 75;
    const words = alert.text.split(" ");
    let line = "";
    
    for (const word of words) {
      if ((line + " " + word).trim().length > maxWidth) {
        console.log(line);
        line = word;
      } else {
        line = line ? line + " " + word : word;
      }
    }
    console.log(line);
    
    console.log(`🔗 ${alert.url}\n`);
  }
}
