// Major cities in every other country Liftsmith is in on Google Play (Melvin, 2026-11-14: "add every country's major
// city that the Google Play Store is connected to"). The Play countries are the ones where English, Spanish, French,
// German, Italian or Japanese is an official or main language (docs/decisions/google-play-review.md, "Production
// countries"); Canada and the US are in majorCities.ts. Each country lists its biggest cities and its capital: about
// twenty for the biggest countries, a handful for mid-sized ones, the capital alone for the smallest. A city is written
// "City, Country" so Nominatim finds the right one (there are Londons and Córdobas on several continents).

export interface WorldCountry {
  name: string;
  cities: readonly string[];
}

const c = (name: string, cities: string[]): WorldCountry => ({ name, cities: cities.map((city) => `${city}, ${name}`) });

// prettier-ignore
export const WORLD_CITIES: Record<string, WorldCountry> = {
  // English
  GB: c("United Kingdom", [
    "London", "Birmingham", "Manchester", "Glasgow", "Leeds", "Liverpool", "Sheffield", "Edinburgh", "Bristol",
    "Newcastle upon Tyne", "Leicester", "Nottingham", "Cardiff", "Belfast", "Coventry", "Bradford", "Southampton",
    "Brighton", "Plymouth", "Aberdeen", "Reading", "Milton Keynes", "Norwich", "Oxford", "Cambridge", "York", "Swansea",
    "Dundee", "Derby", "Portsmouth",
  ]),
  IE: c("Ireland", ["Dublin", "Cork", "Limerick", "Galway", "Waterford", "Drogheda", "Kilkenny"]),
  AU: c("Australia", [
    "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Newcastle", "Canberra", "Sunshine Coast",
    "Wollongong", "Geelong", "Hobart", "Townsville", "Cairns", "Darwin", "Toowoomba", "Ballarat", "Bendigo",
  ]),
  NZ: c("New Zealand", ["Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Dunedin", "Palmerston North", "Napier"]),
  ZA: c("South Africa", [
    "Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein", "East London", "Pietermaritzburg",
    "Polokwane", "Nelspruit", "Kimberley", "Rustenburg",
  ]),
  IN: c("India", [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Surat", "Lucknow",
    "Kanpur", "Nagpur", "Indore", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ludhiana", "Agra", "Nashik",
    "Coimbatore", "Kochi", "Chandigarh", "Gurgaon", "Noida", "Thiruvananthapuram", "Mysore", "Guwahati", "Bhubaneswar",
  ]),
  PK: c("Pakistan", ["Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Islamabad", "Multan", "Peshawar", "Hyderabad", "Quetta", "Sialkot"]),
  PH: c("Philippines", [
    "Manila", "Quezon City", "Davao City", "Cebu City", "Makati", "Taguig", "Pasig", "Zamboanga City", "Cagayan de Oro",
    "Iloilo City", "Bacolod", "Baguio",
  ]),
  SG: c("Singapore", ["Singapore"]),
  MY: c("Malaysia", ["Kuala Lumpur", "George Town", "Johor Bahru", "Ipoh", "Shah Alam", "Petaling Jaya", "Kota Kinabalu", "Kuching", "Malacca City"]),
  HK: c("Hong Kong", ["Hong Kong"]),
  NG: c("Nigeria", ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Benin City", "Kaduna", "Enugu", "Abeokuta"]),
  GH: c("Ghana", ["Accra", "Kumasi", "Tamale", "Takoradi", "Cape Coast"]),
  KE: c("Kenya", ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"]),
  UG: c("Uganda", ["Kampala", "Entebbe", "Gulu", "Mbarara"]),
  TZ: c("Tanzania", ["Dar es Salaam", "Dodoma", "Arusha", "Mwanza", "Zanzibar City"]),
  ZM: c("Zambia", ["Lusaka", "Kitwe", "Ndola", "Livingstone"]),
  ZW: c("Zimbabwe", ["Harare", "Bulawayo", "Mutare"]),
  BW: c("Botswana", ["Gaborone", "Francistown"]),
  NA: c("Namibia", ["Windhoek", "Walvis Bay", "Swakopmund"]),
  MW: c("Malawi", ["Lilongwe", "Blantyre"]),
  MU: c("Mauritius", ["Port Louis", "Curepipe", "Quatre Bornes"]),
  JM: c("Jamaica", ["Kingston", "Montego Bay", "Spanish Town"]),
  TT: c("Trinidad and Tobago", ["Port of Spain", "San Fernando", "Chaguanas"]),
  BS: c("Bahamas", ["Nassau", "Freeport"]),
  BB: c("Barbados", ["Bridgetown"]),
  BZ: c("Belize", ["Belize City", "Belmopan"]),
  AG: c("Antigua and Barbuda", ["St. John's"]),
  LC: c("Saint Lucia", ["Castries"]),
  GD: c("Grenada", ["St. George's"]),
  GY: c("Guyana", ["Georgetown"]),
  MT: c("Malta", ["Valletta", "Birkirkara", "Sliema", "St. Julian's"]),
  FJ: c("Fiji", ["Suva", "Nadi"]),
  PG: c("Papua New Guinea", ["Port Moresby", "Lae"]),
  BM: c("Bermuda", ["Hamilton"]),
  KY: c("Cayman Islands", ["George Town"]),
  DM: c("Dominica", ["Roseau"]),
  KN: c("Saint Kitts and Nevis", ["Basseterre"]),
  VC: c("Saint Vincent and the Grenadines", ["Kingstown"]),
  SC: c("Seychelles", ["Victoria"]),
  // Spanish
  ES: c("Spain", [
    "Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia", "Palma", "Las Palmas de Gran Canaria",
    "Bilbao", "Alicante", "Córdoba", "Valladolid", "Vigo", "Gijón", "A Coruña", "Granada", "Vitoria-Gasteiz",
    "Santa Cruz de Tenerife", "Pamplona", "San Sebastián", "Santander", "Salamanca", "Marbella",
  ]),
  MX: c("Mexico", [
    "Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León", "Ciudad Juárez", "Zapopan", "Mérida",
    "San Luis Potosí", "Querétaro", "Aguascalientes", "Hermosillo", "Saltillo", "Mexicali", "Culiacán", "Chihuahua",
    "Morelia", "Toluca", "Cancún", "Veracruz", "Acapulco", "Torreón", "Oaxaca",
  ]),
  AR: c("Argentina", [
    "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "San Miguel de Tucumán", "Mar del Plata", "Salta",
    "Santa Fe", "San Juan", "Neuquén", "Bahía Blanca",
  ]),
  CO: c("Colombia", [
    "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira", "Santa Marta", "Ibagué",
    "Manizales", "Cúcuta",
  ]),
  CL: c("Chile", ["Santiago", "Valparaíso", "Viña del Mar", "Concepción", "Antofagasta", "La Serena", "Temuco", "Rancagua", "Iquique", "Puerto Montt"]),
  PE: c("Peru", ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", "Cusco", "Iquitos", "Huancayo"]),
  VE: c("Venezuela", ["Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay"]),
  EC: c("Ecuador", ["Guayaquil", "Quito", "Cuenca", "Santo Domingo", "Manta"]),
  GT: c("Guatemala", ["Guatemala City", "Quetzaltenango", "Mixco"]),
  BO: c("Bolivia", ["Santa Cruz de la Sierra", "La Paz", "El Alto", "Cochabamba", "Sucre"]),
  DO: c("Dominican Republic", ["Santo Domingo", "Santiago de los Caballeros", "Punta Cana", "La Romana"]),
  HN: c("Honduras", ["Tegucigalpa", "San Pedro Sula"]),
  PY: c("Paraguay", ["Asunción", "Ciudad del Este", "Encarnación"]),
  SV: c("El Salvador", ["San Salvador", "Santa Ana", "San Miguel"]),
  NI: c("Nicaragua", ["Managua", "León"]),
  CR: c("Costa Rica", ["San José", "Alajuela", "Heredia", "Cartago", "Liberia"]),
  PA: c("Panama", ["Panama City", "Colón", "David"]),
  UY: c("Uruguay", ["Montevideo", "Punta del Este", "Salto"]),
  PR: c("Puerto Rico", ["San Juan", "Bayamón", "Carolina", "Ponce", "Caguas"]),
  GQ: c("Equatorial Guinea", ["Malabo", "Bata"]),
  // French
  FR: c("France", [
    "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Montpellier", "Strasbourg", "Bordeaux", "Lille",
    "Rennes", "Reims", "Toulon", "Saint-Étienne", "Le Havre", "Grenoble", "Dijon", "Angers", "Nîmes", "Clermont-Ferrand",
    "Aix-en-Provence", "Brest", "Tours", "Limoges", "Amiens", "Annecy", "Metz", "Perpignan", "Besançon", "Orléans",
    "Rouen", "Caen", "Nancy",
  ]),
  BE: c("Belgium", ["Brussels", "Antwerp", "Ghent", "Charleroi", "Liège", "Bruges", "Namur", "Leuven", "Mons"]),
  CH: c("Switzerland", ["Zurich", "Geneva", "Basel", "Lausanne", "Bern", "Winterthur", "Lucerne", "St. Gallen", "Lugano", "Biel/Bienne"]),
  LU: c("Luxembourg", ["Luxembourg City", "Esch-sur-Alzette"]),
  MC: c("Monaco", ["Monaco"]),
  CI: c("Côte d'Ivoire", ["Abidjan", "Bouaké", "Yamoussoukro"]),
  SN: c("Senegal", ["Dakar", "Thiès", "Saint-Louis"]),
  CM: c("Cameroon", ["Douala", "Yaoundé", "Bamenda"]),
  BF: c("Burkina Faso", ["Ouagadougou", "Bobo-Dioulasso"]),
  ML: c("Mali", ["Bamako"]),
  NE: c("Niger", ["Niamey"]),
  BJ: c("Benin", ["Cotonou", "Porto-Novo"]),
  TG: c("Togo", ["Lomé"]),
  GA: c("Gabon", ["Libreville", "Port-Gentil"]),
  CG: c("Republic of the Congo", ["Brazzaville", "Pointe-Noire"]),
  CD: c("Democratic Republic of the Congo", ["Kinshasa", "Lubumbashi", "Goma"]),
  MG: c("Madagascar", ["Antananarivo", "Toamasina"]),
  HT: c("Haiti", ["Port-au-Prince", "Cap-Haïtien"]),
  RW: c("Rwanda", ["Kigali"]),
  MA: c("Morocco", ["Casablanca", "Rabat", "Marrakesh", "Fez", "Tangier", "Agadir"]),
  TN: c("Tunisia", ["Tunis", "Sfax", "Sousse"]),
  RE: c("Réunion", ["Saint-Denis", "Saint-Pierre"]),
  GP: c("Guadeloupe", ["Pointe-à-Pitre", "Les Abymes"]),
  MQ: c("Martinique", ["Fort-de-France"]),
  GF: c("French Guiana", ["Cayenne"]),
  PF: c("French Polynesia", ["Papeete"]),
  NC: c("New Caledonia", ["Nouméa"]),
  // German
  DE: c("Germany", [
    "Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt am Main", "Stuttgart", "Düsseldorf", "Leipzig", "Dortmund",
    "Essen", "Bremen", "Dresden", "Hanover", "Nuremberg", "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn",
    "Münster", "Mannheim", "Karlsruhe", "Augsburg", "Wiesbaden", "Mönchengladbach", "Gelsenkirchen", "Aachen",
    "Braunschweig", "Kiel", "Chemnitz", "Freiburg im Breisgau", "Mainz", "Rostock", "Heidelberg", "Regensburg",
  ]),
  AT: c("Austria", ["Vienna", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt", "Villach", "Wels", "St. Pölten"]),
  LI: c("Liechtenstein", ["Vaduz", "Schaan"]),
  // Italian
  IT: c("Italy", [
    "Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", "Bari", "Catania", "Venice",
    "Verona", "Messina", "Padua", "Trieste", "Brescia", "Parma", "Taranto", "Prato", "Modena", "Reggio Calabria",
    "Reggio Emilia", "Perugia", "Livorno", "Cagliari", "Bergamo", "Pescara", "Trento", "Bolzano",
  ]),
  SM: c("San Marino", ["San Marino"]),
  VA: c("Vatican City", ["Vatican City"]),
  // Japanese
  JP: c("Japan", [
    "Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kawasaki", "Kyoto", "Saitama",
    "Hiroshima", "Sendai", "Chiba", "Kitakyushu", "Sakai", "Niigata", "Hamamatsu", "Kumamoto", "Sagamihara",
    "Okayama", "Shizuoka", "Kagoshima", "Matsuyama", "Utsunomiya", "Kanazawa", "Naha",
  ]),
};
