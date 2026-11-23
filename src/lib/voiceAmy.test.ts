import { beforeEach, describe, expect, it, vi } from "vitest";

import { can } from "./entitlements";
import { setLanguage } from "./i18n";
import { amyAllowed, setVoicePrefs, voice } from "./voice";

vi.mock("./billing", () => ({ hasPro: () => true }));
vi.mock("./piperAmy", () => ({
  amyUsable: () => true,
  amyWarm: () => {},
  speakAmy: async () => false,
  stopAmy: () => {},
}));

describe("Amy voice coach", () => {
  beforeEach(() => {
    setLanguage("en");
    setVoicePrefs({ enabled: true, engine: "system", voiceId: "" });
  });

  it("is a Pro feature", () => {
    expect(can("voiceAmy")).toBe(true);
  });

  it("allows Amy only when the engine is amy, Pro is on, and the app is in English", () => {
    setVoicePrefs({ engine: "amy" });
    expect(amyAllowed()).toBe(true);
    setLanguage("es");
    expect(amyAllowed()).toBe(false);
    setLanguage("en");
    setVoicePrefs({ engine: "system" });
    expect(amyAllowed()).toBe(false);
  });

  it("keeps the engine preference on the shared voice state", () => {
    setVoicePrefs({ engine: "amy", voiceId: "com.apple.voice" });
    expect(voice.engine).toBe("amy");
    expect(voice.voiceId).toBe("com.apple.voice");
  });
});
