import { api } from "../lib/api.js";
import * as readline from "readline";

export async function loginCommand(apiKey?: string): Promise<void> {
  console.log("\n🔐 NeonAlpha CLI Login\n");

  // Get API key from args or prompt
  let key = apiKey;
  
  if (!key) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    key = await new Promise<string>((resolve) => {
      rl.question("Enter your NeonAlpha API key: ", (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  if (!key) {
    console.log("❌ No API key provided.\n");
    console.log("To get your API key:");
    console.log("1. Visit https://neonalpha.me/dashboard");
    console.log("2. Go to Settings > API Keys");
    console.log("3. Create a new API key\n");
    return;
  }

  // Save token first so validateSubscription can use it
  await api.saveToken(key);

  // Validate subscription
  console.log("Validating subscription...");
  const subscription = await api.validateSubscription();

  if (!subscription.valid) {
    console.log("❌ Access denied.\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(subscription.error);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    // Clear invalid token
    await api.saveToken("");
    return;
  }

  console.log(`✅ Login successful!`);
  console.log(`   Tier: ${subscription.tier?.toUpperCase()}`);
  if (subscription.expiresAt) {
    console.log(`   Expires: ${subscription.expiresAt}`);
  }
  console.log("\nYou're now ready to use alpha-term!");
  console.log("\nNext steps:");
  console.log("  • Run 'alpha-term add @elonmusk' to monitor an account");
  console.log("  • Run 'alpha-term watch' to start monitoring");
  console.log("  • Run 'alpha-term list' to see your monitors\n");
}
