# Wukong — Design References

Every UI decision must be traceable to one of these four references.
If it isn't, it doesn't ship.

## 1. Podium.global — https://podium.global
**What to steal:**
- Cinematic, sequence-driven storytelling (not section-stacking)
- Fluid organic motion — elements enter like a camera pan, not a slide
- High-contrast typography: huge display headlines, tiny labels
- Restraint: minimal navigation, media IS the interface
- Scroll-linked transitions where content reveals as you move

**What to avoid copying:**
- Too much whitespace (we're a marketplace, not a museum)
- Slow load times from heavy video

## 2. Lenis.dev — https://lenis.dev
**What to steal:**
- Butter-smooth scroll on every page
- Motion that feels native, never decorative
- Weight and momentum feel intentional, not floaty
- Performance first — no jank at 60fps

**Implementation:**
- Use `lenis` npm package (already in install list)
- Wrap entire app
- Duration 1.2, expo easing

**What to avoid copying:**
- Overscroll parallax that fights the user
- Scroll hijacking on forms or inputs

## 3. Rive.app — https://rive.app
**What to steal:**
- Pure black canvas (#000000) as the base
- Dark-first, technical environment
- Monospace accents for technical values (hashes, addresses, scores, timers)
- Single warm accent (#ffa41c) for primary CTAs ONLY — used at most once per viewport
- Elevation via surface color progression, NOT shadows
- 8px radius for cards, 6px for buttons, 4px for tags — no 16px anywhere
- Micro-interactions that delight but never distract (hover, copy, score reveal)
- Restrained motion — every animation has a purpose

**What to avoid copying:**
- Rive's specific product illustrations (ours is a marketplace, not an editor)
- The Rive home hero WebGL (too heavy for our demo)

## 4. Godly.website — https://godly.website
**What to steal:**
- Curation mindset — every detail is intentional
- Typography hierarchy that creates rhythm as you scroll
- Micro-interactions that feel custom, not library-default
- Confidence in emptiness — empty space is a feature, not a bug
- Nothing generic. If it looks like a shadcn component, redo it.

**What to avoid copying:**
- Experimental layouts that break usability
- WebGL or 3D that we can't ship in 6 hours

## Design Constraints (non-negotiable)

1. **No box-shadow. Ever.** Elevation = surface color. Base #000000 → Card #111111 → Hover #1a1a1a.
2. **Accent #ffa41c appears once per viewport maximum.** Never for text, borders, icons, or decoration.
3. **Radius scale: 4px / 6px / 8px / 12px only.** No 16px, no pill buttons.
4. **Fonts: Space Grotesk (display), Inter (body), JetBrains Mono (technical).** Three weights max per view.
5. **Motion easing: `cubic-bezier(0.16, 1, 0.3, 1)` at 200ms for hovers, 800ms for reveals.**
6. **Smooth scroll on every page via Lenis.**
7. **Every async surface needs loading + empty + error states.** No exceptions.

## Route-by-Route Reference Mapping

| Route | Primary Reference | Why |
|-------|------------------|-----|
| `/` Landing | Podium.global | Cinematic sequence storytelling |
| `/tasks` | Rive.app | Dense technical data, mono accents |
| `/tasks/[id]` | Rive.app + Godly | Escrow state, score reveal |
| `/leaderboard` | Godly | Confidence in emptiness, ranked list |
| `/workers`, `/agents` | Rive.app | Card grids, hover states |
| `/arena` | Podium.global | Live view, cinematic even when empty |
| Nav | Rive.app | Blur, subtle elevation, mono addresses |
