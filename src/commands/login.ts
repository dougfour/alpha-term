import { api } from "../lib/api.js";
import * as readline from "readline";

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise<string>((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function loginCommand(apiKey?: string): Promise<void> {
  console.log("\n🔐 NeonAlpha CLI Login\n");

  // If a raw token was passed (legacy), save it directly
  if (apiKey) {
    await api.saveToken(apiKey);
    console.log("Validating...");
    const subscription = await api.validateSubscription();
    if (!subscription.valid) {
      console.log("❌ " + subscription.error + "\n");
      await api.saveToken("");
      return;
    }
    console.log(`✅ Login successful! Tier: ${subscription.tier?.toUpperCase()}\n`);
    return;
  }

  // Interactive email/password login
  const email = await prompt("Email: ");
  if (!email) {
    console.log("❌ No email provided.\n");
    return;
  }

  // Password input (note: visible in terminal - readline limitation)
  const password = await prompt("Password: ");
  if (!password) {
    console.log("❌ No password provided.\n");
    return;
  }

  console.log("\nLogging in...");

  try {
    const tokens = await api.login(email, password);

    api.saveTokens(tokens);

    // Validate subscription tier
    const subscription = await api.validateSubscription();

    if (!subscription.valid) {
      console.log("❌ " + subscription.error + "\n");
      return;
    }

    console.log(`\n✅ Login successful!`);
    console.log(`   Tier: ${subscription.tier?.toUpperCase()}`);
    console.log("   Token auto-refresh: enabled\n");
    console.log("You're now ready to use alpha-term!");
    console.log("\n  Run 'alpha-term watch' to start monitoring\n");
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 401) {
      console.log("\n❌ Incorrect email or password.\n");
    } else if (status === 429) {
      console.log("\n❌ Too many login attempts. Please wait a minute.\n");
    } else {
      console.log("\n❌ Login failed: " + (error?.response?.data?.detail || error?.message || "Unknown error") + "\n");
    }

    console.log("If you signed up with Google, set a password first at:");
    console.log("  https://neonalpha.me/dashboard/settings\n");
  }
}
