// Can this device draw the 3D demos on its GPU? Some browsers hand out WebGL drawn in software (SwiftShader,
// llvmpipe, Windows' Basic Render Driver) when the GPU is missing or blocklisted: low-end phones, virtual
// machines, and the test phone PageSpeed Insights uses. There every frame of the hologram becomes a long task on
// the main thread (seconds of blocking time on the home page), so the demos treat software WebGL as no WebGL
// and use the 2D figure or a still picture instead.

export type WebGLSupport = "gpu" | "software" | "none";

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic|mesa offscreen|lavapipe/i;

/** True when a WebGL renderer name is a software rasteriser. */
export const isSoftwareRenderer = (name: string) => SOFTWARE.test(name);

/**
 * Set by the screenshot scripts (site-screenshots.mjs, play-capture.mjs), whose headless browser only has
 * SwiftShader, so the store art and the home page screenshots still show the 3D figure.
 */
export const FORCE_GPU_FLAG = "__liftsmithForceWebGL";

/** Probes once with a throwaway context and frees it straight away. */
export function probeWebGL(): WebGLSupport {
  if (typeof document === "undefined" || typeof window === "undefined" || !("WebGLRenderingContext" in window)) return "none";
  const forced = (window as unknown as Record<string, unknown>)[FORCE_GPU_FLAG] === true;
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") ?? c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return "none";
    // Firefox and Safari give a generic name without the extension; that still reads as a GPU, as before.
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? "");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return isSoftwareRenderer(name) && !forced ? "software" : "gpu";
  } catch {
    return "none";
  }
}
