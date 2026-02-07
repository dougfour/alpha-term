# Alpha-Term

Professional CLI for NeonAlpha terminal alerts.

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

## Install

### One-Line Install (Recommended)

```bash
curl -sL https://neonalpha.me/install | bash
```

This downloads the latest binary for your platform and installs it to `~/.local/bin`.

### npm (Alternative)

```bash
npm install -g alpha-term
```

## Requirements

- **macOS** (Intel or Apple Silicon)
- **Linux** (x64)
- **Windows** (x64)
- **NeonAlpha Subscription** - Pro or Elite required for full features

## Quick Start

```bash
# Login with your NeonAlpha API key
alpha-term login YOUR_API_KEY

# Add a Twitter account to monitor
alpha-term add @elonmusk

# Start monitoring
alpha-term watch
```

## Commands

### `alpha-term watch` (Default)

Monitor tweets in real-time.

```bash
# Monitor all accounts
alpha-term watch

# Specific account only
alpha-term @elonmusk

# With sound alerts
alpha-term watch --sound

# Auto-save tweets to file
alpha-term watch --save tweets.json

# Filter by keyword
alpha-term watch --keyword bitcoin

# Filter by handle
alpha-term watch --handle @elonmusk

# JSON output (for scripting)
alpha-term watch --json

# Test mode (demo tweet)
alpha-term watch --test
```

**Flags:**

| Flag | Description |
|------|-------------|
| `-s, --sound` | Play sound on new tweets |
| `--save <file>` | Save tweets to file (JSONL format) |
| `-k, --keyword` | Filter by keyword in tweet text |
| `-h, --handle` | Filter by specific Twitter handle |
| `-j, --json` | Output as JSON instead of formatted text |
| `-t, --test` | Test mode with simulated tweet |

---

### `alpha-term login [apiKey]`

Login with your NeonAlpha API key.

```bash
# Interactive login (prompts for API key)
alpha-term login

# With API key as argument
alpha-term login YOUR_API_KEY
```

**Get your API key:** https://neonalpha.me/dashboard/settings/api-keys

---

### `alpha-term list`

List all your monitored accounts.

```bash
alpha-term list
```

**Output:**

```
📋 Your Monitors

  Handle              Keyword
  ──────────────────  ──────────────────
  @elonmusk          bitcoin

  Total: 1 monitor(s)

Options:
  Sound alerts: disabled
  Poll interval: 30s
```

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

### `alpha-term remove <handle>`

Remove a monitored account.

```bash
alpha-term remove @elonmusk
```

---

### `alpha-term config`

Configure alpha-term settings.

```bash
# Enable sound alerts
alpha-term config --set sound true

# Set poll interval (seconds)
alpha-term config --set poll 10

# Set auto-save file
alpha-term config --set save tweets.json

# View current config
alpha-term config

# Reset to defaults
alpha-term config --reset
```

---

### `alpha-term test`

Run in test mode with a simulated tweet.

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

Check for available updates without installing.

```bash
alpha-term check
```

---

## Installation Directory

The CLI stores data in:

- **Config:** `~/.alpha-term/config.json`
- **Token:** `~/.alpha-term/token`
- **Cache:** `~/.alpha-term/`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NO_UPDATE_CHECK=1` | Disable update checks on startup |
| `ALPHA_TERM_API_URL` | Override API URL (for development) |

## Troubleshooting

### "Command not found" after install

Add to your PATH:

```bash
# For bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# For zsh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Login fails

- Verify your API key at https://neonalpha.me/dashboard/settings/api-keys
- Ensure your subscription is Pro or Elite (Free tier doesn't include CLI access)

### No alerts appearing

- Run `alpha-term list` to verify monitors are configured
- Check your Telegram for alerts (if using web dashboard)
- Try `alpha-term test` to verify CLI is working

## For Developers

### Building from Source

```bash
# Clone the repo
git clone https://github.com/dougfour/alpha-term.git
cd alpha-term

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run locally
npm run dev watch --test
```

### Building Binaries

```bash
# Build all platforms
npm run build:binaries

# Individual platforms
pkg . --targets node18-macos-arm64 --output bin/alpha-term-macos-arm64
pkg . --targets node18-macos-x64 --output bin/alpha-term-macos-x64
pkg . --targets node18-linux-x64 --output bin/alpha-term-linux-x64
pkg . --targets node18-windows-x64 --output bin/alpha-term-windows-x64.exe
```

### Creating a Release

```bash
# Bump version
npm version patch  # or minor, major

# Push tag
git push origin v1.0.0
```

GitHub Actions will automatically build and upload binaries.

## License

MIT

---

Made with ❤️ by Snake
