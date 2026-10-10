# Phase 0-1 Gap Analysis

## Repo State
- Branch: `ui/setup` (checked out, rebased successfully)
- Dev server running on port 3000
- All source files read and analyzed

---

## Route-by-Route Gap Analysis

| Route | Current State | Problems | Redesign Priority |
|-------|-------------|----------|-------------------|
| `/` | Homepage with flex column layout, gold/ember gradient accents, mouse emoji, card-based "How it works" section, live arena section. `<h1>` with gradient text split by `<br/>`, "Post a task" and "Enter the arena" buttons. Stats grid at bottom. | **Critical**:<br>- Color palette is gold/ember/orange themed, not dark-first cinematic<br>- `bg-gold`, `bg-ember`, `text-gold` classes everywhere<br>- Gold background gradient on body, gold accent color used excessively<br>- Box-shadow used on buttons (`.btn-gold` has `box-shadow: 0 8px 30px -10px rgb(245 184 61 / 0.6)`)<br>- No Lenis smooth scroll wrapper<br>- No Lenis SmoothScroll provider<br>- Font display uses Space Grotesk but with old token names<br>- No ScrollReveal motion wrappers<br>- Character-by-character text reveal not implemented<br>- Section-stacked flow, not sequence-driven<br>- Body has `background-image` with radial gradients (not pure black)<br>- Focus outline uses `--color-gold` (old token)<br>- `.card` has `linear-gradient(180deg, var(--color-panel-2), var(--color-panel))` with `border-radius: 16px`<br>- No accent color restraint (gold used on both CTAs)<br>- No skeleton loaders for async surfaces<br>- No page transitions | **High** |
| `/tasks` | Task feed page with title "The Arena", filter chips (status + category), Post a task button, grid of TaskCards. | **High**:<br>- Filter chips use `border-gold`/`bg-gold/10` when active (accent overused)<br>- No sticky sidebar on desktop<br>- No category filter chips with new system colors<br>- No skeleton loaders during fetch<br>- TaskCard uses old `.card` style with `border-radius: 16px` and `animate-rise`<br>- No Lenis integration<br>- No ScoreReveal animations<br>- "Winner takes all" / "Top 3 · 50/30/20" text not in mono<br>- No empty state with new design | **High** |
| `/tasks/[id]` | Task detail / Arena page with header, brief expander, submissions list, right sidebar with control room. | **Critical**:<br>- Full of `text-gold`, `bg-gold/10`, `border-gold/30`<br>- Box-shadow on `.card` in Entry component (`border-crimson/40 shadow-[0_0_40px_-12px_rgba(245,184,61,0.5)]` on line 60)<br>- Gold used everywhere: status pills, badges, borders, hover states<br>- No dark-first surface progression<br>- No Lenis smooth scroll<br>- No ScoreReveal count-up animations<br>- Accent color not restrained to single primary CTA<br>- No escrow release animation<br>- ScoreBar uses gradient backgrounds (old system)<br>- Avatar uses `text-black/80` on `bg-gold` gradient<br>- `animate-rise` keyframe animation everywhere<br>- No skeleton loading states for the detailed page | **Critical** |
| `/leaderboard` | Leaderboard page with ranked list, grid columns, TierBadge, Usdc stats. | **High**:<br>- Uses `🥇 🥈 🥉` medal emojis for ranks (not per design spec - surface-2 distinction preferred)<br>- TierBadge uses old color system (`#f59e0b`, `#ef4444`, etc.)<br>- Column headers use `tracking-wider` and uppercase with old tokens<br>- "Earned" column uses `text-jade` Usdc<br>- No ScoreReveal on reputation scores<br>- Grid layout doesn't match new spec (sticky sidebar not present)<br>- No empty state skeleton during fetch<br>- Filter/chip styling uses old palette | **High** |
| `/workers` | Worker profile page with avatar, stats grid, track record history. | **Medium**:<br>- Uses `text-gold`, `bg-gold/5`, `border-gold/40` hover states<br>- Medal emojis `🥇 🥈 🥉` in history entries<br>- Avatar uses old gradient scheme<br>- Stat cards use old `card` style<br>- No surface-2 progression for hover<br>- `text-faint`, `text-muted` colors from old palette<br>- Copy to clipboard uses old pattern (no toast) | **Medium** |
| `/agents` | Agent x402 flow page with steps grid, example curl commands, posted tasks. | **Medium**:<br>- Uses `text-sky` and `bg-sky/10` for x402 theming (not dark-first)<br>- Example code blocks use `bg-ink` with `text-muted`<br>- Empty state uses old `Empty` component<br>- No Lenis smooth scroll<br>- Card styles use old palette | **Medium** |
| `/arena` | In-page component within task detail, not a top-level route. | **N/A** - embedded in task detail page |

---

## Critical Design Violations (Never to be Reverted)

1. **Box-shadow usage** - Found in Entry.tsx line 60, `.btn-gold` in globals.css, multiple places
2. **Accent color overuse** - Gold used as primary accent everywhere, violating "at most once per viewport" rule
3. **Gold/ember/orange palette** - Entire color scheme needs inversion to pure black + `#ffa41c` accent
4. **`animate-rise` keyframe** - Found in ui.tsx, page.tsx, Entry.tsx - must be removed/replaced
5. **Gold gradient background on body** - `radial-gradient` with `rgb(245 184 61 / 0.09)` 
6. **`border-radius: 16px`** - Used everywhere, must be reduced to `8px` (lg) or `6px` (md)
7. **`track-tight`/`tracking-tight`** - Tight tracking used broadly, must be reserved for display headings only

---

## Missing Systems (Must Be Built)

### Must-Install Dependencies (Phase 2)
- `motion` - Already installed (v14.1.0) - Framer Motion successor
- `lenis` - Smooth scroll library
- `@tanstack/react-query` - Async state for task fetching
- `zustand` - Shared interaction state

### Components to Create (Phase 4)
- `SmoothScroll.tsx` - Lenis wrapper
- `ScrollReveal.tsx` - Motion fade/translate on scroll
- `Button.tsx` - 4 variants with proper states
- `Card.tsx` - Surface-1, 1px border, 8px radius
- `Badge.tsx` - 5 variants by purpose
- `WalletAddress.tsx` - Truncate + copy-to-clipboard + toast
- `Countdown.tsx` - Live timer, color shift to danger under 1h
- `ScoreReveal.tsx` - Count-up from 0 to final over 800ms
- `EmptyState.tsx` - Skeleton loader matching final layout
- `LoadingState.tsx` - Skeleton screen
- `ErrorState.tsx` - Error surface

### Redesign Requirements (Phase 5)
- **Landing**: Cinematic sequence-driven, not section-stacked
- **Scroll-triggered cards** with bottom slide-in + connecting animated lines
- **Character-by-character text reveal** on mount (motion, not GSAP)
- **Live stat row** in mono font
- **Four step cards**: Post → Submit → Score → Pay
- **Task cards**: Hover state surface-2, category badge, reward (mono success), submission count, countdown
- **Trust bar**: Solana logo, "Escrowed in USDC" with lock, "AI-judged" with sparkle
- **Nav**: Fixed top, backdrop-blur, logo left, links center, wallet right
- **Active link**: accent underline (1px, offset 8px)
- **Mobile Nav**: Hamburger → full-screen overlay with staggered reveal
- **Leaderboard**: Ranked list, top 3 get surface-2 background (not medals)
- **Reputation score**: Animates in with ScoreReveal
- **Workers/Agents**: Card grid with avatar, hover surface-2 + translateY -2px (no shadow)
- **Arena**: Beautiful in emptiness - single centered message in display font

### Micro-Interactions (Phase 6)
- Button hover: 200ms ease-out-expo, background shift + 1px y-translate
- Card hover: border shifts to border-strong, background to surface-2
- Link hover: 1px underline grows from left
- Copy address: toast slides up from bottom-right, auto-dismiss 2s
- Score reveal: count-up animation on first view
- Escrow release: success pulse (ring expands from winner card)
- Page transitions: 200ms fade between routes
- Scroll progress: thin accent bar at top of viewport (long pages only)
- Nav backdrop: blur intensifies after 50px scroll

### Responsive (Phase 7)
- Test at 375px, 768px, 1440px
- Text overflow (no horizontal scroll)
- Tap targets min 44px on mobile
- Nav collapse
- Card stacking
- Font size scaling with clamp() for display headings

---

## Summary
The codebase has a gold/ember/orange themed design that needs a complete inversion to pure black (`#000`) with warm accent (`#ffa41c`) used sparingly. Box-shadow must be eliminated entirely. All `animate-rise` keyframes and gold-gradient backgrounds must be removed. New systems (Lenis smooth scroll, ScrollReveal motion, ScoreReveal count-up, new component library from scratch) must be built.

The most critical page is `/tasks/[id]` (Arena detail) - it has the most box-shadow usage and gold overuse. The landing page `/` also needs the most significant redesign to feel cinematic and sequence-driven.

Both npm run typecheck and npm run build must pass after all changes.