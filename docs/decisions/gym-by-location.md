# Gym by location (Melvin, 2026-11-09; built)

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

- Opt-in per gym: **Gyms › Pick this gym when I'm here › Use where I am now** saves the gym's position rounded to about 100 m, with a 300 m radius (`Gym.place`).
- When the app opens or comes back to the foreground, and only if some gym opted in, it asks for one **approximate** position (`src/lib/geo.ts`, `@capacitor/geolocation`). It switches the active gym only when exactly one gym is clearly in range, never mid-workout, and Today shows "you're here".
- No background location and no precise location. Android declares only `ACCESS_COARSE_LOCATION`; iOS asks "when in use" with reduced accuracy by default (`NSLocationDefaultAccuracyReduced`). The position is never sent anywhere, except for a gym the lifter chooses to list for others nearby, at about 1 km ([Gym sharing](gym-sharing.md), 2026-11-12). The same code runs on both platforms (parity).
- A true background geofence (switch before the app opens) was left out on purpose: it needs "always" location, which costs trust and app-review scrutiny for little gain.
