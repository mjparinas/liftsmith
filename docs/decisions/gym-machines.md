# Bluetooth gym machines

`labGymMachines`, a Pro lab (Melvin picked it from the second Labs list, 2026-11-11). Code: `src/lib/ftms.ts` (reading the bytes and adding them up), `src/lib/machine.ts` (Bluetooth), `src/lib/machineLink.ts` (the link for the workout in progress), `src/components/app/workout/MachineCard.tsx` (the card and the store binding), `machineSet` in the workout slice.

## What it does

- On a cardio exercise (`ex.cardio`), with the lab on, a card above the set offers **Connect machine**. The phone's or browser's picker lists only machines that share the Bluetooth **Fitness Machine Service** (FTMS, 0x1826): most newer bikes, rowers, treadmills and cross trainers, and smart trainers.
- Once connected, the card says "{machine} is filling in this set" (the why line: where the numbers come from) and the average power. **Time** (the set's reps, in seconds) and, for distance cardio, **distance** go into the set card's own numbers, so Log set logs them with no extra tap, and the steppers still work if the machine is off. **Average power** is saved on the set as `powerW` and shown in History ("· 182 W average").
- One tap stays one tap: nothing new is asked for during a set. Disconnect is on the card.

## How it counts

- The machine's counters run for its whole workout. `MachineTally` follows them step by step: a counter that goes backwards was restarted on the machine, so what it shows then is all new. The first set after connecting takes the machine's totals (the lifter usually starts the machine as the set starts); after that each set counts from Log set.
- The link knows a set was logged, or the exercise changed, because the sink's key (`machineKey`: session, exercise on screen, sets logged) changes. That works even when the set is logged from the lock screen or a watch, because readings go straight to the store, not through the workout screen.
- Machines without an elapsed time (some treadmills) count the seconds they're moving; a gap of more than 3 s between readings counts as 3 s, so a stalled link isn't counted as work. Average power is time-weighted over the seconds moving. Negative power reads as 0.
- Readings while a strength exercise is on screen are ignored, and the next cardio set counts from when it comes on screen.
- Only the data characteristics are read (treadmill 0x2ACD, cross trainer 0x2ACE, rower 0x2AD1, indoor bike 0x2AD2); the control point (setting resistance or speed) is not used, so the app never drives the machine.

## Platforms

- **Android and iOS:** native Bluetooth through the same plugin as heart rate monitors (`@capacitor-community/bluetooth-le`: BluetoothGatt on Android, Core Bluetooth on iOS), one code path on both, so no new Java or Swift. Android already has `BLUETOOTH_SCAN` (never for location) and `BLUETOOTH_CONNECT`; iOS's Bluetooth permission text now mentions gym machines in all six languages. After a drop it reconnects to the same machine by id, waiting 2, 4, 8, 15 and 30 s, then says it lost the machine and keeps what it sent.
- **Web app:** Web Bluetooth, so Chrome only; without it the card doesn't show. See [Platform deltas](platform-deltas.md).
- The link outlives the workout screen and lets the machine go when the workout ends, however it ends.

## Not yet

- Heart rate from the machine is read but not used (the heart rate monitor link stays the one source).
- No pace, incline or stroke count on the set, and no CSV column for power yet.
