import type { Metadata } from "next";

import { musclesIndexMeta, MusclesIndexView } from "@/components/site/MuscleView";

export const metadata: Metadata = musclesIndexMeta("ko");

export default function Page() {
  return <MusclesIndexView lang="ko" />;
}
