# Gym software: Mindbody, Glofox and others (researched, not started)

Status: **researched on 2026-11-13, parked.** Melvin: "i dont want to do this yet but can you save this somewhere" (2026-11-12, Pacific). Nothing is built. Raise it with Melvin before starting.

Full write-up with sources: https://claude.ai/artifact/GaEnrAQMsQtmYYByq5Bd8t

## The idea

Gym owners who claim their page ([Gyms](gyms.md)) run memberships, billing, door check-in and class booking in gym software. Liftsmith connects to that software instead of rebuilding it. Each owner approves the connection for their own gym, so it fits as a step after claiming.

## Access, as of 2026-11

Most prices and limits come from third-party write-ups, because the vendors' developer portals didn't load. Confirm them at sign-up.

| Platform | Access | Cost to us | Useful data and actions |
|---|---|---|---|
| Mindbody (Public API v6) | Self-serve developer account and free sandbox (site -99), then Live Access reviewed by hand; each owner activates us by link or code | About $0.002 a call after ~5,000 free a month, per location; webhooks free; Mindbody logo required next to its data | Clients, memberships, visits, class schedules, AddClientToClass, AddArrival (check-in), webhooks for classes, rosters, clients, memberships, arrivals |
| Glofox (ABC Glofox) | Email apiactivation@abcfitness.com (studio, use case, branch ids); ABC issues keys per branch, separate test and live | Not published; Zapier needs the Elite plan | Members and leads, search by email or phone, memberships, classes, bookings, mark attended, signed member and door access webhooks |
| ABC Ignite | ABC partner program (tiers, infosec review), then each club signs a Client Data Release Authorization Form | Not published | Members, prospects, clubs, calendars; check-ins can be posted (Kisi does) |
| Wodify | The gym makes its own key (Automations › Integrations › API & MCP); partners use Wodify's developer portal | None found | Clients, classes, reservations, sign-ins, memberships, workouts and results; no webhooks |
| PushPress | No public API found; gym-made key for Zapier, curated Integrations Hub | None found | Through Zapier: find or create a person, membership changes, New Check-In |
| Zen Planner (Daxko) | OAuth credentials only through a Daxko sales rep; each gym's access approved by Daxko | Not published | Classes, reservations, waitlists, check-ins, people, memberships, attendance webhooks |

## Ideas, best value for effort first

1. **Verified member badge.** Match a lifter's email to the gym's members when they join its club (with the lifter's consent), so the leaderboard can be members only and owner results can be trusted. Small effort per platform.
2. **Class schedule and booking** on the gym's Liftsmith page and gym screen. Kept current from webhooks, not polling, so Mindbody's per-call fees stay small. Medium.
3. **Check in and the workout is ready.** A front-desk or door check-in sends a push with that gym and its equipment already picked. Needs idea 1 and Friends push. Medium.
4. **Workout of the day for CrossFit gyms** from Wodify as a routine, with results sent back. Wodify only. Medium to large (AMRAP, EMOM, for time).
5. **Churn alerts for owners.** Combine attendance with training to say who has stopped coming, with one tap to message them. Large, needs member consent. After 1 to 3.

Suggested order: Mindbody (no approval needed to start building), then Wodify, then Glofox (send ABC's access email early), then ABC Ignite and Zen Planner only when a gym on them asks. PushPress through the gym's Zapier key only if asked.

Gym keys would be sealed like the cloud connection tokens in `src/server/connect.ts` ([Connected apps](connected-apps.md)), and nothing the gym's own system holds would be copied into ours.
