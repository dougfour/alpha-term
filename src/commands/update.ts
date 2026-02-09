import { checkForUpdates, CURRENT_VERSION } from "../lib/updater.js";
import { execSync } from "child_process";

const GREEN = "\x1b[92m";
const CYAN = "\x1b[96m";
const YELLOW = "\x1b[93m";
const RED = "\x1b[91m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

export async function updateCommand(): Promise<void> {
  const displayVersion = CURRENT_VERSION.includes("VERSION") ? "dev" : CURRENT_VERSION;
  console.log(`\n${CYAN}Current version: ${BOLD}${displayVersion}${RESET}`);
  console.log(`${YELLOW}Checking for updates...${RESET}\n`);

  try {
    const result = await checkForUpdates(true);

    if (!result.hasUpdate) {
      console.log(`${GREEN}✓ You're on the latest version (${result.latestVersion || displayVersion})${RESET}\n`);
      return;
    }

    console.log(`${YELLOW}Update available: ${displayVersion} → ${result.latestVersion}${RESET}`);
    console.log(`${CYAN}Installing update...${RESET}\n`);

    execSync("curl -fSL https://neonalpha.me/install | bash", {
      stdio: "inherit",
    });
  } catch (error: any) {
    console.error(`\n${RED}Update failed.${RESET}`);
    console.log(`${YELLOW}You can manually update by running:${RESET}`);
    console.log(`   ${CYAN}curl -sL https://neonalpha.me/install | bash${RESET}\n`);
  }
}
