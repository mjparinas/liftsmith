import type { Metadata } from "next";

import { musclesIndexMeta, MusclesIndexView } from "@/components/site/MuscleView";

export const metadata: Metadata = musclesIndexMeta("es");

export default function Page() {
  return <MusclesIndexView lang="es" />;
}
