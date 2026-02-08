# Alpha-Term

Professional CLI for NeonAlpha terminal alerts - Monitor Twitter/X accounts in real-time from your terminal.

## Quick Install

```bash
curl -sL https://neonalpha.me/install | bash
```

## Getting Started

### 1. Subscribe

Get Pro or Elite at https://neonalpha.me

### 2. Set a Password

If you signed up with Google, set a password at:
https://neonalpha.me/dashboard/settings

(This password also works to login on the website alongside Google login.)

### 3. Login

```bash
alpha-term login
```

Enter your NeonAlpha email and password. Tokens refresh automatically.

### 4. Watch

```bash
alpha-term watch
```

That's it. Alerts from your NeonAlpha watch list appear in real-time.

---

## Commands

| Command | Description |
|---------|-------------|
| `alpha-term login` | Login with email/password |
| `alpha-term watch` | Monitor tweets in real-time |
| `alpha-term watch --sound` | Watch with sound alerts |
| `alpha-term watch --keyword btc` | Filter by keyword |
| `alpha-term watch --handle @user` | Filter by handle |
| `alpha-term watch --save tweets.txt` | Save tweets to file |
| `alpha-term watch --json` | JSON output (for scripting) |
| `alpha-term watch --test` | Demo mode |
| `alpha-term list` | Show recent alerts |
| `alpha-term test` | Test with simulated tweet |
| `alpha-term config` | View/edit settings |
| `alpha-term update` | Update to latest version |
| `alpha-term check` | Check for updates |

---

## How It Works

- Your NeonAlpha watch list is managed on the website
- The CLI pulls alerts for all your watched accounts via the API
- Polls every 30 seconds (configurable: `alpha-term config --set poll 10`)
- Access tokens auto-refresh using the stored refresh token (7 day expiry)

---

## Platforms

| Platform | Architecture | Status |
|----------|--------------|--------|
| macOS | Apple Silicon (arm64) | Supported |
| macOS | Intel (x64) | Supported |
| Linux | x64 | Supported |
| Windows | x64 | WSL recommended |

## Config

- **Config dir:** `~/.alpha-term/`
- **Token:** `~/.alpha-term/token` (JSON with access + refresh tokens)
- **Settings:** `~/.alpha-term/config.json`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NO_UPDATE_CHECK=1` | Disable update checks |
| `ALPHA_TERM_API_URL` | Override API URL (dev only) |

---

## Troubleshooting

**"Command not found"** - Restart terminal or `source ~/.zshrc`

**Login fails** - Ensure Pro/Elite subscription. If you use Google login, set a password first at https://neonalpha.me/dashboard/settings

**No alerts** - Alerts come from your NeonAlpha watch list. Add accounts on the website, then `alpha-term watch`.

---

## License

MIT

**Questions?** https://neonalpha.me/discord

---

## Developer Notes (for Claude Code)

### Architecture

- **CLI**: TypeScript compiled to standalone binary via `bun build --compile`
- **API**: FastAPI at `https://api.neonalpha.me/api/v1` (neonalpha-cloud project on Railway)
- **Auth**: Email/password login → API returns access_token (30min) + refresh_token (7 days). Auto-refresh on 401 via axios interceptor.
- **Alerts**: `GET /api/v1/alerts` returns all alerts for the authenticated user's server-side watch list. No local monitor config needed.
- **Config dir**: `~/.alpha-term/` (config.json + token file as JSON)
- **CI**: GitHub Actions two-job pipeline: build matrix (4 platforms) → single release job
- **Version injection**: `{{VERSION}}` placeholder in cli.ts replaced by `perl -i -pe` using `GITHUB_REF_NAME`
- **Install delivery**: `curl -sL https://neonalpha.me/install | bash` — install.sh lives in neonalpha-cloud/web/public/, served via Next.js rewrite

### API Response Format

```
GET /api/v1/alerts?limit=50
Authorization: Bearer <access_token>

Returns: [{ id, monitor_id, tweet_id, tweet_text, author_handle, author_name, author_avatar, created_at }]
```

```
POST /api/v1/auth/login  (form-encoded: username=email, password=password)
Returns: { access_token, refresh_token, token_type }
```

```
POST /api/v1/auth/refresh  (JSON: { refresh_token })
Returns: { access_token, refresh_token, token_type }
```

```
GET /api/v1/auth/me
Returns: { id, email, is_active, is_verified, telegram_connected, subscription_tier }
```

### Key Files

| File | Purpose |
|------|---------|
| `src/cli.ts` | CLI entry point, auth gating, command routing |
| `src/lib/api.ts` | API client with auto-refresh interceptor |
| `src/commands/watch.ts` | Live polling with shown_ids tracking |
| `src/commands/login.ts` | Email/password login flow |
| `.github/workflows/release.yml` | CI: build matrix → release |

### Resolved Issues (v1.0.26–v1.0.32)

| Version | Fix |
|---------|-----|
| v1.0.26 | CI pipeline rewrite (race conditions, version injection, cross-compile) |
| v1.0.27 | Login command blocked by its own auth check |
| v1.0.28 | Wrong API base URL + config dir mismatch |
| v1.0.29 | Stale config file overriding hardcoded API URL |
| v1.0.30 | Watch command: wrong field names, wrong params, monitor-based filtering removed |
| v1.0.31 | Added refresh token storage + auto-refresh on 401 |
| v1.0.32 | Email/password login (no more raw JWT pasting) |

### Next Steps

- [ ] **Password visibility**: Hide password input during `alpha-term login` (need to disable terminal echo)
- [ ] **Google OAuth users**: Add "Set CLI Password" button/flow on neonalpha.me dashboard settings page so users know they need one
- [ ] **Long-lived API keys**: Add API key generation in dashboard for Elite tier (TODO in neonalpha-cloud). Would let users skip email/password entirely
- [ ] **Token expiry UX**: Show friendly message when refresh token expires (7 days) instead of generic error
- [ ] **Subscription tier in watch banner**: Show "PRO" or "ELITE" in the watch mode header
- [ ] **Remove unused commands**: `add` and `remove` commands still manage local monitors that aren't used. Either remove them or repurpose for client-side filtering
- [ ] **Rate limit handling**: Add retry-after logic for 429 responses during polling
- [ ] **npm publish**: Package.json still at version 1.0.0, npm install path is stale

### CI Commands

```bash
# Push new version
git add . && git commit -m "description" && git push origin main
git tag v1.0.X && git push origin v1.0.X

# Check build
gh run list --repo dougfour/alpha-term
```

### Repo

https://github.com/dougfour/alpha-term — Local: `/home/greenman/projects/alpha-term-retro/`
