# Setup notes

Environment corrections discovered while bringing up the Wukong app.
Recorded so the next person doesn't rediscover them the hard way.

---

## 1. Tailwind v4 — there is no `tailwind.config.js`, and there must not be

This project is on **Tailwind CSS v4.3.3**. v4 changed how configuration works:

- The design tokens live in **`src/app/globals.css`**, inside a CSS `@theme` block.
- `globals.css` line 1 is `@import "tailwindcss" source("..")`. The `source("..")`
  points the scanner at `src/`, so it picks up class names from `src/components/`
  and `src/app/`. Adding new source roots means editing that import, not a config file.
- **Do not create a `tailwind.config.js`.** v4 ignores it unless you explicitly run
  the `@config` directive. Creating one will look like it works and silently do nothing.

### The token palette (`@theme`)

| Role | Token | Value |
| --- | --- | --- |
| Page background | `--color-ink` | `#0b0a08` |
| Card base | `--color-panel` | `#14120e` |
| Card top (gradient) | `--color-panel-2` | `#1b1813` |
| Hairline border | `--color-line` | `#2b2720` |
| Stronger border | `--color-line-2` | `#3a342a` |
| Primary text | `--color-text` | `#f6f1e7` |
| Secondary text | `--color-muted` | `#a59c8c` |
| Tertiary text | `--color-faint` | `#6f675a` |
| Primary accent | `--color-gold` | `#f5b83d` |
| Primary accent light | `--color-gold-2` | `#ffd77a` |
| Warning / rating gate | `--color-ember` | `#ff6b3d` |
| Success / paid | `--color-jade` | `#3ecf8e` |
| Error | `--color-crimson` | `#ef4d5a` |
| AI / judging | `--color-violet` | `#a78bfa` |
| Agent / x402 | `--color-sky` | `#5ab0ff` |

Fonts: `--font-display` (Space Grotesk), `--font-sans` (Inter), `--font-mono` (JetBrains Mono).

Animations: `--animate-rise`, `--animate-pulse-gold`, `--animate-shimmer`.

**There are no radius tokens.** Border radii are hardcoded literals:
`16px` on `.card`, `12px` on `.btn` and `.input`, `10px` on the wallet button.

### Component classes that are hand-written CSS, not Tailwind

These live in `globals.css` and are used as plain class names across the app:
`.card`, `.btn` (+ `.btn-gold`, `.btn-ghost`, `.btn-violet`), `.input`, `.label`,
`.shimmer`, `.wallet-adapter-button`.

---

## 2. MCP servers

Three local MCP servers are configured in `opencode.json`:

| Server | Command | Notes |
| --- | --- | --- |
| `tailwindcss` | `npx -y tailwindcss-mcp-server` | Live class inspection |
| `browser` | `npx -y mcp-browser-agent serve` | Screenshot loop for visual work |
| `frontend-dev` | `uvx --from frontend-dev-mcp --with "mcp<2" frontend-mcp` | Requires `uv`/`uvx` on PATH |

The `--with "mcp<2"` pin on `frontend-dev` is deliberate. Unpinned it resolves to
`mcp>=2`, which drops the SSE transport the server still uses and the server fails
to start.

`tailwindcss` and `browser` need network access on first run because `npx -y`
downloads them into the npm cache. `frontend-dev` needs `uvx` (from `uv`).

---

## 3. Model IDs

Both were verified to resolve against the `opencode` provider:

- `model`: `opencode/space-bunny-free`
- `small_model`: `opencode/ling-3.1-flash-free`

The `opencode/` provider prefix is required. A bare `space-bunny-free` will not
resolve.

---

## 4. Running the app

The app is useless without a chain behind it. Three terminals:

```bash
npm run validator        # local Solana + the program preloaded at genesis
npm run setup:localnet   # mint demo USDC, init config, generate judge/treasury keys
npm run seed             # optional: history, reputation, open tasks
npm run dev              # http://localhost:3000
```

Only **Solana CLI** is required, not a Rust or Anchor toolchain:
`scripts/validator.sh` preloads the checked-in `artifacts/wukong.so`, so
`npm run program:build` is not needed for a local run.

Add the CLI to PATH after installing:

```bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

---

## 5. Things that will bite you

### `node_modules` can be present but incomplete
A partial install left 545 packages on disk with `next` itself missing, so
`npm run dev` failed with `next: command not found` while `node_modules` still
looked populated. If the binary is missing, run `npm ci` — it restores the exact
set from `package-lock.json` and does not modify it.

### The wallet registry is empty
`src/components/Providers.tsx` passes `useMemo(() => [], [])` to `WalletProvider`.
No wallet adapters are registered, so the wallet modal opens with nothing in it.

**Known, deliberately not fixed on this branch.** `Providers.tsx` is shared
infrastructure wired to the Solana action/signing flow, so it is left to whoever
owns that path. Adding Phantom/Solflare needs no new npm package — only imports
from `@solana/wallet-adapter-react`, which is already a dependency.

### `motion` is installed but unused
`motion@14.1.0` is in `package.json` and has zero imports across `src/`. Either
drop the dependency or use it — right now it is dead weight.

### Layout bugs in the current UI
- **`/leaderboard` is unusable below ~640px.** The row grid is
  `grid-cols-[40px_1fr_90px_110px]`. At 375px the two fixed columns consume 200px,
  squeezing the `1fr` name column to roughly zero — worker names are clipped
  entirely and only the avatar survives. The page does not scroll horizontally,
  so there is no way to see the names.
- **`/agents` scrolls horizontally on mobile.** The `<pre>` curl samples carry
  `overflow-x-auto`, but the `.card` that wraps them sits in a grid without
  `min-w-0`, so the `<pre>`'s intrinsic width expands the whole document
  (`scrollWidth` 675px in a 360px viewport).
- **The task brief has no disclosure affordance.** It is a `<details>` with
  `list-none`, which removes the default triangle, and the `<summary>` renders no
  chevron of its own. On a settled task the brief is collapsed by default and
  looks like a static card.
- **No `not-found.tsx`.** Any bad URL renders Next's default 404, which comes
  through **light-mode** inside an otherwise dark app.

### Accessibility gaps in the current UI
Verified by grep across `src/`:
- **No `prefers-reduced-motion` handling**, despite four infinite animations
  (`animate-pulse`, `animate-pulse-gold`, the `Spinner` `animate-spin`, and
  `animate-rise` on every card).
- **No `focus-visible` styling.** `.btn`, `.input`, nav links and filter chips all
  fall back to the UA default outline on a dark palette. `.input:focus` (gold
  border) is the only focus affordance in the app.
- **Filter chips have no `aria-pressed`.** `/tasks` status and category chips are
  visually toggled but expose no state to assistive tech.
- **`role=` appears zero times.** The persona switcher is a plain `div` with no
  `aria-expanded`, `aria-haspopup`, or Escape-to-close.
- **Unpluralized counts.** The leaderboard renders "1 entries" on every seeded
  row.

### `.playwright-mcp/` is not gitignored
Browser-MCP screenshots land in the repo root. Add it to `.gitignore` or do not
commit it.