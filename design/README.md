# Wukong: production redesign

The design for the public launch on **wukonghq.xyz**: a real sign-up flow (Google, email code or a Solana wallet, with a self-custodial wallet created for new users), onboarding, and every screen a company or a worker needs. This folder is the design; the app in `src/` gets rebuilt to match it.

- Interactive canvas (clickable flows): https://claude.ai/artifact/HGvK1SLdbiCKbtHZpC9YPw (private to its owner until shared)
- Screen sources: [`screens/`](screens/) (`.dc.html`). Open any of them in a browser: [`screens/support.js`](screens/support.js) renders the starting state.
- Previews: [`previews/`](previews/), regenerated with `npm install && npm run previews`

## The look

| | |
|---|---|
| Surfaces | Navy `#0C1424`, paper `#F3F6FA`, white cards |
| Action | Signal red `#E4261C` (buttons, deadlines, slashes) |
| Verified / on-chain | Electric blue `#2B3CFF` |
| Type | Anton (headlines, numbers), Instrument Sans (interface), Instrument Serif italic (judge quotes), JetBrains Mono (labels, hashes, amounts) |

The same language as the demo film in [`video/`](../video/).

## Profile picture

The W mark for X and other social accounts: a sharp W with the jewel from the Monkey King's circlet above it, in the same red as the dot in the wordmark. Everything sits inside the circle X crops to, and it still reads at 32px.

| Main (navy) | Alternate (signal red) |
|---|---|
| ![Profile picture, navy](brand/wukong-pfp-400.png) | ![Profile picture, red](brand/wukong-pfp-red-400.png) |

Upload [`brand/wukong-pfp.png`](brand/wukong-pfp.png) (1000×1000). The SVGs in [`brand/`](brand/) are the sources, and [`brand/x-preview.png`](brand/x-preview.png) shows both at X's display sizes in light and dark mode.

## Screens

### Landing page
![Landing page](previews/Main.png)

### Sign in, then onboarding
| Sign in / sign up | Pick a role | Public profile | Wallet ready |
|---|---|---|---|
| ![Sign in](previews/SignIn.png) | ![Onboarding: role](previews/Onboarding.png) | ![Onboarding: profile](previews/Onboarding-profile.png) | ![Onboarding: wallet](previews/Onboarding-wallet.png) |

### Working
| Explore tasks | Task page and entry |
|---|---|
| ![Explore](previews/Explore.png) | ![Task](previews/Task.png) |

### Hiring
| Post a task | Results |
|---|---|
| ![Post a task](previews/PostTask.png) | ![Results](previews/Results.png) |

### Account
| Dashboard: working | Dashboard: hiring | Wallet |
|---|---|---|
| ![Dashboard](previews/Dashboard.png) | ![Dashboard: hiring](previews/Dashboard-hiring.png) | ![Wallet](previews/Wallet.png) |

| Public profile | Leaderboard |
|---|---|
| ![Profile](previews/Profile.png) | ![Leaderboard](previews/Leaderboard.png) |

### Phone
| Home | Enter a task | Landing | Explore | Task |
|---|---|---|---|---|
| ![Phone home](previews/MobileHome.png) | ![Phone task](previews/MobileTask.png) | ![Landing on a phone](previews/Main-phone.png) | ![Explore on a phone](previews/Explore-phone.png) | ![Task on a phone](previews/Task-phone.png) |

## What the design adds beyond today's app

These are designed but not built yet:

- **Accounts:** Google / email sign-in with an embedded self-custodial wallet (e.g. Privy), usernames and public profiles at `wukonghq.xyz/@handle`, linked external wallets.
- **Money:** deposits (transfer, or card via [CARD ON-RAMP PARTNER]), withdrawals, key export, network fees sponsored by Wukong.
- **Product:** email notifications, entry drafts, entries download, the leaderboard's monthly view.

Placeholders still to fill: [CARD ON-RAMP PARTNER], [CASH-OUT PARTNER], [LIMIT], and the deposit QR code.
