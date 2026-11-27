import type { Metadata } from "next";

import { programPrintMeta, ProgramPrintView } from "@/components/site/ProgramPrint";
import { programParams } from "@/components/site/ProgramView";

export const dynamicParams = false;
export const generateStaticParams = programParams;

type Props = { params: Promise<{ program: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return programPrintMeta("pt", (await params).program);
}

export default async function Page({ params }: Props) {
  return <ProgramPrintView lang="pt" id={(await params).program} />;
}
