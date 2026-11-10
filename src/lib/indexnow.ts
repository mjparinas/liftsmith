// IndexNow (https://www.indexnow.org): tells Bing, Yandex, Seznam, Naver and Yep straight away when a public page is
// new or changed, instead of waiting for them to crawl. The key isn't a secret: IndexNow checks that it's served at
// KEY_LOCATION on our own host, which proves the pings come from us. Changing it means a new file in public/.
import { SITE_URL } from "./site";

export const INDEXNOW_KEY = "71de14d52b91f668575a844ea43ebed9";
export const INDEXNOW_HOST = new URL(SITE_URL).host;
export const INDEXNOW_KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;
/** IndexNow's shared endpoint, which passes each ping on to every engine that takes part. */
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
/** IndexNow takes up to 10,000 addresses in one ping. */
export const INDEXNOW_BATCH = 10_000;
