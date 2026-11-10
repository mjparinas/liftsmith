import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/site/ContactForm";
import { InfoPage, Section } from "@/components/site/InfoPage";
import { BRAND } from "@/lib/brand";
import { REPLY_TIME } from "@/lib/contact";
import { CONTACT_EMAIL, MAILING_ADDRESS } from "@/lib/site";

const name = BRAND.name;

export const metadata: Metadata = {
  title: "Contact us",
  description: `Questions, feedback, a bug, a billing question or a privacy request? Send the ${name} team a message or email us.`,
  alternates: { canonical: "/contact/" },
};

export default function Contact() {
  return (
    <InfoPage
      kind="contact"
      title="Contact us"
      intro={
        <>
          Send us a message, or email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent underline">
            {CONTACT_EMAIL}
          </a>
          . A person reads every message and replies within {REPLY_TIME}. Many answers are already on the{" "}
          <Link href="/help/" className="font-semibold text-accent underline">
            help page
          </Link>
          .
        </>
      }
    >
      <ContactForm />
      <Section title="Other ways to reach us">
        <ul>
          <li>
            <strong>A bug in the app:</strong> Settings › Send feedback or report a bug attaches your device details and, if you like, a
            screenshot, which helps us fix it faster.
          </li>
          <li>
            <strong>Billing and refunds:</strong> Pro is bought through Google Play or the App Store, so refunds go through them first. See{" "}
            <Link href="/help/#billing">Pro, trials and billing</Link>.
          </li>
          <li>
            <strong>Your data:</strong> you can export or delete it yourself in the app. The <Link href="/privacy/">privacy policy</Link>{" "}
            and the <Link href="/delete-account/">delete account page</Link> say how. For anything else, write to us.
          </li>
          <li>
            <strong>Is something down?</strong> The <Link href="/status/">status page</Link> checks our servers live.
          </li>
          {MAILING_ADDRESS && (
            <li>
              <strong>By mail:</strong> {name}, {MAILING_ADDRESS}
            </li>
          )}
        </ul>
      </Section>
    </InfoPage>
  );
}
