/**
 * lib/country-code.ts
 *
 * Single source of truth for destination → ISO 3166-1 alpha-2 country code mapping.
 * Used by every flag icon in the app (country-flag-icons/react/3x2).
 *
 * HOW THE LOOKUP WORKS:
 *   1. Normalize the destination string to lowercase
 *   2. Check if it contains any key from COUNTRY_MAP (longest-key-first to avoid
 *      "us" matching "aust-ralia")
 *   3. If not found, split on comma and check the last segment (e.g. "Cebu, Philippines" → "philippines")
 *   4. Return null if still not found — callers should hide the flag rather than show a wrong one
 *
 * TO ADD A NEW DESTINATION:
 *   Add a `"city name": "XX"` entry to COUNTRY_MAP and, optionally, a coords entry
 *   to CITY_COORDS below. That's it — all flag icons across the app will auto-update.
 */

// ── Country Code Map ─────────────────────────────────────────────────────────
// Keys are lowercase destination names / city names / country names.
// Values are ISO 3166-1 alpha-2 codes (UPPERCASE — matches country-flag-icons).

const COUNTRY_MAP: Record<string, string> = {
  // ── East Asia ────────────────────────────────────────────────────────────
  japan: "JP",
  tokyo: "JP",
  kyoto: "JP",
  osaka: "JP",
  hiroshima: "JP",
  hokkaido: "JP",
  nara: "JP",
  okinawa: "JP",
  china: "CN",
  beijing: "CN",
  shanghai: "CN",
  "hong kong": "HK",
  taiwan: "TW",
  taipei: "TW",
  "south korea": "KR",
  korea: "KR",
  seoul: "KR",
  busan: "KR",
  mongolia: "MN",
  ulaanbaatar: "MN",

  // ── Southeast Asia ───────────────────────────────────────────────────────
  philippines: "PH",
  manila: "PH",
  cebu: "PH",
  palawan: "PH",
  boracay: "PH",
  davao: "PH",
  siargao: "PH",
  "el nido": "PH",
  indonesia: "ID",
  bali: "ID",
  jakarta: "ID",
  lombok: "ID",
  komodo: "ID",
  "raja ampat": "ID",
  yogyakarta: "ID",
  thailand: "TH",
  bangkok: "TH",
  phuket: "TH",
  "chiang mai": "TH",
  "ko samui": "TH",
  "koh samui": "TH",
  krabi: "TH",
  vietnam: "VN",
  hanoi: "VN",
  "ho chi minh": "VN",
  "hoi an": "VN",
  "ha long": "VN",
  halong: "VN",
  danang: "VN",
  "da nang": "VN",
  singapore: "SG",
  malaysia: "MY",
  "kuala lumpur": "MY",
  penang: "MY",
  langkawi: "MY",
  myanmar: "MM",
  burma: "MM",
  yangon: "MM",
  bagan: "MM",
  cambodia: "KH",
  "siem reap": "KH",
  "phnom penh": "KH",
  laos: "LA",
  "luang prabang": "LA",
  vientiane: "LA",
  "east timor": "TL",
  "timor-leste": "TL",
  brunei: "BN",

  // ── South Asia ───────────────────────────────────────────────────────────
  india: "IN",
  delhi: "IN",
  mumbai: "IN",
  goa: "IN",
  jaipur: "IN",
  agra: "IN",
  rajasthan: "IN",
  kerala: "IN",
  "new delhi": "IN",
  bangalore: "IN",
  bengaluru: "IN",
  hyderabad: "IN",
  kolkata: "IN",
  varanasi: "IN",
  nepal: "NP",
  kathmandu: "NP",
  bhutan: "BT",
  thimphu: "BT",
  "sri lanka": "LK",
  colombo: "LK",
  pakistan: "PK",
  islamabad: "PK",
  lahore: "PK",
  karachi: "PK",
  bangladesh: "BD",
  dhaka: "BD",
  maldives: "MV",
  male: "MV",
  "mahe island": "MV",

  // ── Central Asia ─────────────────────────────────────────────────────────
  uzbekistan: "UZ",
  samarkand: "UZ",
  tashkent: "UZ",
  kazakhstan: "KZ",
  almaty: "KZ",
  kyrgyzstan: "KG",
  bishkek: "KG",
  tajikistan: "TJ",
  turkmenistan: "TM",
  afghanistan: "AF",

  // ── Middle East ──────────────────────────────────────────────────────────
  uae: "AE",
  "united arab emirates": "AE",
  dubai: "AE",
  "abu dhabi": "AE",
  sharjah: "AE",
  "saudi arabia": "SA",
  riyadh: "SA",
  jeddah: "SA",
  qatar: "QA",
  doha: "QA",
  bahrain: "BH",
  manama: "BH",
  kuwait: "KW",
  oman: "OM",
  muscat: "OM",
  jordan: "JO",
  amman: "JO",
  petra: "JO",
  israel: "IL",
  "tel aviv": "IL",
  jerusalem: "IL",
  lebanon: "LB",
  beirut: "LB",
  turkey: "TR",
  istanbul: "TR",
  cappadocia: "TR",
  ankara: "TR",
  antalya: "TR",
  iraq: "IQ",
  baghdad: "IQ",
  iran: "IR",
  tehran: "IR",

  // ── Europe ───────────────────────────────────────────────────────────────
  france: "FR",
  paris: "FR",
  nice: "FR",
  lyon: "FR",
  marseille: "FR",
  bordeaux: "FR",
  strasbourg: "FR",
  "french riviera": "FR",
  "côte d'azur": "FR",
  italy: "IT",
  rome: "IT",
  florence: "IT",
  venice: "IT",
  milan: "IT",
  amalfi: "IT",
  naples: "IT",
  sicily: "IT",
  sardinia: "IT",
  cinque: "IT",
  "cinque terre": "IT",
  spain: "ES",
  barcelona: "ES",
  madrid: "ES",
  seville: "ES",
  granada: "ES",
  valencia: "ES",
  ibiza: "ES",
  mallorca: "ES",
  majorca: "ES",
  germany: "DE",
  berlin: "DE",
  munich: "DE",
  hamburg: "DE",
  frankfurt: "DE",
  "united kingdom": "GB",
  uk: "GB",
  england: "GB",
  london: "GB",
  scotland: "GB",
  edinburgh: "GB",
  wales: "GB",
  ireland: "IE",
  dublin: "IE",
  netherlands: "NL",
  amsterdam: "NL",
  rotterdam: "NL",
  "the hague": "NL",
  belgium: "BE",
  brussels: "BE",
  bruges: "BE",
  ghent: "BE",
  switzerland: "CH",
  alps: "CH",
  zurich: "CH",
  geneva: "CH",
  bern: "CH",
  interlaken: "CH",
  austria: "AT",
  vienna: "AT",
  salzburg: "AT",
  innsbruck: "AT",
  czech: "CZ",
  prague: "CZ",
  poland: "PL",
  warsaw: "PL",
  krakow: "PL",
  hungary: "HU",
  budapest: "HU",
  romania: "RO",
  bucharest: "RO",
  transylvania: "RO",
  croatia: "HR",
  dubrovnik: "HR",
  split: "HR",
  hvar: "HR",
  slovenia: "SI",
  ljubljana: "SI",
  bled: "SI",
  slovakia: "SK",
  bratislava: "SK",
  serbia: "RS",
  belgrade: "RS",
  montenegro: "ME",
  kotor: "ME",
  "north macedonia": "MK",
  skopje: "MK",
  albania: "AL",
  tirana: "AL",
  greece: "GR",
  athens: "GR",
  santorini: "GR",
  mykonos: "GR",
  crete: "GR",
  corfu: "GR",
  rhodes: "GR",
  portugal: "PT",
  lisbon: "PT",
  porto: "PT",
  algarve: "PT",
  "azores": "PT",
  madeira: "PT",
  iceland: "IS",
  reykjavik: "IS",
  scandinavia: "NO",
  norway: "NO",
  oslo: "NO",
  bergen: "NO",
  fjords: "NO",
  lofoten: "NO",
  sweden: "SE",
  stockholm: "SE",
  gothenburg: "SE",
  denmark: "DK",
  copenhagen: "DK",
  finland: "FI",
  helsinki: "FI",
  lapland: "FI",
  russia: "RU",
  moscow: "RU",
  "st. petersburg": "RU",
  "saint petersburg": "RU",
  ukraine: "UA",
  kyiv: "UA",
  lviv: "UA",
  bulgaria: "BG",
  sofia: "BG",
  malta: "MT",
  valletta: "MT",
  luxembourg: "LU",
  liechtenstein: "LI",
  andorra: "AD",
  monaco: "MC",
  "san marino": "SM",
  vatican: "VA",
  estonia: "EE",
  tallinn: "EE",
  latvia: "LV",
  riga: "LV",
  lithuania: "LT",
  vilnius: "LT",

  // ── Africa ───────────────────────────────────────────────────────────────
  egypt: "EG",
  cairo: "EG",
  luxor: "EG",
  "sharm el sheikh": "EG",
  "hurghada": "EG",
  morocco: "MA",
  marrakech: "MA",
  fez: "MA",
  casablanca: "MA",
  "south africa": "ZA",
  "cape town": "ZA",
  johannesburg: "ZA",
  safari: "KE",
  kenya: "KE",
  nairobi: "KE",
  "maasai mara": "KE",
  tanzania: "TZ",
  "mount kilimanjaro": "TZ",
  serengeti: "TZ",
  zanzibar: "TZ",
  ethiopia: "ET",
  addis: "ET",
  ghana: "GH",
  accra: "GH",
  nigeria: "NG",
  lagos: "NG",
  senegal: "SN",
  dakar: "SN",
  madagascar: "MG",
  "ivory coast": "CI",
  seychelles: "SC",
  mauritius: "MU",
  "reunion island": "RE",
  rwanda: "RW",
  kigali: "RW",
  uganda: "UG",
  kampala: "UG",
  zambia: "ZM",
  zimbabwe: "ZW",
  botswana: "BW",
  namibia: "NA",
  windhoek: "NA",
  mozambique: "MZ",
  malawi: "MW",
  "burkina faso": "BF",
  cameroon: "CM",
  gabon: "GA",
  congo: "CG",
  angola: "AO",
  liberia: "LR",
  "sierra leone": "SL",
  mali: "ML",
  "niger": "NE",
  chad: "TD",
  sudan: "SD",
  somalia: "SO",
  djibouti: "DJ",
  eritrea: "ER",
  comoros: "KM",
  "cape verde": "CV",
  "sao tome": "ST",
  tunisia: "TN",
  tunis: "TN",
  algeria: "DZ",
  algiers: "DZ",
  libya: "LY",
  tripoli: "LY",

  // ── Americas — North ─────────────────────────────────────────────────────
  usa: "US",
  "united states": "US",
  "new york": "US",
  california: "US",
  hawaii: "US",
  miami: "US",
  "las vegas": "US",
  "los angeles": "US",
  chicago: "US",
  "san francisco": "US",
  boston: "US",
  seattle: "US",
  portland: "US",
  denver: "US",
  phoenix: "US",
  nashville: "US",
  "new orleans": "US",
  austin: "US",
  canada: "CA",
  toronto: "CA",
  vancouver: "CA",
  montreal: "CA",
  quebec: "CA",
  calgary: "CA",
  mexico: "MX",
  cancun: "MX",
  "mexico city": "MX",
  "playa del carmen": "MX",
  tulum: "MX",
  oaxaca: "MX",
  guadalajara: "MX",
  "los cabos": "MX",
  "cabo san lucas": "MX",
  cuba: "CU",
  havana: "CU",
  "costa rica": "CR",
  "san jose": "CR",
  panama: "PA",
  "panama city": "PA",
  guatemala: "GT",
  belize: "BZ",
  honduras: "HN",
  nicaragua: "NI",
  "el salvador": "SV",
  "dominican republic": "DO",
  "punta cana": "DO",
  "santo domingo": "DO",
  jamaica: "JM",
  kingston: "JM",
  bahamas: "BS",
  nassau: "BS",
  barbados: "BB",
  bridgetown: "BB",
  trinidad: "TT",
  "puerto rico": "PR",
  "san juan": "PR",
  haiti: "HT",
  aruba: "AW",
  curacao: "CW",
  martinique: "MQ",
  guadeloupe: "GP",

  // ── Americas — South ─────────────────────────────────────────────────────
  brazil: "BR",
  "rio de janeiro": "BR",
  "sao paulo": "BR",
  salvador: "BR",
  amazonas: "BR",
  "iguazu falls": "AR",
  argentina: "AR",
  "buenos aires": "AR",
  patagonia: "AR",
  mendoza: "AR",
  chile: "CL",
  santiago: "CL",
  "torres del paine": "CL",
  "easter island": "CL",
  colombia: "CO",
  bogota: "CO",
  cartagena: "CO",
  medellin: "CO",
  peru: "PE",
  lima: "PE",
  "machu picchu": "PE",
  cusco: "PE",
  "lake titicaca": "PE",
  ecuador: "EC",
  quito: "EC",
  galapagos: "EC",
  bolivia: "BO",
  "la paz": "BO",
  "salt flats": "BO",
  venezuela: "VE",
  caracas: "VE",
  paraguay: "PY",
  uruguay: "UY",
  montevideo: "UY",
  guyana: "GY",
  suriname: "SR",

  // ── Oceania ───────────────────────────────────────────────────────────────
  australia: "AU",
  sydney: "AU",
  melbourne: "AU",
  brisbane: "AU",
  "gold coast": "AU",
  "great barrier reef": "AU",
  perth: "AU",
  cairns: "AU",
  adelaide: "AU",
  uluru: "AU",
  "new zealand": "NZ",
  auckland: "NZ",
  queenstown: "NZ",
  christchurch: "NZ",
  wellington: "NZ",
  fiji: "FJ",
  suva: "FJ",
  "nadi": "FJ",
  "papua new guinea": "PG",
  "solomon islands": "SB",
  vanuatu: "VU",
  samoa: "WS",
  tonga: "TO",
  "new caledonia": "NC",
  "french polynesia": "PF",
  tahiti: "PF",
  "bora bora": "PF",
  "cook islands": "CK",
  guam: "GU",
  palau: "PW",
  micronesia: "FM",
  "marshall islands": "MH",
  kiribati: "KI",
  tuvalu: "TV",
  nauru: "NR",
};

// ── Lookup Function ───────────────────────────────────────────────────────────

/**
 * Returns an ISO 3166-1 alpha-2 country code (e.g. "PH", "JP") for a destination string,
 * or null if no match is found.
 *
 * Returns null (not "US") for unknown destinations so callers can hide the flag
 * instead of showing the wrong country.
 */
export function getCountryCode(destination?: string | null): string | null {
  if (!destination) return null;

  const clean = destination.toLowerCase().trim();

  // Sort keys longest-first to avoid "us" inside "austral-us" false-matching
  const sortedKeys = Object.keys(COUNTRY_MAP).sort((a, b) => b.length - a.length);

  // 1. Check if destination contains any key (longest match first)
  for (const key of sortedKeys) {
    if (clean.includes(key)) {
      return COUNTRY_MAP[key];
    }
  }

  // 2. Extract last segment after comma (e.g. "Cebu, Philippines" → "philippines")
  const parts = clean.split(",");
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1].trim();
    if (COUNTRY_MAP[lastPart]) {
      return COUNTRY_MAP[lastPart];
    }
    // Also try first part (e.g. "Philippines, Cebu" → "philippines")
    const firstPart = parts[0].trim();
    if (COUNTRY_MAP[firstPart]) {
      return COUNTRY_MAP[firstPart];
    }
  }

  // 3. No match — return null so callers can choose not to show a flag
  return null;
}

// ── City Coordinates ──────────────────────────────────────────────────────────

export interface DestinationCoords {
  lat: number;
  lng: number;
  city: string;
  countryCode: string;
  isFallback?: boolean;
}

const CITY_COORDS: Record<string, { lat: number; lng: number; city: string; countryCode: string }> = {
  // East Asia
  tokyo: { lat: 35.6762, lng: 139.6503, city: "Tokyo", countryCode: "JP" },
  kyoto: { lat: 35.0116, lng: 135.7681, city: "Kyoto", countryCode: "JP" },
  osaka: { lat: 34.6937, lng: 135.5023, city: "Osaka", countryCode: "JP" },
  okinawa: { lat: 26.2124, lng: 127.6809, city: "Okinawa", countryCode: "JP" },
  beijing: { lat: 39.9042, lng: 116.4074, city: "Beijing", countryCode: "CN" },
  shanghai: { lat: 31.2304, lng: 121.4737, city: "Shanghai", countryCode: "CN" },
  "hong kong": { lat: 22.3193, lng: 114.1694, city: "Hong Kong", countryCode: "HK" },
  taipei: { lat: 25.032, lng: 121.5654, city: "Taipei", countryCode: "TW" },
  seoul: { lat: 37.5665, lng: 126.978, city: "Seoul", countryCode: "KR" },
  busan: { lat: 35.1796, lng: 129.0756, city: "Busan", countryCode: "KR" },

  // Southeast Asia
  philippines: { lat: 12.8797, lng: 121.774, city: "Philippines", countryCode: "PH" },
  manila: { lat: 14.5995, lng: 120.9842, city: "Manila", countryCode: "PH" },
  cebu: { lat: 10.3157, lng: 123.8854, city: "Cebu", countryCode: "PH" },
  palawan: { lat: 9.8349, lng: 118.7384, city: "Palawan", countryCode: "PH" },
  boracay: { lat: 11.9674, lng: 121.9248, city: "Boracay", countryCode: "PH" },
  siargao: { lat: 9.8503, lng: 126.0458, city: "Siargao", countryCode: "PH" },
  "el nido": { lat: 11.1784, lng: 119.4059, city: "El Nido", countryCode: "PH" },
  bali: { lat: -8.4095, lng: 115.1889, city: "Bali", countryCode: "ID" },
  jakarta: { lat: -6.2088, lng: 106.8456, city: "Jakarta", countryCode: "ID" },
  bangkok: { lat: 13.7563, lng: 100.5018, city: "Bangkok", countryCode: "TH" },
  phuket: { lat: 7.8804, lng: 98.3923, city: "Phuket", countryCode: "TH" },
  "chiang mai": { lat: 18.7883, lng: 98.9853, city: "Chiang Mai", countryCode: "TH" },
  hanoi: { lat: 21.0285, lng: 105.8542, city: "Hanoi", countryCode: "VN" },
  "ho chi minh": { lat: 10.8231, lng: 106.6297, city: "Ho Chi Minh City", countryCode: "VN" },
  "hoi an": { lat: 15.8801, lng: 108.338, city: "Hoi An", countryCode: "VN" },
  singapore: { lat: 1.3521, lng: 103.8198, city: "Singapore", countryCode: "SG" },
  "kuala lumpur": { lat: 3.139, lng: 101.6869, city: "Kuala Lumpur", countryCode: "MY" },
  yangon: { lat: 16.8661, lng: 96.1951, city: "Yangon", countryCode: "MM" },
  "siem reap": { lat: 13.3633, lng: 103.856, city: "Siem Reap", countryCode: "KH" },
  "luang prabang": { lat: 19.8831, lng: 102.135, city: "Luang Prabang", countryCode: "LA" },

  // South Asia
  madurai: { lat: 9.9261, lng: 78.1141, city: "Madurai", countryCode: "IN" },
  chennai: { lat: 13.0827, lng: 80.2707, city: "Chennai", countryCode: "IN" },
  bangalore: { lat: 12.9716, lng: 77.5946, city: "Bangalore", countryCode: "IN" },
  bengaluru: { lat: 12.9716, lng: 77.5946, city: "Bengaluru", countryCode: "IN" },
  hyderabad: { lat: 17.3850, lng: 78.4867, city: "Hyderabad", countryCode: "IN" },
  delhi: { lat: 28.6139, lng: 77.209, city: "Delhi", countryCode: "IN" },
  mumbai: { lat: 19.076, lng: 72.8777, city: "Mumbai", countryCode: "IN" },
  goa: { lat: 15.2993, lng: 74.124, city: "Goa", countryCode: "IN" },
  kochi: { lat: 9.9312, lng: 76.2673, city: "Kochi", countryCode: "IN" },
  cochin: { lat: 9.9312, lng: 76.2673, city: "Cochin", countryCode: "IN" },
  coimbatore: { lat: 11.0168, lng: 76.9558, city: "Coimbatore", countryCode: "IN" },
  kolkata: { lat: 22.5726, lng: 88.3639, city: "Kolkata", countryCode: "IN" },
  jaipur: { lat: 26.9124, lng: 75.7873, city: "Jaipur", countryCode: "IN" },
  agra: { lat: 27.1767, lng: 78.0081, city: "Agra", countryCode: "IN" },
  varanasi: { lat: 25.3176, lng: 82.9739, city: "Varanasi", countryCode: "IN" },
  udaipur: { lat: 24.5854, lng: 73.7125, city: "Udaipur", countryCode: "IN" },
  mysore: { lat: 12.2958, lng: 76.6394, city: "Mysore", countryCode: "IN" },
  mysuru: { lat: 12.2958, lng: 76.6394, city: "Mysuru", countryCode: "IN" },
  pondicherry: { lat: 11.9416, lng: 79.8083, city: "Pondicherry", countryCode: "IN" },
  puducherry: { lat: 11.9416, lng: 79.8083, city: "Puducherry", countryCode: "IN" },
  amritsar: { lat: 31.6340, lng: 74.8723, city: "Amritsar", countryCode: "IN" },
  shimla: { lat: 31.1048, lng: 77.1734, city: "Shimla", countryCode: "IN" },
  rishikesh: { lat: 30.0869, lng: 78.2676, city: "Rishikesh", countryCode: "IN" },
  kanyakumari: { lat: 8.0883, lng: 77.5385, city: "Kanyakumari", countryCode: "IN" },
  alleppey: { lat: 9.4981, lng: 76.3388, city: "Alleppey", countryCode: "IN" },
  alappuzha: { lat: 9.4981, lng: 76.3388, city: "Alappuzha", countryCode: "IN" },
  ooty: { lat: 11.4102, lng: 76.6950, city: "Ooty", countryCode: "IN" },
  thanjavur: { lat: 10.7870, lng: 79.1378, city: "Thanjavur", countryCode: "IN" },
  kathmandu: { lat: 27.7172, lng: 85.324, city: "Kathmandu", countryCode: "NP" },
  colombo: { lat: 6.9271, lng: 79.8612, city: "Colombo", countryCode: "LK" },
  male: { lat: 4.1755, lng: 73.5093, city: "Malé", countryCode: "MV" },
  maldives: { lat: 4.1755, lng: 73.5093, city: "Maldives", countryCode: "MV" },

  // Middle East
  dubai: { lat: 25.2048, lng: 55.2708, city: "Dubai", countryCode: "AE" },
  "abu dhabi": { lat: 24.4539, lng: 54.3773, city: "Abu Dhabi", countryCode: "AE" },
  doha: { lat: 25.2854, lng: 51.531, city: "Doha", countryCode: "QA" },
  muscat: { lat: 23.5880, lng: 58.3829, city: "Muscat", countryCode: "OM" },
  amman: { lat: 31.9539, lng: 35.9106, city: "Amman", countryCode: "JO" },
  petra: { lat: 30.3285, lng: 35.4444, city: "Petra", countryCode: "JO" },
  "tel aviv": { lat: 32.0853, lng: 34.7818, city: "Tel Aviv", countryCode: "IL" },
  istanbul: { lat: 41.0082, lng: 28.9784, city: "Istanbul", countryCode: "TR" },
  cappadocia: { lat: 38.6431, lng: 34.8289, city: "Cappadocia", countryCode: "TR" },

  // Europe
  paris: { lat: 48.8566, lng: 2.3522, city: "Paris", countryCode: "FR" },
  nice: { lat: 43.7102, lng: 7.262, city: "Nice", countryCode: "FR" },
  rome: { lat: 41.9028, lng: 12.4964, city: "Rome", countryCode: "IT" },
  vatican: { lat: 41.9029, lng: 12.4534, city: "Vatican City", countryCode: "VA" },
  "vatican city": { lat: 41.9029, lng: 12.4534, city: "Vatican City", countryCode: "VA" },
  florence: { lat: 43.7696, lng: 11.2558, city: "Florence", countryCode: "IT" },
  venice: { lat: 45.4408, lng: 12.3155, city: "Venice", countryCode: "IT" },
  milan: { lat: 45.4642, lng: 9.19, city: "Milan", countryCode: "IT" },
  amalfi: { lat: 40.634, lng: 14.6027, city: "Amalfi", countryCode: "IT" },
  naples: { lat: 40.8518, lng: 14.2681, city: "Naples", countryCode: "IT" },
  barcelona: { lat: 41.3851, lng: 2.1734, city: "Barcelona", countryCode: "ES" },
  madrid: { lat: 40.4168, lng: -3.7038, city: "Madrid", countryCode: "ES" },
  seville: { lat: 37.3891, lng: -5.9845, city: "Seville", countryCode: "ES" },
  berlin: { lat: 52.52, lng: 13.405, city: "Berlin", countryCode: "DE" },
  munich: { lat: 48.1351, lng: 11.582, city: "Munich", countryCode: "DE" },
  london: { lat: 51.5074, lng: -0.1278, city: "London", countryCode: "GB" },
  edinburgh: { lat: 55.9533, lng: -3.1883, city: "Edinburgh", countryCode: "GB" },
  dublin: { lat: 53.3498, lng: -6.2603, city: "Dublin", countryCode: "IE" },
  amsterdam: { lat: 52.3676, lng: 4.9041, city: "Amsterdam", countryCode: "NL" },
  brussels: { lat: 50.8503, lng: 4.3517, city: "Brussels", countryCode: "BE" },
  zurich: { lat: 47.3769, lng: 8.5417, city: "Zurich", countryCode: "CH" },
  geneva: { lat: 46.2044, lng: 6.1432, city: "Geneva", countryCode: "CH" },
  interlaken: { lat: 46.6863, lng: 7.8632, city: "Interlaken", countryCode: "CH" },
  vienna: { lat: 48.2082, lng: 16.3738, city: "Vienna", countryCode: "AT" },
  salzburg: { lat: 47.8095, lng: 13.055, city: "Salzburg", countryCode: "AT" },
  prague: { lat: 50.0755, lng: 14.4378, city: "Prague", countryCode: "CZ" },
  warsaw: { lat: 52.2297, lng: 21.0122, city: "Warsaw", countryCode: "PL" },
  krakow: { lat: 50.0647, lng: 19.945, city: "Kraków", countryCode: "PL" },
  budapest: { lat: 47.4979, lng: 19.0402, city: "Budapest", countryCode: "HU" },
  dubrovnik: { lat: 42.6507, lng: 18.0944, city: "Dubrovnik", countryCode: "HR" },
  athens: { lat: 37.9838, lng: 23.7275, city: "Athens", countryCode: "GR" },
  santorini: { lat: 36.3932, lng: 25.4615, city: "Santorini", countryCode: "GR" },
  mykonos: { lat: 37.4467, lng: 25.3289, city: "Mykonos", countryCode: "GR" },
  lisbon: { lat: 38.7223, lng: -9.1393, city: "Lisbon", countryCode: "PT" },
  porto: { lat: 41.1579, lng: -8.6291, city: "Porto", countryCode: "PT" },
  reykjavik: { lat: 64.1466, lng: -21.9426, city: "Reykjavik", countryCode: "IS" },
  oslo: { lat: 59.9139, lng: 10.7522, city: "Oslo", countryCode: "NO" },
  stockholm: { lat: 59.3293, lng: 18.0686, city: "Stockholm", countryCode: "SE" },
  copenhagen: { lat: 55.6761, lng: 12.5683, city: "Copenhagen", countryCode: "DK" },
  helsinki: { lat: 60.1699, lng: 24.9384, city: "Helsinki", countryCode: "FI" },
  moscow: { lat: 55.7558, lng: 37.6173, city: "Moscow", countryCode: "RU" },

  // Africa
  cairo: { lat: 30.0444, lng: 31.2357, city: "Cairo", countryCode: "EG" },
  luxor: { lat: 25.6872, lng: 32.6396, city: "Luxor", countryCode: "EG" },
  marrakech: { lat: 31.6295, lng: -7.9811, city: "Marrakech", countryCode: "MA" },
  "cape town": { lat: -33.9249, lng: 18.4241, city: "Cape Town", countryCode: "ZA" },
  nairobi: { lat: -1.286389, lng: 36.817223, city: "Nairobi", countryCode: "KE" },
  zanzibar: { lat: -6.165, lng: 39.202, city: "Zanzibar", countryCode: "TZ" },

  // Americas
  "new york": { lat: 40.7128, lng: -74.006, city: "New York", countryCode: "US" },
  california: { lat: 36.7783, lng: -119.4179, city: "California", countryCode: "US" },
  hawaii: { lat: 21.3069, lng: -157.8583, city: "Honolulu", countryCode: "US" },
  miami: { lat: 25.7617, lng: -80.1918, city: "Miami", countryCode: "US" },
  "las vegas": { lat: 36.1699, lng: -115.1398, city: "Las Vegas", countryCode: "US" },
  "los angeles": { lat: 34.0522, lng: -118.2437, city: "Los Angeles", countryCode: "US" },
  chicago: { lat: 41.8781, lng: -87.6298, city: "Chicago", countryCode: "US" },
  toronto: { lat: 43.6532, lng: -79.3832, city: "Toronto", countryCode: "CA" },
  vancouver: { lat: 49.2827, lng: -123.1207, city: "Vancouver", countryCode: "CA" },
  montreal: { lat: 45.5017, lng: -73.5673, city: "Montreal", countryCode: "CA" },
  cancun: { lat: 21.1619, lng: -86.8515, city: "Cancun", countryCode: "MX" },
  tulum: { lat: 20.2114, lng: -87.4654, city: "Tulum", countryCode: "MX" },
  "rio de janeiro": { lat: -22.9068, lng: -43.1729, city: "Rio de Janeiro", countryCode: "BR" },
  "buenos aires": { lat: -34.6037, lng: -58.3816, city: "Buenos Aires", countryCode: "AR" },
  lima: { lat: -12.0464, lng: -77.0428, city: "Lima", countryCode: "PE" },
  "machu picchu": { lat: -13.1631, lng: -72.545, city: "Machu Picchu", countryCode: "PE" },
  bogota: { lat: 4.711, lng: -74.0721, city: "Bogotá", countryCode: "CO" },
  cartagena: { lat: 10.391, lng: -75.4794, city: "Cartagena", countryCode: "CO" },
  quito: { lat: -0.1807, lng: -78.4678, city: "Quito", countryCode: "EC" },

  // Oceania
  sydney: { lat: -33.8688, lng: 151.2093, city: "Sydney", countryCode: "AU" },
  melbourne: { lat: -37.8136, lng: 144.9631, city: "Melbourne", countryCode: "AU" },
  brisbane: { lat: -27.4698, lng: 153.0251, city: "Brisbane", countryCode: "AU" },
  auckland: { lat: -36.8485, lng: 174.7633, city: "Auckland", countryCode: "NZ" },
  queenstown: { lat: -45.0312, lng: 168.6626, city: "Queenstown", countryCode: "NZ" },
  "bora bora": { lat: -16.5004, lng: -151.7415, city: "Bora Bora", countryCode: "PF" },
  tahiti: { lat: -17.5516, lng: -149.5585, city: "Tahiti", countryCode: "PF" },
  fiji: { lat: -17.7134, lng: 178.065, city: "Fiji", countryCode: "FJ" },
};

// ── Destination Coordinates ───────────────────────────────────────────────────

/**
 * Returns best-guess coordinates for a destination string.
 * Falls back to country capital if the specific city isn't found.
 */
export function getDestinationCoords(destination?: string | null): DestinationCoords {
  const code = getCountryCode(destination);

  if (!destination) {
    return { lat: 40.7128, lng: -74.006, city: "New York", countryCode: "US" };
  }

  const clean = destination.toLowerCase().trim();

  // Sort keys longest-first to prevent partial matches
  const sortedKeys = Object.keys(CITY_COORDS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (clean.includes(key)) {
      return CITY_COORDS[key];
    }
  }

  // Comma split fallback: "Cebu, Philippines" → try "cebu"
  const parts = clean.split(",");
  if (parts.length > 0) {
    for (const part of parts) {
      const trimmed = part.trim();
      if (CITY_COORDS[trimmed]) return CITY_COORDS[trimmed];
    }
  }

  // Country-level fallback coordinates (capital cities)
  const COUNTRY_CAPITALS: Record<string, DestinationCoords> = {
    JP: { lat: 35.6762, lng: 139.6503, city: "Tokyo", countryCode: "JP" },
    CN: { lat: 39.9042, lng: 116.4074, city: "Beijing", countryCode: "CN" },
    HK: { lat: 22.3193, lng: 114.1694, city: "Hong Kong", countryCode: "HK" },
    TW: { lat: 25.032, lng: 121.5654, city: "Taipei", countryCode: "TW" },
    KR: { lat: 37.5665, lng: 126.978, city: "Seoul", countryCode: "KR" },
    PH: { lat: 14.5995, lng: 120.9842, city: "Manila", countryCode: "PH" },
    ID: { lat: -8.4095, lng: 115.1889, city: "Bali", countryCode: "ID" },
    TH: { lat: 13.7563, lng: 100.5018, city: "Bangkok", countryCode: "TH" },
    VN: { lat: 21.0285, lng: 105.8542, city: "Hanoi", countryCode: "VN" },
    SG: { lat: 1.3521, lng: 103.8198, city: "Singapore", countryCode: "SG" },
    MY: { lat: 3.139, lng: 101.6869, city: "Kuala Lumpur", countryCode: "MY" },
    MM: { lat: 16.8661, lng: 96.1951, city: "Yangon", countryCode: "MM" },
    KH: { lat: 11.5449, lng: 104.8922, city: "Phnom Penh", countryCode: "KH" },
    LA: { lat: 17.9757, lng: 102.6331, city: "Vientiane", countryCode: "LA" },
    IN: { lat: 28.6139, lng: 77.209, city: "Delhi", countryCode: "IN" },
    NP: { lat: 27.7172, lng: 85.324, city: "Kathmandu", countryCode: "NP" },
    LK: { lat: 6.9271, lng: 79.8612, city: "Colombo", countryCode: "LK" },
    MV: { lat: 4.1755, lng: 73.5093, city: "Malé", countryCode: "MV" },
    AE: { lat: 25.2048, lng: 55.2708, city: "Dubai", countryCode: "AE" },
    SA: { lat: 24.6877, lng: 46.7219, city: "Riyadh", countryCode: "SA" },
    QA: { lat: 25.2854, lng: 51.531, city: "Doha", countryCode: "QA" },
    JO: { lat: 31.9539, lng: 35.9106, city: "Amman", countryCode: "JO" },
    IL: { lat: 31.7683, lng: 35.2137, city: "Jerusalem", countryCode: "IL" },
    TR: { lat: 41.0082, lng: 28.9784, city: "Istanbul", countryCode: "TR" },
    FR: { lat: 48.8566, lng: 2.3522, city: "Paris", countryCode: "FR" },
    IT: { lat: 41.9028, lng: 12.4964, city: "Rome", countryCode: "IT" },
    ES: { lat: 40.4168, lng: -3.7038, city: "Madrid", countryCode: "ES" },
    DE: { lat: 52.52, lng: 13.405, city: "Berlin", countryCode: "DE" },
    GB: { lat: 51.5074, lng: -0.1278, city: "London", countryCode: "GB" },
    IE: { lat: 53.3498, lng: -6.2603, city: "Dublin", countryCode: "IE" },
    NL: { lat: 52.3676, lng: 4.9041, city: "Amsterdam", countryCode: "NL" },
    BE: { lat: 50.8503, lng: 4.3517, city: "Brussels", countryCode: "BE" },
    CH: { lat: 47.3769, lng: 8.5417, city: "Zurich", countryCode: "CH" },
    AT: { lat: 48.2082, lng: 16.3738, city: "Vienna", countryCode: "AT" },
    CZ: { lat: 50.0755, lng: 14.4378, city: "Prague", countryCode: "CZ" },
    PL: { lat: 52.2297, lng: 21.0122, city: "Warsaw", countryCode: "PL" },
    HU: { lat: 47.4979, lng: 19.0402, city: "Budapest", countryCode: "HU" },
    HR: { lat: 45.8150, lng: 15.9819, city: "Zagreb", countryCode: "HR" },
    GR: { lat: 37.9838, lng: 23.7275, city: "Athens", countryCode: "GR" },
    PT: { lat: 38.7223, lng: -9.1393, city: "Lisbon", countryCode: "PT" },
    IS: { lat: 64.1466, lng: -21.9426, city: "Reykjavik", countryCode: "IS" },
    NO: { lat: 59.9139, lng: 10.7522, city: "Oslo", countryCode: "NO" },
    SE: { lat: 59.3293, lng: 18.0686, city: "Stockholm", countryCode: "SE" },
    DK: { lat: 55.6761, lng: 12.5683, city: "Copenhagen", countryCode: "DK" },
    FI: { lat: 60.1699, lng: 24.9384, city: "Helsinki", countryCode: "FI" },
    RU: { lat: 55.7558, lng: 37.6173, city: "Moscow", countryCode: "RU" },
    EG: { lat: 30.0444, lng: 31.2357, city: "Cairo", countryCode: "EG" },
    MA: { lat: 33.9886, lng: -6.8539, city: "Rabat", countryCode: "MA" },
    ZA: { lat: -33.9249, lng: 18.4241, city: "Cape Town", countryCode: "ZA" },
    KE: { lat: -1.286389, lng: 36.817223, city: "Nairobi", countryCode: "KE" },
    TZ: { lat: -6.369028, lng: 34.888822, city: "Tanzania", countryCode: "TZ" },
    US: { lat: 40.7128, lng: -74.006, city: "New York", countryCode: "US" },
    CA: { lat: 43.6532, lng: -79.3832, city: "Toronto", countryCode: "CA" },
    MX: { lat: 19.4326, lng: -99.1332, city: "Mexico City", countryCode: "MX" },
    BR: { lat: -22.9068, lng: -43.1729, city: "Rio de Janeiro", countryCode: "BR" },
    AR: { lat: -34.6037, lng: -58.3816, city: "Buenos Aires", countryCode: "AR" },
    PE: { lat: -12.0464, lng: -77.0428, city: "Lima", countryCode: "PE" },
    CO: { lat: 4.711, lng: -74.0721, city: "Bogotá", countryCode: "CO" },
    AU: { lat: -33.8688, lng: 151.2093, city: "Sydney", countryCode: "AU" },
    NZ: { lat: -36.8485, lng: 174.7633, city: "Auckland", countryCode: "NZ" },
    FJ: { lat: -17.7134, lng: 178.065, city: "Suva", countryCode: "FJ" },
    VA: { lat: 41.9029, lng: 12.4534, city: "Vatican City", countryCode: "VA" },
    PF: { lat: -17.5516, lng: -149.5585, city: "Tahiti", countryCode: "PF" },
  };

  if (code && COUNTRY_CAPITALS[code]) {
    return {
      ...COUNTRY_CAPITALS[code],
      city: destination.split(",")[0].trim(),
      isFallback: true,
    };
  }

  // Final fallback — center of the world map (no wrong flag shown)
  return {
    lat: 20.0,
    lng: 0.0,
    city: destination.split(",")[0].trim(),
    countryCode: code ?? "US",
    isFallback: true,
  };
}

const DESTINATION_COORDS_CACHE = new Map<string, DestinationCoords>();

/**
 * Asynchronously resolve destination coordinates with Mapbox and Nominatim fallback.
 * Caches results in memory so dynamic resolutions are only performed once.
 */
export async function resolveDestinationCoords(
  destination?: string | null
): Promise<DestinationCoords | null> {
  if (!destination) return null;
  const clean = destination.toLowerCase().trim();
  if (DESTINATION_COORDS_CACHE.has(clean)) {
    return DESTINATION_COORDS_CACHE.get(clean)!;
  }

  // 1. Check if known statically without fallback
  const staticResult = getDestinationCoords(destination);
  if (staticResult && !staticResult.isFallback) {
    DESTINATION_COORDS_CACHE.set(clean, staticResult);
    return staticResult;
  }

  // 2. Geocode dynamically using Mapbox if token available
  const token =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
    process.env.MAPBOX_TOKEN;
  if (token) {
    try {
      const countryParam = staticResult?.countryCode
        ? `&country=${staticResult.countryCode.toLowerCase()}`
        : "";
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          destination
        )}.json?types=place,locality,region,country&limit=1${countryParam}&access_token=${token}`
      );
      if (res.ok) {
        const data = await res.json();
        const feat = data?.features?.[0];
        if (feat && Array.isArray(feat.center) && feat.center.length === 2) {
          const resolved: DestinationCoords = {
            lng: feat.center[0],
            lat: feat.center[1],
            city: feat.text || destination.split(",")[0].trim(),
            countryCode: staticResult?.countryCode || "US",
            isFallback: false,
          };
          DESTINATION_COORDS_CACHE.set(clean, resolved);
          return resolved;
        }
      }
    } catch {}
  }

  // 3. Geocode dynamically using Nominatim
  try {
    const nomRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        destination
      )}&format=json&limit=1`,
      { headers: { "User-Agent": "WanderAI/1.0" } }
    );
    if (nomRes.ok) {
      const data = await nomRes.json();
      if (Array.isArray(data) && data.length > 0) {
        const resolved: DestinationCoords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          city: destination.split(",")[0].trim(),
          countryCode: staticResult?.countryCode || "US",
          isFallback: false,
        };
        DESTINATION_COORDS_CACHE.set(clean, resolved);
        return resolved;
      }
    }
  } catch {}

  // 4. Fallback to static result
  return staticResult;
}

/**
 * Returns all matching ISO 3166-1 alpha-2 country codes for compound or single destinations.
 * E.g. "Rome and Vatican City" -> ["IT", "VA"]
 */
export function getCountryCodes(destination?: string | null): string[] {
  if (!destination) return [];
  const clean = destination.toLowerCase().trim();
  const codes = new Set<string>();

  const single = getCountryCode(destination);
  if (single) codes.add(single);

  const segments = clean.split(/,|\band\b|&|\//g).map((s) => s.trim()).filter(Boolean);
  for (const seg of segments) {
    const code = getCountryCode(seg);
    if (code) codes.add(code);
  }

  return Array.from(codes);
}

/**
 * Calculates geodesic distance in kilometers between two lat/lng coordinates,
 * taking cosine latitude scaling into account.
 */
export function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = (lat2 - lat1) * 111.0;
  const avgLatRad = ((lat1 + lat2) / 2) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * 111.0 * Math.cos(avgLatRad);
  return Math.hypot(dLat, dLng);
}

