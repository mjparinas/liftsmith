// Structured data (schema.org JSON-LD) for the app itself, shared by the home page and the pricing page.
//
// Liftsmith is software, so it is a `MobileApplication`, never a `Product`. Google reads `Product` with
// offers as a merchant listing (a physical thing for sale) and then asks for shipping, returns, a GTIN and a
// brand, none of which apply to an app (Search Console, 2026-11-14). Every app entry carries an image and a
// description, and every offer says it's available and where to get it.
import { BRAND } from "./brand";
import { COACH_PLANS } from "./coachPlans";
import { SITE_URL } from "./site";
import { PRICES } from "./trial";

export interface AppOffer {
  "@type": "Offer";
  name: string;
  price: string;
  priceCurrency: "USD";
  availability: "https://schema.org/InStock";
  url: string;
  category: "free" | "subscription";
  priceSpecification?: {
    "@type": "UnitPriceSpecification";
    price: string;
    priceCurrency: "USD";
    billingDuration: "P1M" | "P1Y";
  };
}

const amount = (price: string) => price.replace("$", "");

function offer(name: string, price: string, url: string, every?: "P1M" | "P1Y"): AppOffer {
  const o: AppOffer = {
    "@type": "Offer",
    name,
    price,
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url,
    category: every ? "subscription" : "free",
  };
  if (every) o.priceSpecification = { "@type": "UnitPriceSpecification", price, priceCurrency: "USD", billingDuration: every };
  return o;
}

/** Free, Pro monthly and Pro yearly; with `coach`, the two coach plans too. */
export function appOffers(url: string, coach = false): AppOffer[] {
  const list = [
    offer("Free", "0", url),
    offer("Pro monthly", amount(PRICES.monthly.price), url, "P1M"),
    offer("Pro yearly", amount(PRICES.annual.price), url, "P1Y"),
  ];
  if (coach)
    list.push(
      offer("Coach monthly", String(COACH_PLANS.coach.usd.monthly), url, "P1M"),
      offer("Coach yearly", String(COACH_PLANS.coach.usd.annual), url, "P1Y"),
      offer("Coach Plus monthly", String(COACH_PLANS.coachPlus.usd.monthly), url, "P1M"),
      offer("Coach Plus yearly", String(COACH_PLANS.coachPlus.usd.annual), url, "P1Y"),
    );
  return list;
}

/** The app as a `MobileApplication`, with its icon, a preview card and real screenshots. */
export function appJsonLd({ url, description, lang, offers }: { url: string; description: string; lang: string; offers: AppOffer[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: BRAND.name,
    operatingSystem: "Android, iOS, Web",
    applicationCategory: "HealthApplication",
    description,
    url,
    inLanguage: lang,
    image: [`${SITE_URL}/icon-512.png`, `${SITE_URL}/og/default.jpg`],
    screenshot: ["today", "rest", "progress", "recovery"].map((s) => `${SITE_URL}/screens/${s}.webp`),
    publisher: { "@type": "Organization", name: BRAND.name, url: SITE_URL },
    offers,
  };
}
