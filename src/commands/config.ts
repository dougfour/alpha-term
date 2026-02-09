import { api } from "../lib/api.js";
import { GREEN, CYAN, YELLOW, RED, RESET, DIM } from "../lib/render.js";

export async function configCommand(key?: string, value?: string, options?: { reset?: boolean }): Promise<void> {
  console.log(`\n${CYAN}Alpha-Term Configuration${RESET}\n`);

  // Reset config
  if (key === "reset" || options?.reset) {
    api.updateConfig({
      soundEnabled: false,
      saveToFile: undefined,
      defaultLimit: undefined,
    });
    console.log(`${GREEN}Configuration reset to defaults.${RESET}\n`);
    return;
  }

  // No key — show current config
  if (!key) {
    const config = api.getConfig();
    console.log(`  Sound alerts:   ${config.soundEnabled ? GREEN + "on" + RESET : DIM + "off" + RESET}`);
    console.log(`  Auto-save:      ${config.saveToFile ? GREEN + config.saveToFile + RESET : DIM + "off" + RESET}`);
    console.log(`  Alert limit:    ${config.defaultLimit ? GREEN + config.defaultLimit + RESET : DIM + "20 (default)" + RESET}`);
    console.log();
    console.log(`  ${DIM}Examples:${RESET}`);
    console.log(`    ${GREEN}alpha-term config sound on${RESET}`);
    console.log(`    ${GREEN}alpha-term config save tweets.txt${RESET}`);
    console.log(`    ${GREEN}alpha-term config limit 50${RESET}`);
    console.log(`    ${GREEN}alpha-term config reset${RESET}`);
    console.log();
    return;
  }

  switch (key) {
    case "sound": {
      if (!value || !["on", "off"].includes(value)) {
        console.log(`${RED}Usage: alpha-term config sound on|off${RESET}\n`);
        return;
      }
      const enabled = value === "on";
      api.updateConfig({ soundEnabled: enabled });
      console.log(`${GREEN}Sound alerts: ${enabled ? "on" : "off"}${RESET}\n`);
      return;
    }

    case "save": {
      if (!value) {
        console.log(`${RED}Usage: alpha-term config save <file>|off${RESET}\n`);
        return;
      }
      if (value === "off") {
        api.updateConfig({ saveToFile: undefined });
        console.log(`${GREEN}Auto-save: off${RESET}\n`);
      } else {
        api.updateConfig({ saveToFile: value });
        console.log(`${GREEN}Auto-save: ${value}${RESET}\n`);
      }
      return;
    }

    case "limit": {
      if (!value) {
        console.log(`${RED}Usage: alpha-term config limit <number>|off${RESET}\n`);
        return;
      }
      if (value === "off") {
        api.updateConfig({ defaultLimit: undefined });
        console.log(`${GREEN}Alert limit: 20 (default)${RESET}\n`);
      } else {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1 || num > 50) {
          console.log(`${RED}Limit must be a number between 1 and 50.${RESET}\n`);
          return;
        }
        api.updateConfig({ defaultLimit: num });
        console.log(`${GREEN}Alert limit: ${num}${RESET}\n`);
      }
      return;
    }

    default:
      console.log(`${RED}Unknown setting: ${key}${RESET}\n`);
      console.log(`  Available settings:`);
      console.log(`    ${GREEN}sound${RESET} on|off        Enable/disable sound alerts`);
      console.log(`    ${GREEN}save${RESET}  <file>|off    Auto-save tweets to file`);
      console.log(`    ${GREEN}limit${RESET} <number>|off  Default alert count for 'run'`);
      console.log(`    ${GREEN}reset${RESET}               Reset all to defaults`);
      console.log();
  }
}
