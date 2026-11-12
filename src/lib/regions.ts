// Province and state codes, so gym pages read "Langley, BC" (src/server/gymPlaces.ts). The map server usually gives an
// ISO code ("CA-BC") as well, which wins; this list covers places where it doesn't, and the fix-up in db.ts for gyms
// imported before the ISO code was read.

/** Canadian provinces and territories by full name. */
export const SHORT_REGION: Record<string, string> = {
  "British Columbia": "BC",
  Alberta: "AB",
  Saskatchewan: "SK",
  Manitoba: "MB",
  Ontario: "ON",
  Quebec: "QC",
  "New Brunswick": "NB",
  "Nova Scotia": "NS",
  "Prince Edward Island": "PE",
  "Newfoundland and Labrador": "NL",
  Yukon: "YT",
  "Northwest Territories": "NT",
  Nunavut: "NU",
};

/** "British Columbia" as it ends a city's web address ("langley-british-columbia"). */
export const regionSlug = (name: string) => name.toLowerCase().replace(/ /g, "-");
