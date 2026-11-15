import type { Metadata } from "next";

import { programMeta, programParams, ProgramView } from "@/components/site/ProgramView";

export const dynamicParams = false;
export const generateStaticParams = programParams;

type Props = { params: Promise<{ program: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return programMeta("en", (await params).program);
}

export default async function Page({ params }: Props) {
  return <ProgramView lang="en" id={(await params).program} />;
}
