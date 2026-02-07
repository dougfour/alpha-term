import { api } from "../lib/api.js";

interface AddOptions {
  keyword?: string;
}

export async function addCommand(handle: string, options: AddOptions): Promise<void> {
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

  console.log("\n➕ Adding monitor: " + handle);

  try {
    await api.addMonitor(handle, options.keyword);
    console.log("✅ Monitor added successfully!\n");
    
    if (options.keyword) {
      console.log("   Filtering tweets containing: \"" + options.keyword + "\"");
    }
    
    console.log("\n  Next steps:");
    console.log("  • Run 'alpha-term watch' to start monitoring");
    console.log("  • Run 'alpha-term list' to verify\n");
  } catch (error) {
    console.error("❌ Failed to add monitor:", error instanceof Error ? error.message : "Unknown error");
  }
}
