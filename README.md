# Liftsmith

Adaptive strength training for Android and iOS. Pick how long you have; Liftsmith plans every set from the equipment and plates you own, the muscles that are recovered, and where you are in your training block, then shows exactly which plates to load.

- Equipment and gym profiles, including the exact plates you own
- Workouts that fit the time you choose (15 to 90 minutes)
- A barbell graphic with the plates for each side on every barbell set
- Progressive overload with RIR blocks and deload weeks
- Exercise swaps that keep the same muscles
- A muscle recovery body map with a legend
- Live heart rate over Bluetooth, Health Connect and Apple Health
- A lock-screen rest timer and live workout notification
- Works offline; stats are stored on the device

Product and technical decisions are in [AGENTS.md](AGENTS.md).

## Run it

```bash
npm install
npm run dev     # http://localhost:3000/app/
npm test
npm run build   # static export in out/
```
