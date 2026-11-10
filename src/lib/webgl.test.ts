import { describe, expect, it } from "vitest";

import { isSoftwareRenderer, probeWebGL } from "./webgl";

describe("software WebGL", () => {
  it("spots the software rasterisers", () => {
    for (const name of [
      "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)",
      "Google SwiftShader",
      "llvmpipe (LLVM 15.0.7, 256 bits)",
      "ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0)",
    ])
      expect(isSoftwareRenderer(name), name).toBe(true);
  });

  it("leaves real GPUs alone, and the generic names Firefox and Safari give", () => {
    for (const name of [
      "Adreno (TM) 740",
      "Mali-G78 MC14",
      "Apple GPU",
      "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11)",
      "WebKit WebGL",
    ])
      expect(isSoftwareRenderer(name), name).toBe(false);
  });

  it("says none where there is no browser", () => {
    expect(probeWebGL()).toBe("none");
  });
});
