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
    console.log("To get your tokens:");
    console.log("1. Visit https://neonalpha.me and login");
    console.log("2. Open DevTools > Application > Local Storage");
    console.log("3. Copy access_token and refresh_token");
    console.log('4. Run: alpha-term login ACCESS_TOKEN --refresh REFRESH_TOKEN\n');
    return;
  }

  // Save token(s) - the refresh token will be picked up from --refresh flag
  // which is passed via the CLI option handler
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
  console.log("\nYou're now ready to use alpha-term!");
  console.log("\nNext steps:");
  console.log("  • Run 'alpha-term watch' to start monitoring");
  console.log("  • Run 'alpha-term list' to see recent alerts\n");
}

export async function loginWithTokens(accessToken: string, refreshToken?: string): Promise<void> {
  console.log("\n🔐 NeonAlpha CLI Login\n");

  api.saveTokens({
    access_token: accessToken,
    ...(refreshToken ? { refresh_token: refreshToken } : {}),
  });

  // Validate subscription
  console.log("Validating subscription...");
  const subscription = await api.validateSubscription();

  if (!subscription.valid) {
    console.log("❌ Access denied.\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(subscription.error);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    await api.saveToken("");
    return;
  }

  console.log(`✅ Login successful!`);
  console.log(`   Tier: ${subscription.tier?.toUpperCase()}`);
  if (refreshToken) {
    console.log("   Token auto-refresh: enabled");
  }
  console.log("\nYou're now ready to use alpha-term!");
  console.log("\nNext steps:");
  console.log("  • Run 'alpha-term watch' to start monitoring");
  console.log("  • Run 'alpha-term list' to see recent alerts\n");
}
