import { existsSync, unlinkSync } from "fs";
import { join } from "path";

export async function logoutCommand(): Promise<void> {
  const tokenFile = join(process.env.HOME || "", ".alpha-term", "token");

  if (!existsSync(tokenFile)) {
    console.log("\nYou're not logged in.\n");
    return;
  }

  unlinkSync(tokenFile);
  console.log("\n✅ Logged out. Run 'alpha-term login' to sign in again.\n");
}
