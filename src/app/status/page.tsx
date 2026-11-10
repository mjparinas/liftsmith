import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage, Section } from "@/components/site/InfoPage";
import { StatusCheck } from "@/components/site/StatusCheck";
import { BRAND } from "@/lib/brand";
import { REPLY_TIME } from "@/lib/contact";
import { CONTACT_EMAIL } from "@/lib/site";

const name = BRAND.name;

export const metadata: Metadata = {
  title: "Service status",
  description: `Is ${name} working right now? A live check of the website, sign-in and syncing.`,
  alternates: { canonical: "/status/" },
};

// Static, like every page (the script policy needs it): the check runs in the browser against /api/health/.
export default function Status() {
  return (
    <InfoPage kind="status" title="Service status" intro={`A live check of ${name}'s servers, run from your browser when this page opens.`}>
      <StatusCheck />
      <Section title="How we watch it">
        <p>An uptime monitor checks the website and its database around the clock, and a failed check alerts us straight away.</p>
        <p>
          {name} is built to work offline. The app keeps planning and logging workouts without a connection, and everything is saved on your
          phone first and synced when our servers answer again, so nothing is lost during an outage.
        </p>
        <p>
          Something not working for you while this page says all is well? Tell us on the <Link href="/contact/">contact page</Link> or at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, with your phone and app version. A person replies within {REPLY_TIME}.
        </p>
      </Section>
    </InfoPage>
  );
}
