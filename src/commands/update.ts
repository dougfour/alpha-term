import { performUpdate, checkForUpdates, CURRENT_VERSION } from "../lib/updater.js";

export async function updateCommand(): Promise<void> {
  console.log("\n🔄 Alpha-Term Update\n");
  
  console.log(`Current version: ${CURRENT_VERSION}`);
  console.log("");
  
  // Check for updates first
  console.log("Checking for updates...\n");
  
  const updateCheck = await checkForUpdates({ force: true, silent: true });
  
  if (!updateCheck.hasUpdate) {
    console.log(`✅ You're already running the latest version (${CURRENT_VERSION}).\n`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return;
  }
  
  console.log(`📦 Latest version: ${updateCheck.latestVersion}`);
  console.log("");
  
  // Perform update
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const result = await performUpdate();
  
  if (result.success) {
    console.log("");
    console.log(result.message);
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Run 'alpha-term --version' to verify the update.\n");
  } else {
    console.log("");
    console.log("❌ " + result.message);
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Please try again or download manually from:");
    console.log("  https://github.com/dougfour/alpha-term/releases\n");
  }
}

export async function checkCommand(): Promise<void> {
  console.log("\n🔍 Alpha-Term Version Check\n");
  
  console.log(`Current version: ${CURRENT_VERSION}`);
  console.log("");
  
  const result = await checkForUpdates({ force: true });
  
  if (result.hasUpdate) {
    console.log("📣 Update available!");
    console.log(result.message);
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } else {
    console.log("✅ You're running the latest version.\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }
}
