"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { rememberSiteLang, type SiteLang } from "@/lib/siteLang";

/** A link in the footer's language switcher: following it remembers the choice, so the web app starts in it too. */
export function LangLink({ to, ...props }: ComponentProps<typeof Link> & { to: SiteLang }) {
  return <Link {...props} onClick={() => rememberSiteLang(to)} />;
}
