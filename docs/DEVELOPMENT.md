# Running Suture Coach Locally

Covers running the app on this machine, on a second machine (e.g. a MacBook), and
reaching it from a phone on the same Wi-Fi for real mobile testing.

## Prerequisites

- **Node.js ≥ 20.11** (this repo is developed against Node 24 — see `.nvmrc`; if you use
  `nvm`, run `nvm use` in the repo root to match). Next.js 16 itself requires ≥ 20.9;
  the slightly higher floor here is because `vitest.config.mts` uses
  `import.meta.dirname`, added in Node 20.11.
- `npm` (ships with Node).

The app itself has no OS-specific code — no hardcoded paths, no `process.platform`
branching, nothing Windows- or macOS-only. `npm install && npm run dev` is the same
on both.

## First-time setup (any machine)

```bash
npm install
cp .env.local.example .env.local   # then fill in ANTHROPIC_API_KEY
```

`.env.local` is gitignored — never commit it, and never paste a real key into a
chat/AI session; edit the file directly instead.

## `npm run dev` never spends real API credits — `npm run dev:real` does

Every Claude vision call costs money once a real `ANTHROPIC_API_KEY` is
configured, so this repo defaults to **fake analysis** no matter what's in
`.env.local`:

| Command | `USE_FAKE_ANALYSIS` | What it does |
|---|---|---|
| `npm run dev` | forced `true` | Returns canned fixture data (`lib/analysis/fixtures.ts`). Safe to run as often as you like — never calls the real API, even if `.env.local` has a real key configured. |
| `npm run dev:real` | forced `false` | Calls the real Claude API using the key in `.env.local`. Use this **only** when you deliberately want to see real feedback on real content. |

Both scripts set `USE_FAKE_ANALYSIS` via `cross-env` regardless of `.env.local`'s
own value, so there's no risk of forgetting to toggle a setting back — plain
`npm run dev` is always the safe default. `.env.local.example` also ships with
`USE_FAKE_ANALYSIS=true` as a belt-and-suspenders default, in case `next dev` or
`next start` is ever invoked directly instead of through these npm scripts.

## Running on localhost

```bash
npm run dev
```

Next.js prints both a `Local:` and a `Network:` URL on startup — `Local` is what you
use on the same machine (`http://localhost:3000`).

## Reaching it from your phone (same Wi-Fi)

`next dev` already binds to `0.0.0.0` by default (no extra flag needed) and prints the
LAN URL, e.g.:

```
- Local:         http://localhost:3000
- Network:       http://192.168.87.21:3000
```

Open that `Network:` URL in your phone's browser, as long as the phone is on the
**same Wi-Fi network** as the machine running `npm run dev`.

If it doesn't load, check these two things, in order:

1. **Firewall.** The OS firewall must allow inbound connections to `node` on that
   port for the network's profile.
   - **Windows**: the first time `next dev` runs, Windows may prompt "Allow this app
     to communicate on..." — allow it for whatever profile your Wi-Fi is categorized
     as (Private or Public; check with `Get-NetConnectionProfile` in PowerShell if
     unsure). If you already dismissed/denied that prompt, add a rule manually:
     Windows Defender Firewall → Advanced Settings → Inbound Rules → allow
     `node.exe` (or find the existing "Node.js JavaScript Runtime" rule and confirm
     it covers your network's profile).
   - **macOS**: System Settings → Network → Firewall will prompt to allow incoming
     connections for `node` the first time — click Allow.
2. **Different subnets.** Make sure the phone and the dev machine are actually on the
   same network (not one on Wi-Fi and the other on a guest network/VPN that isolates
   clients from each other — some home routers and most corporate/guest Wi-Fi
   networks enable "client isolation," which blocks device-to-device traffic even
   though both show the same SSID).

### Why `allowedDevOrigins` is set in `next.config.ts`

Next.js's dev server blocks cross-origin requests to its internal `/_next/*`
endpoints unless the origin is allowlisted (this is a dev-only CSRF protection, see
Next's `allowedDevOrigins` docs). A same-origin page load and its `<script>` tags
don't trip this — but the dev server's Hot Module Reload **WebSocket connection
always sends an `Origin` header**, so without an allowlist entry, loading the app
from a LAN IP (as opposed to `localhost`) leaves live-reload silently broken from
that device, even though the page itself renders fine.

`next.config.ts` allowlists `192.168.*.*` and `10.*.*.*` to cover the common home/
office private ranges. If your network uses `172.16.0.0/12` (`172.16.x.x` through
`172.31.x.x`) instead, add your specific `172.x.*.*` entry there too.

## Verifying end-to-end without spending API credits

Just use the default `npm run dev` (see above) — it always returns the canned
fixture from `lib/analysis/fixtures.ts`, so you can try the full capture → analyze
→ feedback → overlay flow, including from your phone, for free and as often as you
like. Reach for `npm run dev:real` only when you specifically want to see real
feedback on real content.

## Upload size limit

`MAX_UPLOAD_SIZE_MB` (default 10) caps how large a photo/video upload can be,
enforced both client-side (`MediaCapture`) and server-side (`/api/analyze`) — kept
modest by default since a larger file becomes more billed input tokens on every
real Claude API call. Note this caps file *size*, not image *resolution* — Claude's
vision token cost scales with pixel dimensions more directly than raw bytes, so a
very high-resolution but well-compressed photo could still be costlier per call
than the MB cap alone suggests. Client-side image resizing before upload (capping
the long edge, not just the file size) is a v2 backlog item if this becomes worth
tightening further — see `docs/PLAN.md`.
