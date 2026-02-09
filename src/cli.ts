#!/usr/bin/env node

import { Command } from "commander";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

// Version - replaced at build time
const VERSION = "{{VERSION}}";

// Check if user is logged in
const isLoggedIn = () => {
  const configDir = join(process.env.HOME || "", ".alpha-term");
  const tokenFile = join(configDir, "token");
  if (!existsSync(tokenFile)) return false;
  const content = readFileSync(tokenFile, "utf-8").trim();
  if (!content) return false;
  // Check JSON format
  try {
    const data = JSON.parse(content);
    return !!data.access_token;
  } catch {
    // Legacy raw token format
    return content.length > 10;
  }
};

// Show welcome message for new users
const showWelcome = () => {
  console.log();
  console.log(`\x1b[96m╔═╗\x1b[0m  \x1b[96m╦\x1b[0m    \x1b[96m╔═╗\x1b[0m  \x1b[96m╦ ╦\x1b[0m  \x1b[96m╔═╗\x1b[0m    \x1b[93m═╦═\x1b[0m  \x1b[93m╔═╗\x1b[0m  \x1b[93m╦═╗\x1b[0m  \x1b[93m╔╦╗\x1b[0m`);
  console.log(`\x1b[96m╠═╣\x1b[0m  \x1b[96m║\x1b[0m    \x1b[96m╠═╝\x1b[0m  \x1b[96m╠═╣\x1b[0m  \x1b[96m╠═╣\x1b[0m     \x1b[93m║\x1b[0m   \x1b[93m╠═\x1b[0m   \x1b[93m╠╦╝\x1b[0m  \x1b[93m║║║\x1b[0m`);
  console.log(`\x1b[96m╩ ╩\x1b[0m  \x1b[96m╩═╝\x1b[0m  \x1b[96m╩\x1b[0m    \x1b[96m╩ ╩\x1b[0m  \x1b[96m╩ ╩\x1b[0m     \x1b[93m╩\x1b[0m   \x1b[93m╚═╝\x1b[0m  \x1b[93m╩╚═\x1b[0m  \x1b[93m╩ ╩\x1b[0m`);
  console.log(`\x1b[92m══════════════════════════════════════════════════\x1b[0m`);
  console.log(`\x1b[95m       <<< NEON ALPHA TERMINAL ALERTS >>>\x1b[0m`);

  console.log(`
\x1b[93mGETTING STARTED:\x1b[0m

   1. Subscribe at \x1b[96mhttps://neonalpha.me\x1b[0m (Pro or Elite)
   2. Run: \x1b[92malpha-term login\x1b[0m
   3. Run: \x1b[92malpha-term watch\x1b[0m

\x1b[91mNOT LOGGED IN\x1b[0m

   Subscribe: \x1b[96mhttps://neonalpha.me/pricing\x1b[0m
`);
};

// Show login prompt when not logged in
const showLoginPrompt = () => {
  console.log(`
\x1b[91mNOT LOGGED IN\x1b[0m

   You need to login first.

   1. Subscribe at \x1b[96mhttps://neonalpha.me\x1b[0m (Pro or Elite)
   2. Run: \x1b[92malpha-term login\x1b[0m
`);
};

// Version check
import { checkForUpdates } from "./lib/updater.js";

// Check for updates (non-blocking, shows curl command if update available)
const showUpdateNotice = async () => {
  try {
    const result = await checkForUpdates();
    if (result.hasUpdate) {
      console.log(`\x1b[93mUpdate available: ${VERSION} \u2192 ${result.latestVersion}\x1b[0m`);
      console.log(`   Run: \x1b[96malpha-term update\x1b[0m\n`);
    }
  } catch {
    // Silent fail
  }
};

// Show welcome for new users when running without args
if (process.argv.length <= 2 && !isLoggedIn()) {
  showWelcome();
  await showUpdateNotice();
  process.exit(0);
}

// Show login prompt for any command if not logged in
const command = process.argv[2] || "";
const noAuthCommands = ["--version", "-V", "--help", "-h", "login", "logout", "update"];
if (!isLoggedIn() && !noAuthCommands.includes(command)) {
  showLoginPrompt();
  process.exit(0);
}

import { watchCommand } from "./commands/watch.js";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { listCommand } from "./commands/list.js";
import { runCommand } from "./commands/run.js";
import { configCommand } from "./commands/config.js";
import { updateCommand } from "./commands/update.js";

const program = new Command();

program
  .name("alpha-term")
  .description("Professional CLI for NeonAlpha terminal alerts")
  .version(VERSION);

// Main watch command (default)
program
  .command("watch")
  .description("Monitor tweets in live mode")
  .option("-s, --sound", "Play sound on new tweets")
  .option("--save <file>", "Save tweets to file")
  .option("-k, --keyword <text>", "Filter by keyword")
  .option("-h, --handle <user>", "Filter by Twitter handle")
  .option("-j, --json", "Output as JSON")
  .option("-t, --test", "Run in test mode with simulated tweet")
  .action(async (options) => {
    await watchCommand(options);
  });

// Authentication
program
  .command("login")
  .description("Login with your NeonAlpha email and password")
  .action(async () => {
    await loginCommand();
  });

program
  .command("logout")
  .description("Log out of alpha-term")
  .action(async () => {
    await logoutCommand();
  });

// View recent alerts
program
  .command("run")
  .description("View recent alerts")
  .option("-k, --keyword <text>", "Filter by keyword")
  .option("-h, --handle <user>", "Filter by Twitter handle")
  .option("-j, --json", "Output as JSON")
  .option("-l, --limit <number>", "Number of alerts to show", "20")
  .action(async (options) => {
    await runCommand({ ...options, limit: parseInt(options.limit) });
  });

// Account management info
program
  .command("list")
  .description("Show how to manage your watch list")
  .action(async () => {
    await listCommand();
  });

// Configuration
program
  .command("config [key] [value]")
  .description("View or change settings (sound, save, limit)")
  .option("--reset", "Reset all config to defaults")
  .action(async (key, value, options) => {
    await configCommand(key, value, options);
  });

// Update
program
  .command("update")
  .description("Check for updates and install the latest version")
  .action(async () => {
    await updateCommand();
  });

// Handle no command — show banner, commands, and update check
if (process.argv.length <= 2) {
  console.log();
  console.log(`\x1b[96m╔═╗\x1b[0m  \x1b[96m╦\x1b[0m    \x1b[96m╔═╗\x1b[0m  \x1b[96m╦ ╦\x1b[0m  \x1b[96m╔═╗\x1b[0m    \x1b[93m═╦═\x1b[0m  \x1b[93m╔═╗\x1b[0m  \x1b[93m╦═╗\x1b[0m  \x1b[93m╔╦╗\x1b[0m`);
  console.log(`\x1b[96m╠═╣\x1b[0m  \x1b[96m║\x1b[0m    \x1b[96m╠═╝\x1b[0m  \x1b[96m╠═╣\x1b[0m  \x1b[96m╠═╣\x1b[0m     \x1b[93m║\x1b[0m   \x1b[93m╠═\x1b[0m   \x1b[93m╠╦╝\x1b[0m  \x1b[93m║║║\x1b[0m`);
  console.log(`\x1b[96m╩ ╩\x1b[0m  \x1b[96m╩═╝\x1b[0m  \x1b[96m╩\x1b[0m    \x1b[96m╩ ╩\x1b[0m  \x1b[96m╩ ╩\x1b[0m     \x1b[93m╩\x1b[0m   \x1b[93m╚═╝\x1b[0m  \x1b[93m╩╚═\x1b[0m  \x1b[93m╩ ╩\x1b[0m`);
  console.log(`\x1b[92m══════════════════════════════════════════════════\x1b[0m`);
  console.log(`\x1b[95m       <<< NEON ALPHA TERMINAL ALERTS >>>\x1b[0m`);
  console.log();
  console.log(`  \x1b[92malpha-term watch\x1b[0m           Live monitoring`);
  console.log(`  \x1b[92malpha-term run\x1b[0m             View recent alerts`);
  console.log(`  \x1b[92malpha-term login\x1b[0m           Login with email/password`);
  console.log(`  \x1b[92malpha-term logout\x1b[0m          Log out`);
  console.log(`  \x1b[92malpha-term config\x1b[0m          Configure settings`);
  console.log(`  \x1b[92malpha-term list\x1b[0m            Manage watch list`);
  console.log(`  \x1b[92malpha-term update\x1b[0m          Check for updates`);
  console.log(`  \x1b[92malpha-term --version\x1b[0m       Show version`);
  console.log();
  await showUpdateNotice();
} else {
  program.parse();
}

export { program };
