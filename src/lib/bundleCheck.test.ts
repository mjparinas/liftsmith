// The post-build check for imports the bundler left bare (scripts/bundle-check.mjs). On 2026-11-15 the daily
// reminder job failed with "addDays is not defined" because a for loop's update in src/server/tour.ts was
// bundled with the imported addDays left as a bare name.
import { describe, expect, it } from "vitest";

import { bareLoopCalls } from "../../scripts/bundle-check.mjs";

describe("bundle check", () => {
  it("finds the bundle that broke the reminder job", () => {
    const chunk = `let r={x:1};for(let e=(0,r.x)(n,t);e<o;e=addDays(e,1,t)){let i=(0,r.D)(e,"10:00",t)}`;
    expect(bareLoopCalls(chunk)).toEqual(["addDays"]);
  });

  it("passes rewritten imports and functions the chunk defines", () => {
    expect(bareLoopCalls(`for(let o=(0,r.x)(p,f);o<p;o=(0,r.b)(o,1,f)){}`)).toEqual([]);
    expect(bareLoopCalls(`function $(e,t,n){return e}for(let n=N(t,o);n<r;n=$(n,1,o)){}`)).toEqual([]);
    expect(bareLoopCalls(`let g=e=>e;for(let t=e;t;t=g(t)){}`)).toEqual([]);
    expect(bareLoopCalls(`for(let i=0;i<9;i=Math.min(i+1,9)){}`)).toEqual([]);
  });
});
