import { api } from "../lib/api.js";

export async function listCommand(): Promise<void> {
  // Check subscription first
  const subscription = await api.validateSubscription();
  
  if (!subscription.valid && subscription.tier === "free") {
    console.log("\n⚠️  Free tier detected.\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Alpha-Term CLI is available for Pro and Elite only.");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return;
  }

  const monitors = api.getMonitors();
  const config = api.getConfig();

  console.log("\n📋 Your Monitors\n");

  if (monitors.length === 0) {
    console.log("  No monitors configured.");
    console.log("  Run 'alpha-term add <handle>' to add one.\n");
    return;
  }

  // Display table
  console.log("  Handle              Keyword");
  console.log("  ──────────────────  ──────────────────");

  for (const monitor of monitors) {
    const keyword = monitor.keyword || "-";
    console.log("  " + monitor.handle.padEnd(18) + " " + keyword);
  }

  console.log("\n  Total: " + monitors.length + " monitor(s)\n");
  
  console.log("Options:");
  console.log("  Sound alerts: " + (config.soundEnabled ? "enabled" : "disabled"));
  console.log("  Poll interval: " + (config.pollInterval / 1000) + "s\n");
}
