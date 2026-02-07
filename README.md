# Alpha-Term

Professional CLI for NeonAlpha terminal alerts - Monitor Twitter/X accounts in real-time from your terminal.

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ██████╗ ██╗   ██╗██████╗ ███████╗██████╗ ██╗  ██╗ █████╗  ██████╗ ║
║  ██╔═══██╗██║   ██║██╔══██╗██╔════╝██╔══██╗██║  ██║██╔══██╗██╔════╝ ║
║  ██║   ██║██║   ██║██████╔╝█████╗  ██████╔╝███████║███████║██║  ███╗║
║  ██║   ██║██║   ██║██╔══██╗██╔══╝  ██╔══██╗██╔══██║██╔══██║██║   ██║║
║  ╚██████╔╝╚██████╔╝██║  ██║███████╗██║  ██║██║  ██║██║  ██║╚██████╔╝║
║   ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ║
║                                                                   ║
║                    <<< TERMINAL ALERTS FOR NEON ALPHA >>>          ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

## 🚀 Quick Install

```bash
curl -sL https://neonalpha.me/install | bash
```

**That's it!** Binary installs automatically. Run `alpha-term` to start.

---

## 📖 Getting Started

### Step 1: Subscribe

Get Pro or Elite at https://neonalpha.me

### Step 2: Get API Key

https://neonalpha.me/dashboard/settings/api-keys

### Step 3: Login

```bash
alpha-term login YOUR_API_KEY
```

### Step 4: Add Accounts

```bash
alpha-term add @elonmusk
alpha-term add @jack --keyword bitcoin
```

### Step 5: Start Monitoring

```bash
alpha-term watch
```

---

## 💻 Commands

### `alpha-term` (Default)

Run without arguments to see help:

```bash
alpha-term
```

Shows welcome message and available commands.

---

### `alpha-term watch`

Monitor tweets in real-time.

```bash
# Basic usage
alpha-term watch

# With sound alerts
alpha-term watch --sound

# Filter by keyword
alpha-term watch --keyword bitcoin

# Filter by handle
alpha-term watch --handle @elonmusk

# Save tweets to file
alpha-term watch --save tweets.jsonl

# JSON output (for scripting)
alpha-term watch --json

# Try demo mode first
alpha-term watch --test
```

**Options:**

| Flag | Description |
|------|-------------|
| `-s, --sound` | Play sound on new tweets |
| `--save <file>` | Save tweets to JSONL file |
| `-k, --keyword` | Filter by keyword in tweet |
| `-h, --handle` | Filter by specific handle |
| `-j, --json` | Output as JSON |
| `-t, --test` | Demo mode |

---

### `alpha-term login [apiKey]`

Login with your NeonAlpha API key.

```bash
# Interactive (prompts for key)
alpha-term login

# With key as argument
alpha-term login YOUR_API_KEY
```

Get your API key: https://neonalpha.me/dashboard/settings/api-keys

---

### `alpha-term add <handle>`

Add a Twitter account to monitor.

```bash
# Add account
alpha-term add @elonmusk

# Add with keyword filter
alpha-term add @elonmusk --keyword bitcoin
```

---

### `alpha-term list`

List your monitored accounts.

```bash
alpha-term list
```

---

### `alpha-term remove <handle>`

Remove a monitored account.

```bash
alpha-term remove @elonmusk
```

---

### `alpha-term config`

Configure alpha-term settings.

```bash
# View current config
alpha-term config

# Enable sound
alpha-term config --set sound true

# Set poll interval (seconds)
alpha-term config --set poll 30

# Set auto-save file
alpha-term config --set save tweets.jsonl

# Reset to defaults
alpha-term config --reset
```

---

### `alpha-term test`

Run in demo mode with a simulated tweet.

```bash
alpha-term test
```

---

### `alpha-term update`

Update alpha-term to the latest version.

```bash
alpha-term update
```

---

### `alpha-term check`

Check for updates without installing.

```bash
alpha-term check
```

---

## 🔧 Installation Details

- **Install location:** `/usr/local/bin` (in PATH by default)
- **Config:** `~/.config/alpha-term/config.json`
- **Token:** `~/.config/alpha-term/token`
- **Cache:** `~/.cache/alpha-term/`

---

## 🖥️ Supported Platforms

| Platform | Architecture | Status |
|----------|--------------|--------|
| macOS | Apple Silicon (arm64) | ✅ |
| macOS | Intel (x64) | ✅ |
| Linux | x64 | ✅ |
| Windows | x64 | ⚠️ WSL recommended |

---

## 🔧 Troubleshooting

### "Command not found"

Restart your terminal, or run:

```bash
source ~/.zshrc  # or ~/.bashrc
```

### Login fails

1. Verify API key at https://neonalpha.me/dashboard/settings/api-keys
2. Ensure you have Pro or Elite subscription
3. Free tier doesn't include CLI access

### No alerts appearing

```bash
# Verify monitors are configured
alpha-term list

# Try demo mode
alpha-term test

# Check config
alpha-term config
```

---

## 🔧 Environment Variables

| Variable | Description |
|----------|-------------|
| `NO_UPDATE_CHECK=1` | Disable update checks |
| `ALPHA_TERM_API_URL` | Override API URL (dev only) |

---

## 📦 Alternative Install

### npm

```bash
npm install -g alpha-term
```

### Build from Source

```bash
git clone https://github.com/dougfour/alpha-term.git
cd alpha-term
npm install
npm run dev watch --test
```

---

## 📄 License

MIT

---

**Questions?** https://neonalpha.me/discord
