// The major cities staff can import in one go from Admin › Gyms (Melvin, 2026-11-12: "add all gyms from all major
// cities in Canada", then "the same for the US"). Canada: every city of about 100,000 people or more, plus each
// province's and territory's capital. US: the hundred-odd biggest cities, about 200,000 people or more, plus a few
// smaller state capitals and metro hubs. Each is one import (gymPlaces.ts importArea), run one after another from the
// admin page so OpenStreetMap's free services aren't hit all at once.

// prettier-ignore
export const MAJOR_CITIES = {
  CA: [
    "Toronto, ON", "Montreal, QC", "Calgary, AB", "Ottawa, ON", "Edmonton, AB", "Winnipeg, MB", "Mississauga, ON",
    "Vancouver, BC", "Brampton, ON", "Hamilton, ON", "Surrey, BC", "Quebec City, QC", "Halifax, NS", "Laval, QC",
    "London, ON", "Markham, ON", "Vaughan, ON", "Gatineau, QC", "Saskatoon, SK", "Kitchener, ON", "Longueuil, QC",
    "Burnaby, BC", "Windsor, ON", "Regina, SK", "Oakville, ON", "Richmond, BC", "Richmond Hill, ON", "Burlington, ON",
    "Oshawa, ON", "Sherbrooke, QC", "Greater Sudbury, ON", "Abbotsford, BC", "Lévis, QC", "Coquitlam, BC", "Barrie, ON",
    "Saguenay, QC", "Kelowna, BC", "Guelph, ON", "Trois-Rivières, QC", "Whitby, ON", "Cambridge, ON", "St. Catharines, ON",
    "Milton, ON", "Langley, BC", "Kingston, ON", "Ajax, ON", "Waterloo, ON", "Terrebonne, QC", "Saanich, BC",
    "St. John's, NL", "Thunder Bay, ON", "Delta, BC", "Brantford, ON", "Chatham-Kent, ON", "Clarington, ON",
    "Red Deer, AB", "Strathcona County, AB", "Pickering, ON", "Lethbridge, AB", "Kamloops, BC", "Nanaimo, BC",
    "Victoria, BC", "Moncton, NB", "Fredericton, NB", "Saint John, NB", "Charlottetown, PE", "Whitehorse, YT",
    "Yellowknife, NT", "Iqaluit, NU", "Airdrie, AB", "Maple Ridge, BC", "North Vancouver, BC", "New Westminster, BC",
    "Chilliwack, BC", "Prince George, BC", "Fort McMurray, AB", "Grande Prairie, AB", "Peterborough, ON",
    "Newmarket, ON", "Sault Ste. Marie, ON", "North Bay, ON", "Brossard, QC", "Repentigny, QC", "Drummondville, QC",
    "Saint-Jérôme, QC", "Granby, QC", "Dartmouth, NS", "Sydney, NS",
  ],
  US: [
    "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ", "Philadelphia, PA", "San Antonio, TX",
    "San Diego, CA", "Dallas, TX", "Jacksonville, FL", "Fort Worth, TX", "San Jose, CA", "Austin, TX", "Charlotte, NC",
    "Columbus, OH", "Indianapolis, IN", "San Francisco, CA", "Seattle, WA", "Denver, CO", "Oklahoma City, OK",
    "Nashville, TN", "Washington, DC", "El Paso, TX", "Las Vegas, NV", "Boston, MA", "Detroit, MI", "Portland, OR",
    "Louisville, KY", "Memphis, TN", "Baltimore, MD", "Milwaukee, WI", "Albuquerque, NM", "Tucson, AZ", "Fresno, CA",
    "Sacramento, CA", "Mesa, AZ", "Atlanta, GA", "Kansas City, MO", "Colorado Springs, CO", "Omaha, NE", "Raleigh, NC",
    "Miami, FL", "Virginia Beach, VA", "Long Beach, CA", "Oakland, CA", "Minneapolis, MN", "Bakersfield, CA", "Tulsa, OK",
    "Tampa, FL", "Arlington, TX", "Wichita, KS", "Aurora, CO", "New Orleans, LA", "Cleveland, OH", "Honolulu, HI",
    "Anaheim, CA", "Henderson, NV", "Orlando, FL", "Lexington, KY", "Stockton, CA", "Riverside, CA", "Corpus Christi, TX",
    "Irvine, CA", "Cincinnati, OH", "Santa Ana, CA", "Newark, NJ", "Saint Paul, MN", "Pittsburgh, PA", "Greensboro, NC",
    "Durham, NC", "Lincoln, NE", "Jersey City, NJ", "Plano, TX", "Anchorage, AK", "North Las Vegas, NV", "St. Louis, MO",
    "Madison, WI", "Chandler, AZ", "Gilbert, AZ", "Reno, NV", "Buffalo, NY", "Chula Vista, CA", "Fort Wayne, IN",
    "Lubbock, TX", "Toledo, OH", "St. Petersburg, FL", "Laredo, TX", "Irving, TX", "Chesapeake, VA", "Glendale, AZ",
    "Winston-Salem, NC", "Port St. Lucie, FL", "Scottsdale, AZ", "Garland, TX", "Boise, ID", "Norfolk, VA", "Spokane, WA",
    "Richmond, VA", "Fremont, CA", "Huntsville, AL", "Frisco, TX", "Cape Coral, FL", "Santa Clarita, CA",
    "San Bernardino, CA", "Tacoma, WA", "Hialeah, FL", "Baton Rouge, LA", "Modesto, CA", "Fontana, CA", "McKinney, TX",
    "Moreno Valley, CA", "Des Moines, IA", "Fayetteville, NC", "Salt Lake City, UT", "Yonkers, NY", "Worcester, MA",
    "Rochester, NY", "Sioux Falls, SD", "Little Rock, AR", "Amarillo, TX", "Tallahassee, FL", "Grand Prairie, TX",
    "Columbus, GA", "Augusta, GA", "Peoria, AZ", "Oxnard, CA", "Knoxville, TN", "Overland Park, KS", "Birmingham, AL",
    "Grand Rapids, MI", "Vancouver, WA", "Montgomery, AL", "Huntington Beach, CA", "Providence, RI", "Brownsville, TX",
    "Tempe, AZ", "Akron, OH", "Glendale, CA", "Chattanooga, TN", "Fort Lauderdale, FL", "Newport News, VA",
    "Mobile, AL", "Ontario, CA", "Clarksville, TN", "Cary, NC", "Elk Grove, CA", "Shreveport, LA", "Eugene, OR",
    "Aurora, IL", "Salem, OR", "Santa Rosa, CA", "Rancho Cucamonga, CA", "Pembroke Pines, FL", "Fort Collins, CO",
    "Springfield, MO", "Oceanside, CA", "Garden Grove, CA", "Lancaster, CA", "Murfreesboro, TN", "Palmdale, CA",
    "Corona, CA", "Killeen, TX", "Salinas, CA", "Roseville, CA", "Denton, TX", "Surprise, AZ", "Macon, GA",
    "Paterson, NJ", "Lakewood, CO", "Hayward, CA", "Charleston, SC", "Alexandria, VA", "Hollywood, FL", "Springfield, MA",
    "Kansas City, KS", "Sunnyvale, CA", "Bellevue, WA", "Joliet, IL", "Naperville, IL", "Escondido, CA",
    "Bridgeport, CT", "Savannah, GA", "Olathe, KS", "Mesquite, TX", "Pasadena, TX", "McAllen, TX", "Rockford, IL",
    "Syracuse, NY", "Jackson, MS", "Columbia, SC", "Hartford, CT", "Albany, NY", "Harrisburg, PA", "Boulder, CO",
    "Ann Arbor, MI", "Burlington, VT", "Portland, ME", "Manchester, NH", "Wilmington, DE", "Charleston, WV",
    "Billings, MT", "Fargo, ND", "Cheyenne, WY",
  ],
} as const;

export type ImportCountry = keyof typeof MAJOR_CITIES;
export const isImportCountry = (x: unknown): x is ImportCountry => x === "CA" || x === "US";
