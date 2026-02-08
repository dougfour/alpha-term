import { api } from "../lib/api.js";
import { format } from "date-fns";

export async function listCommand(): Promise<void> {
  // Check subscription first
  const subscription = await api.validateSubscription();

  if (!subscription.valid) {
    console.log("\n❌ " + subscription.error + "\n");
    return;
  }

  console.log("\n📋 Recent Alerts\n");

  try {
    const alerts = await api.getAlerts(20);

    if (alerts.length === 0) {
      console.log("  No alerts yet.");
      console.log("  Alerts will appear here once monitored accounts tweet.\n");
      return;
    }

    for (const alert of alerts) {
      let timestamp: string;
      try {
        timestamp = format(new Date(alert.created_at), "MMM d HH:mm");
      } catch {
        timestamp = alert.created_at;
      }
      const text = alert.tweet_text.length > 60
        ? alert.tweet_text.substring(0, 57) + "..."
        : alert.tweet_text;
      console.log(`  @${alert.author_handle.padEnd(18)} ${timestamp.padEnd(14)} ${text}`);
    }

    console.log(`\n  Total: ${alerts.length} alert(s)\n`);
  } catch (error) {
    console.error("Error fetching alerts:", error instanceof Error ? error.message : "Unknown error");
  }
}
