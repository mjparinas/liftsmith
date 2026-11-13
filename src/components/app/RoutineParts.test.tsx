// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { useApp } from "@/lib/store";
import type { RoutinePart } from "@/lib/types";

import { RoutinePartsEditor, routinePartsLine } from "./Stretch";

// The routine builder's warm-up and cool-down (sessions-with-parts.md, stage 3).
function Harness({ onParts }: { onParts: (p: RoutinePart[] | undefined) => void }) {
  const [parts, setParts] = useState<RoutinePart[] | undefined>(undefined);
  return (
    <RoutinePartsEditor
      parts={parts}
      onChange={(p) => {
        setParts(p);
        onParts(p);
      }}
    />
  );
}

describe("routine parts in the builder", () => {
  afterEach(cleanup);

  it("adds a warm-up with chosen stretches and a cool-down left to the day", async () => {
    const user = userEvent.setup();
    let last: RoutinePart[] | undefined;
    render(<Harness onParts={(p) => (last = p)} />);
    const box = screen.getByTestId("routine-parts");
    await user.click(within(box).getByRole("switch", { name: /Warm-up first/ }));
    expect(last).toEqual([{ kind: "warm" }]);
    expect(box).toHaveTextContent("Stretches picked on the day");
    await user.click(within(box).getByRole("button", { name: "Choose stretches" }));
    await user.click(within(screen.getByTestId("part-stretches-warm")).getByRole("button", { name: "Brisk march or easy jog in place" }));
    expect(last).toEqual([{ kind: "warm", stretches: ["march"] }]);
    await user.click(within(box).getByRole("switch", { name: /Cool-down after/ }));
    expect(last).toEqual([{ kind: "warm", stretches: ["march"] }, { kind: "cool" }]);
    expect(routinePartsLine({ parts: last })).toBe("Warm-up (1 stretch) → Lifting → Cool-down");
    await user.click(within(box).getByRole("switch", { name: /Warm-up first/ }));
    expect(last).toEqual([{ kind: "cool" }]);
  });

  it("adds cardio after the lifting with its machine and minutes, by chips", async () => {
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ activeGymId: id });
    const user = userEvent.setup();
    let last: RoutinePart[] | undefined;
    render(<Harness onParts={(p) => (last = p)} />);
    const box = screen.getByTestId("routine-parts");
    await user.click(within(box).getByRole("switch", { name: /Cardio after/ }));
    expect(last).toEqual([{ kind: "cardio", exerciseId: "stationary-bike", minutes: 15 }]);
    const picker = screen.getByTestId("cardio-picker");
    await user.click(within(picker).getByRole("button", { name: "Rowing machine" }));
    await user.click(within(picker).getByRole("button", { name: "20 min" }));
    expect(last).toEqual([{ kind: "cardio", exerciseId: "rowing-machine", minutes: 20 }]);
    expect(routinePartsLine({ parts: last })).toBe("Lifting → Cardio (Rowing machine)");
  });
});
