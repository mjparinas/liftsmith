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

## Step 2: find a gym near you (next)

An opt-in list of gyms that lifters chose to publish, matched by approximate location, with reports and moderation in the admin panel, and a "Find my gym" choice in setup. It changes the rule in [Gym by location](gym-by-location.md) that a gym's position never leaves the phone, so only a gym the lifter publishes, at about 1 km, ever goes to the server.
