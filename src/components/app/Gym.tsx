"use client";
import { DEFAULT_RADIUS_M, locate, roundPlace } from "@/lib/geo";
import { PlateBar } from "@/components/PlateBar";
import { PRESETS, switchGymUnit, type GymPreset } from "@/lib/defaults";
import { haptic } from "@/lib/juice";
import { loadBar, plateStyle } from "@/lib/plates";
import { useApp } from "@/lib/store";
import { EQUIPMENT_GROUPS, EQUIPMENT_LABEL, type Gym as GymT } from "@/lib/types";
import { fmtNum } from "@/lib/units";
import { useState } from "react";
import { Button, Chip, Section, Sheet } from "./ui";

export function Gym() {
  const { gyms, profile, setProfile, saveGym, addGym, removeGym } = useApp();
  const [adding, setAdding] = useState(false);
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const [testKg, setTestKg] = useState(100);
  const [placeNote, setPlaceNote] = useState<string | null>(null);
  if (!gym) return null;
  const update = (patch: Partial<GymT>) => saveGym({ ...gym, ...patch });

  return (
    <div className="pb-24">
      <h1 className="pt-3 text-[1.75rem] font-extrabold tracking-tight">Gyms</h1>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {gyms.map((g) => (
          <Chip key={g.id} active={g.id === gym.id} onClick={() => setProfile({ activeGymId: g.id })}>{g.name}</Chip>
        ))}
        <Chip onClick={() => setAdding(true)}>+ Add gym</Chip>
      </div>

      <Section title="Name">
        <input value={gym.name} onChange={(e) => update({ name: e.target.value })} className="card w-full px-4 py-3" aria-label="Gym name" />
      </Section>

      <Section title="This gym's plates are in">
        <div className="flex flex-wrap gap-2">
          {(["kg", "lb"] as const).map((u) => <Chip key={u} active={gym.unit === u} onClick={() => saveGym(switchGymUnit(gym, u))}>{u === "kg" ? "Kilograms" : "Pounds"}</Chip>)}
        </div>
        <p className="mt-2 text-xs text-faint">Switching swaps the plates, bars and dumbbells below for a standard {gym.unit === "kg" ? "pound" : "kilogram"} set, which you can then edit. Your workout history stays as it is.</p>
      </Section>

      <Section title="Pick this gym when I'm here">
        {gym.place ? (
          <div className="card flex items-center justify-between gap-3 p-4">
            <p className="text-sm text-muted">On. Opening the app near here switches to {gym.name}.</p>
            <Button kind="quiet" onClick={() => update({ place: undefined })}>Turn off</Button>
          </div>
        ) : (
          <>
            <Button kind="ghost" className="w-full" onClick={async () => {
              setPlaceNote(null);
              const fix = await locate();
              if (!fix) return setPlaceNote("Location is off or not allowed. You can allow approximate location in your phone's settings.");
              update({ place: { lat: roundPlace(fix.lat), lon: roundPlace(fix.lon), radiusM: DEFAULT_RADIUS_M } });
              setPlaceNote(null);
            }}>Use where I am now</Button>
            <p className="mt-2 text-xs text-faint">Optional. Uses approximate location only when the app opens, never in the background, and it stays on your phone.</p>
          </>
        )}
        {placeNote && <p className="mt-2 text-sm text-warn">{placeNote}</p>}
      </Section>

      <Section title="Equipment">
        <div className="card space-y-4 p-4">
          {EQUIPMENT_GROUPS.map((grp) => (
            <div key={grp.title}>
              <p className="mb-2 text-xs uppercase tracking-wider text-faint">{grp.title}</p>
              <div className="flex flex-wrap gap-2">
                {grp.items.map((e) => {
                  const on = gym.equipment.includes(e);
                  return (
                    <Chip key={e} active={on} onClick={() => update({ equipment: on ? gym.equipment.filter((x) => x !== e) : [...gym.equipment, e] })}>
                      {EQUIPMENT_LABEL[e]}
                    </Chip>
                  );
                })}
              </div>
            </div>
          ))}
          <p className="text-sm text-muted">Bodyweight exercises are always included.</p>
        </div>
      </Section>

      <Section title={`Plates you own (${gym.unit})`}>
        <div className="card p-4">
          <ul className="space-y-2">
            {gym.plates.map((p, i) => {
              const st = plateStyle(p.weight, gym.unit);
              return (
                <li key={p.weight} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg text-xs font-bold" style={{ background: st.fill, color: st.text }}>{fmtNum(p.weight)}</span>
                  <span className="flex-1 text-sm text-muted">{fmtNum(p.weight)} {gym.unit}</span>
                  <button type="button" aria-label={`Fewer ${p.weight} plates`} className="press h-9 w-9 rounded-full border border-line bg-raised" onClick={() => { haptic("tick"); update({ plates: gym.plates.map((x, j) => (j === i ? { ...x, count: Math.max(0, x.count - 2) } : x)) }); }}>−</button>
                  <span className="num w-10 text-center font-semibold">{p.count}</span>
                  <button type="button" aria-label={`More ${p.weight} plates`} className="press h-9 w-9 rounded-full border border-line bg-raised" onClick={() => { haptic("tick"); update({ plates: gym.plates.map((x, j) => (j === i ? { ...x, count: x.count + 2 } : x)) }); }}>+</button>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 border-t border-line pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Try a weight</span>
              <input inputMode="decimal" value={testKg} onChange={(e) => setTestKg(Number(e.target.value) || 0)} className="num w-24 rounded-xl border border-line bg-raised px-3 py-1.5 text-right" aria-label="Test weight" />
            </div>
            <PlateBar loading={loadBar(testKg, gym.bars[0]?.weight ?? 20, gym.plates)} bar={gym.bars[0]?.weight ?? 20} unit={gym.unit} />
          </div>
        </div>
      </Section>

      <Section title="Bars">
        <ul className="card divide-y divide-line">
          {gym.bars.map((b, i) => (
            <li key={b.id} className="flex items-center justify-between px-4 py-3">
              <span>{b.name}</span>
              <input inputMode="decimal" value={b.weight} onChange={(e) => update({ bars: gym.bars.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) || 0 } : x)) })} className="num w-20 rounded-xl border border-line bg-raised px-3 py-1.5 text-right" aria-label={`${b.name} weight`} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title={`Dumbbells (${gym.unit}, each)`}>
        <div className="card p-4 text-sm text-muted">
          {gym.dumbbells.length ? `${fmtNum(gym.dumbbells[0])} to ${fmtNum(gym.dumbbells.at(-1)!)} ${gym.unit}, ${gym.dumbbells.length} pairs` : "None"}
        </div>
      </Section>

      {gyms.length > 1 && <Button kind="danger" className="mt-6 w-full" onClick={() => removeGym(gym.id)}>Remove this gym</Button>}

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add a gym">
        <div className="grid grid-cols-2 gap-3">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className="press card p-4 text-left" onClick={() => { const id = addGym(p.id as GymPreset); setProfile({ activeGymId: id }); setAdding(false); }}>
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-muted">{p.blurb}</div>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
