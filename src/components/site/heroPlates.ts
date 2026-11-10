// Plates per side for each lift in the home page hero, from the real plate solver. Worked out on the server
// (src/app/page.tsx passes them to HeroLift), because the default plate set lives beside the app's translated
// labels, which the home page shouldn't load.
import { PLATE_SETS } from "@/lib/defaults";
import { loadBar } from "@/lib/plates";

export const perSide = (kg: number) => loadBar(kg, 20, PLATE_SETS.kg).perSide;
