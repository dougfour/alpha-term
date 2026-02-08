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
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   <<< WELCOME TO ALPHA-TERM >>>                                  ║
║                                                                   ║
║   Terminal alerts for NeonAlpha - Monitor tweets in real-time     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

🚀 GETTING STARTED:

   1. Subscribe at https://neonalpha.me (Pro or Elite)
   2. Run: alpha-term login
   3. Run: alpha-term watch

⚠️  NOT LOGGED IN

   Subscribe: https://neonalpha.me/pricing
   Docs: https://neonalpha.me/docs

`);
};

// Show login prompt when not logged in
const showLoginPrompt = () => {
  console.log(`
⚠️  NOT LOGGED IN

   You need to login first.

   1. Subscribe at https://neonalpha.me (Pro or Elite)
   2. Run: alpha-term login

`);
};

// Version check
import { checkForUpdates } from "./lib/updater.js";

// Check for updates on startup (non-blocking)
const runVersionCheck = async () => {
  // Skip if running in test mode or NO_UPDATE_CHECK is set
  if (process.env.NO_UPDATE_CHECK === "1" || process.argv.includes("--test")) {
    return;
  }
  
  try {
    const result = await checkForUpdates({ silent: true });
    if (result.hasUpdate) {
      console.log("\n" + result.message + "\n");
    }
  } catch {
    // Silent fail
  }
};

// Run version check in background
runVersionCheck();

// Show welcome for new users when running without args
if (process.argv.length <= 2 && !isLoggedIn()) {
  showWelcome();
  process.exit(0);
}

// Show login prompt for any command if not logged in
const command = process.argv[2] || "";
const noAuthCommands = ["--version", "-V", "--help", "-h", "--test", "login", "logout"];
if (!isLoggedIn() && !noAuthCommands.includes(command)) {
  showLoginPrompt();
  process.exit(0);
}

import { watchCommand } from "./commands/watch.js";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { listCommand } from "./commands/list.js";
import { addCommand } from "./commands/add.js";
import { removeCommand } from "./commands/remove.js";
import { testCommand } from "./commands/test.js";
import { configCommand } from "./commands/config.js";
import { updateCommand, checkCommand } from "./commands/update.js";

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

// Monitor management
program
  .command("list")
  .description("List your monitored accounts")
  .action(async () => {
    await listCommand();
  });

program
  .command("add")
  .description("Add a Twitter account to monitor")
  .argument("<handle>", "Twitter handle (with or without @)")
  .option("-k, --keyword <text>", "Filter tweets by keyword")
  .action(async (handle, options) => {
    await addCommand(handle, options);
  });

program
  .command("remove")
  .description("Remove a Twitter account from monitoring")
  .argument("<handle>", "Twitter handle (with or without @)")
  .action(async (handle) => {
    await removeCommand(handle);
  });

// Configuration
program
  .command("config")
  .description("Configure alpha-term settings")
  .option("--set <key> <value>", "Set a config value")
  .option("--get <key>", "Get a config value")
  .option("--reset", "Reset all config to defaults")
  .action(async (options) => {
    await configCommand(options);
  });

// Test mode
program
  .command("test")
  .description("Test alpha-term with a simulated tweet")
  .action(async () => {
    await testCommand();
  });

// Update command
program
  .command("update")
  .description("Update alpha-term to the latest version")
  .action(async () => {
    await updateCommand();
  });

// Check command
program
  .command("check")
  .description("Check for available updates")
  .action(async () => {
    await checkCommand();
  });

// Handle no command (show help)
if (process.argv.length <= 2) {
  program.outputHelp();
} else {
  program.parse();
}

export { program };
