import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage, Section } from "@/components/site/InfoPage";
import { CtaBanner } from "@/components/site/SiteChrome";
import { NEEDS_USER_SCALES, OWN_APP_BRANDS, SCALES_UPDATED, STANDARD_SCALES, TESTED_SCALES, type ScaleModel } from "@/content/scales";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";

const name = BRAND.name;

export const metadata: Metadata = pageMeta({
  title: "Bluetooth scales that work",
  description: `Which Bluetooth smart scales connect to ${name} directly, which ones don't yet, and how any other scale gets its weigh-ins to ${name} through Health Connect or Apple Health.`,
  path: "/works-with/scales/",
});

function ScaleTable({ label, rows }: { label: string; rows: ScaleModel[] }) {
  return (
    <div className="overflow-x-auto" role="region" aria-label={label} tabIndex={0}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="py-2 pr-3 font-semibold">
              Brand
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold">
              Models
            </th>
            <th scope="col" className="py-2 font-semibold">
              Sends
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.brand + r.models} className="border-b border-line/60 align-top">
              <th scope="row" className="py-2 pr-3 font-medium">
                {r.brand}
              </th>
              <td className="py-2 pr-3">{r.models}</td>
              <td className="py-2">{r.reads}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Scales() {
  return (
    <InfoPage
      kind="works-with-scales"
      title="Bluetooth scales that work"
      updated={SCALES_UPDATED}
      crumbs={[{ href: "/features/", label: "Features" }]}
      intro={
        <>
          With the Bluetooth smart scale lab on (Settings › Labs, part of Pro), the weigh-in on Progress and Body gets a{" "}
          <strong>Weigh in on my scale</strong> button. Step on, and your weight, plus body fat when the scale sends it, fills in for you to
          check and log. Any other scale can still reach {name} through its own app.
        </>
      }
    >
      <Section id="how" title="How it connects">
        <p>
          {name} talks to scales that share their reading the standard Bluetooth way: the Weight Scale service, and the Body Composition
          service for body fat. Lots of scales use a closed protocol that only their maker&apos;s app understands instead, and those never
          show up in the list when you tap the button.
        </p>
        <p>
          It works in the Android and iPhone apps, and in the web app in Chrome on a computer or Android phone. Close the scale&apos;s own
          app first, because a scale connects to one app at a time.
        </p>
      </Section>

      {TESTED_SCALES.length > 0 && (
        <Section id="tested" title="Tested with Liftsmith">
          <ScaleTable label="Tested with Liftsmith" rows={TESTED_SCALES} />
        </Section>
      )}

      <Section id="should-work" title="Should work">
        <p>
          These scales send their reading over the standard weight service as soon as you step on, with nothing to set up on the scale. We
          haven&apos;t tried each one ourselves yet, so if yours gives you trouble, <Link href="/contact/">tell us</Link>.
        </p>
        <ScaleTable label="Scales that should work" rows={STANDARD_SCALES} />
      </Section>

      <Section id="not-yet" title="Standard, but not yet">
        <p>
          These scales use the standard services too, but they only send a reading once an app has registered you as one of the scale&apos;s
          users. {name} doesn&apos;t do that step yet, so for now use the scale&apos;s own app and the health store, below.
        </p>
        <ScaleTable label="Standard scales that need a user set up" rows={NEEDS_USER_SCALES} />
      </Section>

      <Section id="any-scale" title="Any other scale: through Health Connect or Apple Health">
        <p>
          Most smart scales&apos; own apps can save your weigh-ins to Health Connect on Android or Apple Health on iPhone, and {name} reads
          weight and body fat from there for free, no lab needed. That includes:
        </p>
        <ul>
          {OWN_APP_BRANDS.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <p>To set it up:</p>
        <ol className="list-decimal space-y-1.5 pl-6">
          <li>In the scale&apos;s own app, turn on syncing to Health Connect or Apple Health, and allow weight and body fat.</li>
          <li>In {name}, open Settings › Connected apps › Health Connect (or Apple Health) and allow weight and body fat there too.</li>
          <li>Weigh in as usual. {name} picks up the reading when it opens, or tap Sync now on the same screen.</li>
        </ol>
        <p>
          {name} keeps one reading a day, so syncing again never adds a duplicate. More in <Link href="/help/">help and questions</Link>.
        </p>
      </Section>

      <Section id="missing" title="Your scale isn't listed?">
        <p>
          Try it: if it appears when you tap <strong>Weigh in on my scale</strong>, it speaks the standard. Either way,{" "}
          <Link href="/contact/">let us know the brand and model</Link> and whether it worked, and we&apos;ll add it here.
        </p>
      </Section>

      <CtaBanner
        cta="works-with-scales-end"
        title={`Weigh in with ${name}`}
        body="Your weight and body fat feed the coach's notes and your recovery, with every recommendation saying why."
      />
    </InfoPage>
  );
}
