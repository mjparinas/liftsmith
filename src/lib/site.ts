export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.getliftsmith.com";
export const APP_PATH = "/app/";
/** Privacy and support contact, shown on the privacy pages (Play and the App Store need one). */
export const CONTACT_EMAIL = "hello@getliftsmith.com";
/** The postal address in email footers (MAIL_POSTAL_ADDRESS in Vercel), also shown on /terms/ and /contact/ when set. */
export const MAILING_ADDRESS = process.env.MAIL_POSTAL_ADDRESS?.trim() || null;

/**
 * Store listings. Neither app is published yet, so both are null and the badges show "Coming soon".
 * When a listing goes live, set its URL here (or through the environment) and every badge on the site links to it.
 */
export const STORE_LINKS: { googlePlay: string | null; appStore: string | null } = {
  googlePlay: process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL || null,
  appStore: process.env.NEXT_PUBLIC_APP_STORE_URL || null,
};
