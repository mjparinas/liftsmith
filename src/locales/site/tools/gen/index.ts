// The workout generator's words in every site language (server only), with {app} filled in.
import { BRAND } from "@/lib/brand";
import { fill, type SiteLang } from "@/lib/siteLang";

import { LOCAL_TOOLS } from "..";
import type { GenUi } from "../types";
import { GEN_EN } from "./en";

export function genUi(lang: SiteLang): GenUi {
  const ui = lang === "en" ? GEN_EN : LOCAL_TOOLS[lang]["workout-generator"].ui;
  return { ...ui, startHint: fill(ui.startHint, { app: BRAND.name }) };
}
