// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { readSiteLang, rememberSiteLang } from "@/lib/siteLang";
import { useApp } from "@/lib/store";

import { LanguageButton, languageOptions } from "./LanguagePicker";

describe("language picker", () => {
  beforeEach(() => {
    localStorage.clear();
    useApp.setState({ profile: { ...useApp.getState().profile, language: undefined } });
  });
  afterEach(cleanup);

  it("offers following the browser on the web, then the ten languages", () => {
    const opts = languageOptions();
    expect(opts[0]).toEqual(["system", "Match my browser"]);
    expect(opts).toHaveLength(11);
  });

  it("saves the picked language on the profile", () => {
    render(<LanguageButton />);
    fireEvent.click(screen.getByRole("button", { name: /Language: English/ }));
    fireEvent.click(screen.getByRole("button", { name: "Español" }));
    expect(useApp.getState().profile.language).toBe("es");
  });

  it("starts in the language the visitor chose on the website", () => {
    rememberSiteLang("de");
    expect(readSiteLang()).toBe("de");
    render(<LanguageButton />);
    expect(useApp.getState().profile.language).toBe("de");
  });

  it("never overrides a language already chosen", () => {
    useApp.setState({ profile: { ...useApp.getState().profile, language: "fr" } });
    rememberSiteLang("de");
    render(<LanguageButton />);
    expect(useApp.getState().profile.language).toBe("fr");
  });
});
