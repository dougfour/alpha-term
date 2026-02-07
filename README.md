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

---

## 🔧 Developer Notes (for Claude Code)

### What We're Trying to Do

Build a standalone CLI binary (no Node.js/npm required) that:
1. Downloads pre-built binaries from GitHub Releases via curl installer
2. Shows welcome message on first run for new users
3. Handles login/subscription validation
4. Supports cross-platform builds (macOS arm64, macOS x64, Linux x64, Windows x64)

### What We've Done

1. **Switched from pkg to Bun bundler**
   - Bun compiles TypeScript natively, handles ESM imports
   - Standalone binary output via `bun build --compile`

2. **Version injection at build time**
   - Source has `const VERSION = "{{VERSION}}"`
   - CI pipeline replaces placeholder with actual tag before building
   - Used `perl -i -pe` for cross-platform compatibility (sed fails on macOS)

3. **GitHub Actions CI pipeline**
   - Two-job design: `build` (matrix across 4 platforms) → `release` (single job)
   - Build jobs upload artifacts, release job creates GitHub Release with all assets
   - Eliminates race conditions from multiple jobs finalizing the same release

4. **Welcome/onboarding message**
   - Shows when running `alpha-term` with no args AND not logged in
   - Prompts to subscribe, login, add accounts, start watching

5. **curl installer**
   - URL: https://neonalpha.me/install
   - Detects OS/arch, downloads appropriate binary from GitHub Releases
   - Installs to `~/.local/bin` (no sudo needed)

### Troubles We Had (resolved)

1. **CI Matrix Upload Race Conditions** (FIXED in v1.0.26)
   - Multiple jobs tried to create/finalize the same release simultaneously
   - Every CI run from v1.0.17-v1.0.25 showed `completed failure`
   - **Fix:** Split into two jobs — `build` (matrix, uploads artifacts) → `release` (single job, creates release with all assets)

2. **Version Injection Failures** (FIXED in v1.0.26)
   - `git describe --tags` failed in CI due to shallow clone with `--no-tags`
   - Shell operator precedence bug: `sed` only applied to fallback, not to `git describe` output
   - **Fix:** Use `GITHUB_REF_NAME` env var (set by GitHub Actions) instead of `git describe`
   - Version injection: `VERSION="${GITHUB_REF_NAME#v}"` — simple, reliable, no git needed

3. **macOS x64 built as arm64** (FIXED in v1.0.26)
   - Both macOS builds used `macos-latest` which is arm64
   - **Fix:** Use `macos-13` (Intel) for x64 builds

4. **--version/--help Requiring Login** (FIXED in v1.0.25)
   - **Fix:** Added `--version`, `-V`, `--help`, `-h`, `--test` to no-auth commands list

### Current Status

- ✅ CI pipeline: build (matrix) → release (single job), no race conditions
- ✅ Version injection via `GITHUB_REF_NAME` (no git describe needed)
- ✅ All 4 platforms build on correct architectures
- ✅ Welcome message triggers for new users
- ✅ `--version` and `--help` work without login

### Files of Interest

| File | Purpose |
|------|---------|
| `.github/workflows/release.yml` | CI pipeline (matrix + softprops) |
| `src/cli.ts` | CLI entry point with welcome/login logic |
| `install.sh` | curl installer (hosted on Railway) |
| `src/lib/updater.ts` | Version check and self-update |

### Commands for CI

```bash
# Test build locally
cd /home/greenman/projects/alpha-term-retro
bun install
bun build ./src/cli.ts --compile --outfile alpha-term-test

# Push new version
git add .
git commit -m "Description of changes"
git push origin main
git tag v1.0.X
git push origin v1.0.X

# Check build status
gh run list --repo dougfour/alpha-term

# Delete and recreate stale tag
git tag -d v1.0.X
git push origin :refs/tags/v1.0.X
git tag v1.0.X
git push origin v1.0.X
```

### GitHub Repo

https://github.com/dougfour/alpha-term

**Local path:** `/home/greenman/projects/alpha-term-retro/`
