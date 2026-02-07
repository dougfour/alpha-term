import { api } from "../lib/api.js";

interface ConfigOptions {
  set?: string;
  get?: string;
  reset?: boolean;
}

export async function configCommand(options: ConfigOptions): Promise<void> {
  console.log("\n⚙️  Alpha-Term Configuration\n");

  // Check subscription first (but allow config viewing)
  const subscription = await api.validateSubscription();
  const showWarning = !subscription.valid && subscription.tier === "free";

  if (showWarning) {
    console.log("⚠️  Free tier detected - CLI access requires Pro/Elite.\n");
  }

  // Reset config
  if (options.reset) {
    api.updateConfig({
      soundEnabled: false,
      pollInterval: 30000,
      saveToFile: undefined,
    });
    console.log("✅ Configuration reset to defaults.\n");
    return;
  }

  // Get config value
  if (options.get) {
    const config = api.getConfig();
    const value = (config as any)[options.get as keyof typeof config];
    console.log("  " + options.get + ": " + (value !== undefined ? value : "not set") + "\n");
    return;
  }

  // Set config value
  if (options.set) {
    const [key, value] = options.set.split(" ");
    
    if (!key || value === undefined) {
      console.log("❌ Usage: alpha-term config --set <key> <value>\n");
      return;
    }

    const updates: Record<string, any> = {};

    switch (key) {
      case "sound":
        updates.soundEnabled = value === "true" || value === "on";
        break;
      case "poll":
        updates.pollInterval = parseInt(value) * 1000; // Convert to ms
        break;
      case "save":
        updates.saveToFile = value;
        break;
      default:
        console.log("❌ Unknown config option: " + key);
        console.log("\nAvailable options:");
        console.log("  sound <true|false>  - Enable/disable sound alerts");
        console.log("  poll <seconds>      - Set poll interval");
        console.log("  save <file>         - Set auto-save file\n");
        return;
    }

    api.updateConfig(updates);
    console.log("✅ " + key + " set to: " + value + "\n");
    return;
  }

  // Display all config
  const config = api.getConfig();
  console.log("Current configuration:");
  console.log("  API URL: " + config.apiUrl);
  console.log("  Sound alerts: " + (config.soundEnabled ? "enabled" : "disabled"));
  console.log("  Poll interval: " + (config.pollInterval / 1000) + " seconds");
  console.log("  Auto-save file: " + (config.saveToFile || "not set"));
  console.log("  Monitors: " + config.monitors.length);
  console.log("\nTo change:");
  console.log("  alpha-term config --set sound true");
  console.log("  alpha-term config --set poll 10");
  console.log("  alpha-term config --set save tweets.json");
  console.log("  alpha-term config --reset\n");
}
