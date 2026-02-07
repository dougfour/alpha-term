#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8")
);
const version = packageJson.version;

// Version check
import { checkForUpdates, CURRENT_VERSION } from "./lib/updater.js";

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

import { watchCommand } from "./commands/watch.js";
import { loginCommand } from "./commands/login.js";
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
  .version(version);

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
  .command("login [apiKey]")
  .description("Login with your NeonAlpha API key")
  .action(async (apiKey) => {
    await loginCommand(apiKey);
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
