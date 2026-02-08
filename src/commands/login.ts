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

function promptPassword(question: string): Promise<string> {
  return new Promise<string>((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let password = "";
    const onData = (char: string) => {
      if (char === "\n" || char === "\r" || char === "\u0004") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(password);
      } else if (char === "\u0003") {
        // Ctrl+C
        stdin.setRawMode(false);
        process.exit();
      } else if (char === "\u007F" || char === "\b") {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
        }
      } else {
        password += char;
      }
    };
    stdin.on("data", onData);
  });
}

export async function loginCommand(): Promise<void> {
  console.log("\n🔐 NeonAlpha CLI Login\n");

  const email = await prompt("Email: ");
  if (!email) {
    console.log("❌ No email provided.\n");
    return;
  }

  const password = await promptPassword("Password: ");
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
