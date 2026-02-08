import { api } from "../lib/api.js";

const GREEN = "\x1b[92m";
const CYAN = "\x1b[96m";
const YELLOW = "\x1b[93m";
const RED = "\x1b[91m";
const RESET = "\x1b[0m";

export async function listCommand(): Promise<void> {
  const subscription = await api.validateSubscription();

  if (!subscription.valid) {
    console.log(`\n${RED}${subscription.error}${RESET}\n`);
    return;
  }

  console.log(`
${YELLOW}Your watch list is managed on the NeonAlpha dashboard.${RESET}

   ${CYAN}https://neonalpha.me/dashboard${RESET}

   Add or remove accounts there, then use:

   ${GREEN}alpha-term watch${RESET}    Live monitoring
   ${GREEN}alpha-term run${RESET}      View recent alerts
`);
}
