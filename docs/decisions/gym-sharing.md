# Gym sharing (Melvin, 2026-11-12)

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

Melvin picked "share and find gym setups" on 2026-11-12. Typing in a gym's kit (equipment, bars, plates, dumbbells, kettlebells) is the slowest part of setting up an adaptive plan, so a lifter whose gym someone already set up should only have to tap once. It also spreads the app person to person. Built in two steps.

## Step 1: share a gym as a link (built)

- **Gyms › Share › Share this gym** (`ShareGym` in `Gym.tsx`) sends a link, `/app/#/gymlink/<code>`, through the phone's share sheet, or copies it. Everything travels in the link itself (`src/lib/gymShare.ts`, `g1~` plus base64url of a compact JSON), like routine links: nothing is uploaded, so it works signed out and offline.
- **What it carries:** the gym's name, unit, equipment, bars, plates, dumbbells, kettlebells and machine step. **Never its place** (the "pick this gym when I'm here" position) **or machine settings** (those are the sender's own seat heights), and nothing about the lifter.
- **Opening one** (`SharedGym.tsx`, route `gymlink`) previews the equipment, bars, plates and weights, then **Add this gym** adds it to the lifter's gyms (`importGym` in the plan slice) and **Train here** makes it the active gym. A gym with the same kit (unit, equipment, plates, bars and weights, any name) shows "You already have this setup" instead of adding a copy. During a workout the gym is added but not switched.
- **Pasting one:** the Add a gym sheet has a box for a gym link that opened somewhere else (the iPhone, until Universal Links exist; open-items.md).
- **Reading links is forgiving:** unknown equipment and out-of-range numbers are dropped, so a link from a newer app still opens; a bad code shows "That gym link didn't open". Property tests check junk never throws.
- On Android the link opens the installed app through App Links (the `/app` path is already claimed); pure web code otherwise, so Android, iOS and the web app get it together.

## Step 2: find a gym near you (built)

- **List this gym nearby** (a switch under Gyms › Share, `ListGym` in `Gym.tsx`; needs an account, signed-out lifters get a Sign in link). It sends the gym's share code (the same kit as the link: never machine settings) and a position **rounded to 0.01° (about 1 km)** on the phone before sending, and rounded again on the server (`src/server/gymDirectory.ts`, table `public_gyms`). The position is the gym's saved place, else one approximate fix taken then. Up to 5 gyms per account, 20 changes a day; the name goes through the same text check as Friends (no links, no slurs). Turning it off deletes the listing, and deleting the account deletes every listing. The hint asks lifters to list only gyms open to the public, never a home gym.
- **Find gyms near you** (`NearbyGyms.tsx`) sits in the **Add a gym** sheet and on the **setup wizard's gym step**. One tap asks for one approximate position, sends it rounded the same way (`GET /api/gyms/?lat=&lon=`, no account, 60 searches an hour per address, nothing about the search kept), and lists gyms within 15 km, nearest first, with their distance rounded to 0.5 km, how many kinds of equipment and how many lifters added them. Who listed a gym is never shown. In Add a gym, a tap opens the usual gym preview; in setup, it's picked instead of a preset and added when setup finishes.
- **Adding a listed gym** counts once per lifter (account, else a one-way code from the address) toward "added by N lifters", which sorts ties.
- **Reports:** the preview of a listed gym has **Report this listing** (wrong or made-up equipment, a home or private gym, spam, an offensive name). Three different reporters hide it. Staff see reported listings on the admin **Reports** tab ("Reported gym listings", `GymReports.tsx`, `/api/admin/gyms/`): Remove deletes it, Dismiss shows it again; audited, admins only.
- **The rule in [Gym by location](gym-by-location.md) changed** (Melvin picked this feature, 2026-11-12): a gym's place still never leaves the phone on its own, but a gym the lifter lists goes to the server at about 1 km. The privacy policy ("Gyms you share or list") and `docs/PRIVACY_LABELS.md` say so; Play's Data safety form needs Approximate location's purposes to include App functionality (open-items.md).
- Pure web code, so Android, iOS and the web app get it together.
