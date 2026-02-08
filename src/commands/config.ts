import { api } from "../lib/api.js";

const GREEN = "\x1b[92m";
const CYAN = "\x1b[96m";
const YELLOW = "\x1b[93m";
const RED = "\x1b[91m";
const RESET = "\x1b[0m";

interface ConfigOptions {
  set?: string;
  get?: string;
  reset?: boolean;
}

export async function configCommand(options: ConfigOptions): Promise<void> {
  console.log(`\n${CYAN}Alpha-Term Configuration${RESET}\n`);

  // Reset config
  if (options.reset) {
    api.updateConfig({
      soundEnabled: false,
      saveToFile: undefined,
    });
    console.log(`${GREEN}Configuration reset to defaults.${RESET}\n`);
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
    // Commander.js captures <key> <value> as an array
    const key = Array.isArray(options.set) ? options.set[0] : options.set.split(" ")[0];
    const value = Array.isArray(options.set) ? options.set[1] : options.set.split(" ")[1];

    if (!key || value === undefined) {
      console.log(`${RED}Usage: alpha-term config --set <key> <value>${RESET}\n`);
      return;
    }

    const updates: Record<string, any> = {};

    switch (key) {
      case "sound":
        updates.soundEnabled = value === "true" || value === "on";
        break;
      case "save":
        updates.saveToFile = value;
        break;
      default:
        console.log(`${RED}Unknown config option: ${key}${RESET}`);
        console.log(`\nAvailable options:`);
        console.log(`  ${GREEN}sound${RESET} <true|false>  - Enable/disable sound alerts`);
        console.log(`  ${GREEN}save${RESET} <file>         - Set auto-save file\n`);
        return;
    }

    api.updateConfig(updates);
    console.log(`${GREEN}${key} set to: ${value}${RESET}\n`);
    return;
  }

  // Display all config
  const config = api.getConfig();
  console.log("Current configuration:");
  console.log(`  Sound alerts: ${config.soundEnabled ? "enabled" : "disabled"}`);
  console.log(`  Auto-save file: ${config.saveToFile || "not set"}`);
  console.log(`\nTo change:`);
  console.log(`  ${GREEN}alpha-term config --set sound true${RESET}`);
  console.log(`  ${GREEN}alpha-term config --set save tweets.json${RESET}`);
  console.log(`  ${GREEN}alpha-term config --reset${RESET}\n`);
}
