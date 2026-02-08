import { Alert, api } from "../lib/api.js";
import { format } from "date-fns";

export async function testCommand(): Promise<void> {
  console.log("\n🧪 Alpha-Term Test Mode\n");

  // Check if logged in
  const token = await api.loadToken();
  if (!token) {
    console.log("⚠️  Not logged in. Running in demo mode.\n");
  } else {
    console.log("🔐 Validating subscription...");
    const subscription = await api.validateSubscription();
    
    if (!subscription.valid) {
      console.log("❌ " + subscription.error + "\n");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("Note: This is expected if your subscription is inactive.");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    } else {
      console.log(`✅ ${subscription.tier?.toUpperCase()} subscription active\n`);
    }
  }

  // Show current config
  const config = api.getConfig();
  console.log("Current config:");
  console.log(`  Sound: ${config.soundEnabled ? "on" : "off"}`);
  console.log(`  Poll interval: ${config.pollInterval / 1000}s`);
  console.log(`  Save to file: ${config.saveToFile || "not set"}\n`);

  // Display demo tweet
  const demoAlert: Alert = {
    id: "demo-1234567890",
    monitor_id: "demo-monitor",
    tweet_id: "1234567890",
    tweet_text: "🚀 $BTC showing strong momentum. Accumulation phase continuing. Watch for breakout above $76K. The bull run is just getting started. #bitcoin #crypto",
    author_handle: "elonmusk",
    author_name: "Elon Musk",
    author_avatar: "",
    created_at: new Date().toISOString(),
  };

  console.log("📢 Demo tweet preview:\n");
  console.log(`🔔 @${demoAlert.author_handle} ${format(new Date(demoAlert.created_at), "MMM d, yyyy HH:mm:ss")}`);
  console.log("─".repeat(75));

  // Word wrap
  const maxWidth = 75;
  const words = demoAlert.tweet_text.split(" ");
  let line = "";

  for (const word of words) {
    if ((line + " " + word).trim().length > maxWidth) {
      console.log(line);
      line = word;
    } else {
      line = line ? line + " " + word : word;
    }
  }
  console.log(line);
  console.log("");

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Test complete! alpha-term CLI is working correctly.");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}
