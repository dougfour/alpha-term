import { api } from "../lib/api.js";

export async function removeCommand(handle: string): Promise<void> {
  // Check subscription first
  const subscription = await api.validateSubscription();
  
  if (!subscription.valid && subscription.tier === "free") {
    console.log("\n⚠️  Free tier detected.\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Alpha-Term CLI is available for Pro and Elite only.");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return;
  }

  // Normalize handle
  if (!handle.startsWith("@")) {
    handle = "@" + handle;
  }

  console.log("\n➖ Removing monitor: " + handle);

  const monitors = api.getMonitors();
  const exists = monitors.find((m) => m.handle === handle);

  if (!exists) {
    console.log("❌ Monitor not found.\n");
    return;
  }

  try {
    await api.removeMonitor(handle);
    console.log("✅ Monitor removed successfully!\n");
  } catch (error) {
    console.error("❌ Failed to remove monitor:", error instanceof Error ? error.message : "Unknown error");
  }
}
