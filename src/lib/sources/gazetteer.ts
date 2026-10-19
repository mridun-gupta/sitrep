/**
 * Toponym gazetteer — extracts geographic mentions from headlines.
 *
 * GDELT's geocoding endpoints are unreliable/deprecated, so Sitrep ships a
 * curated gazetteer of strategically-relevant places and country centroids.
 * This is a standard OSINT technique (place-name extraction) and makes the
 * map work with zero external geocoding dependencies.
 */

export interface Place {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  aliases: string[];
}

// [name, lat, lon, country, aliases…]
type P = [string, number, number, string, ...string[]];

const PLACES: P[] = [
  // ── Middle East ──────────────────────────────────────────────────────
  ['Gaza City', 31.5, 34.47, 'Palestine', 'Gaza'],
  ['Rafah', 31.29, 34.25, 'Palestine'],
  ['Khan Younis', 31.35, 34.3, 'Palestine'],
  ['Jerusalem', 31.77, 35.21, 'Israel'],
  ['Tel Aviv', 32.08, 34.78, 'Israel'],
  ['West Bank', 31.95, 35.3, 'Palestine'],
  ['Beirut', 33.89, 35.5, 'Lebanon'],
  ['Damascus', 33.51, 36.29, 'Syria'],
  ['Aleppo', 36.2, 37.13, 'Syria'],
  ['Tehran', 35.69, 51.39, 'Iran', 'Teheran'],
  ['Isfahan', 32.65, 51.68, 'Iran'],
  ['Baghdad', 33.32, 44.36, 'Iraq'],
  ['Mosul', 36.34, 43.13, 'Iraq'],
  ['Sanaa', 15.35, 44.21, 'Yemen', "Sana'a"],
  ['Aden', 12.79, 45.03, 'Yemen'],
  ['Hodeidah', 14.8, 42.95, 'Yemen'],
  ['Riyadh', 24.71, 46.68, 'Saudi Arabia'],
  ['Doha', 25.29, 51.53, 'Qatar'],
  ['Dubai', 25.2, 55.27, 'UAE'],
  ['Amman', 31.95, 35.93, 'Jordan'],
  ['Cairo', 30.04, 31.24, 'Egypt'],
  ['Istanbul', 41.01, 28.98, 'Turkey'],
  ['Ankara', 39.93, 32.86, 'Turkey'],
  ['Strait of Hormuz', 26.57, 56.25, '', 'Hormuz'],
  ['Red Sea', 20.0, 38.5, ''],
  ['Suez Canal', 30.7, 32.34, 'Egypt', 'Suez'],
  ['Bab el-Mandeb', 12.58, 43.33, '', 'Bab al-Mandab'],
  ['Golan Heights', 33.0, 35.75, ''],

  // ── Ukraine / Russia / Black Sea ─────────────────────────────────────
  ['Kyiv', 50.45, 30.52, 'Ukraine', 'Kiev'],
  ['Kharkiv', 49.99, 36.23, 'Ukraine', 'Kharkov'],
  ['Odesa', 46.48, 30.72, 'Ukraine', 'Odessa'],
  ['Dnipro', 48.46, 35.05, 'Ukraine'],
  ['Kherson', 46.64, 32.62, 'Ukraine'],
  ['Zaporizhzhia', 47.84, 35.14, 'Ukraine'],
  ['Donetsk', 48.0, 37.8, 'Ukraine'],
  ['Luhansk', 48.57, 39.3, 'Ukraine'],
  ['Mariupol', 47.1, 37.55, 'Ukraine'],
  ['Bakhmut', 48.59, 38.0, 'Ukraine'],
  ['Crimea', 45.3, 34.4, 'Ukraine'],
  ['Sevastopol', 44.62, 33.53, 'Ukraine'],
  ['Moscow', 55.75, 37.62, 'Russia'],
  ['Belgorod', 50.6, 36.58, 'Russia'],
  ['Kursk', 51.73, 36.19, 'Russia'],
  ['Black Sea', 43.4, 34.3, ''],
  ['Minsk', 53.9, 27.57, 'Belarus'],

  // ── Europe ───────────────────────────────────────────────────────────
  ['London', 51.51, -0.13, 'UK'],
  ['Paris', 48.86, 2.35, 'France'],
  ['Berlin', 52.52, 13.4, 'Germany'],
  ['Brussels', 50.85, 4.35, 'Belgium'],
  ['Warsaw', 52.23, 21.01, 'Poland'],
  ['Rome', 41.9, 12.5, 'Italy'],
  ['Madrid', 40.42, -3.7, 'Spain'],
  ['Athens', 37.98, 23.73, 'Greece'],
  ['Vienna', 48.21, 16.37, 'Austria'],
  ['Budapest', 47.5, 19.04, 'Hungary'],
  ['Prague', 50.08, 14.44, 'Czechia'],
  ['Stockholm', 59.33, 18.07, 'Sweden'],
  ['Oslo', 59.91, 10.75, 'Norway'],
  ['Helsinki', 60.17, 24.94, 'Finland'],
  ['Tallinn', 59.44, 24.75, 'Estonia'],
  ['Riga', 56.95, 24.11, 'Latvia'],
  ['Vilnius', 54.69, 25.28, 'Lithuania'],
  ['Chisinau', 47.01, 28.86, 'Moldova'],
  ['Tbilisi', 41.72, 44.79, 'Georgia'],
  ['Yerevan', 40.18, 44.51, 'Armenia'],
  ['Baku', 40.41, 49.87, 'Azerbaijan'],
  ['Belgrade', 44.79, 20.45, 'Serbia'],
  ['Pristina', 42.66, 21.17, 'Kosovo'],
  ['Sarajevo', 43.86, 18.41, 'Bosnia'],
  ['Geneva', 46.2, 6.14, 'Switzerland'],
  ['The Hague', 52.07, 4.3, 'Netherlands'],
  ['Kaliningrad', 54.71, 20.45, 'Russia'],

  // ── Asia ─────────────────────────────────────────────────────────────
  ['Beijing', 39.9, 116.4, 'China'],
  ['Shanghai', 31.23, 121.47, 'China'],
  ['Taipei', 25.03, 121.57, 'Taiwan'],
  ['Taiwan Strait', 24.0, 119.5, ''],
  ['Hong Kong', 22.32, 114.17, 'Hong Kong'],
  ['Seoul', 37.57, 126.98, 'South Korea'],
  ['Pyongyang', 39.03, 125.75, 'North Korea'],
  ['Tokyo', 35.68, 139.69, 'Japan'],
  ['New Delhi', 28.61, 77.21, 'India', 'Delhi'],
  ['Mumbai', 19.08, 72.88, 'India'],
  ['Islamabad', 33.68, 73.04, 'Pakistan'],
  ['Karachi', 24.86, 67.0, 'Pakistan'],
  ['Kabul', 34.53, 69.17, 'Afghanistan'],
  ['Dhaka', 23.81, 90.41, 'Bangladesh'],
  ['Kathmandu', 27.72, 85.32, 'Nepal'],
  ['Colombo', 6.93, 79.85, 'Sri Lanka'],
  ['Bangkok', 13.76, 100.5, 'Thailand'],
  ['Yangon', 16.84, 96.17, 'Myanmar'],
  ['Naypyidaw', 19.76, 96.08, 'Myanmar'],
  ['Manila', 14.6, 120.98, 'Philippines'],
  ['Hanoi', 21.03, 105.85, 'Vietnam'],
  ['Jakarta', -6.21, 106.85, 'Indonesia'],
  ['Singapore', 1.35, 103.82, 'Singapore'],
  ['Kuala Lumpur', 3.14, 101.69, 'Malaysia'],
  ['South China Sea', 12.0, 114.0, '', 'Spratly Islands', 'Spratlys'],
  ['Kashmir', 34.0, 76.5, ''],
  ['Urumqi', 43.83, 87.62, 'China'],
  ['Astana', 51.17, 71.43, 'Kazakhstan'],
  ['Tashkent', 41.3, 69.24, 'Uzbekistan'],

  // ── Africa ───────────────────────────────────────────────────────────
  ['Abuja', 9.06, 7.49, 'Nigeria'],
  ['Lagos', 6.52, 3.37, 'Nigeria'],
  ['Nairobi', -1.29, 36.82, 'Kenya'],
  ['Mogadishu', 2.05, 45.32, 'Somalia'],
  ['Khartoum', 15.5, 32.53, 'Sudan'],
  ['Port Sudan', 19.62, 37.22, 'Sudan'],
  ['El Fasher', 13.63, 25.35, 'Sudan', 'Al Fasher', 'Fasher'],
  ['Darfur', 13.5, 25.0, 'Sudan'],
  ['Juba', 4.85, 31.6, 'South Sudan'],
  ['Addis Ababa', 9.01, 38.75, 'Ethiopia'],
  ['Tigray', 13.5, 39.5, 'Ethiopia'],
  ['Kinshasa', -4.32, 15.31, 'DR Congo'],
  ['Goma', -1.68, 29.22, 'DR Congo'],
  ['Bamako', 12.64, -8.0, 'Mali'],
  ['Niamey', 13.51, 2.11, 'Niger'],
  ['Ouagadougou', 12.37, -1.52, 'Burkina Faso'],
  ['Sahel', 15.0, 0.0, ''],
  ['Tripoli', 32.9, 13.19, 'Libya'],
  ['Benghazi', 32.12, 20.07, 'Libya'],
  ['Tunis', 36.81, 10.18, 'Tunisia'],
  ['Algiers', 36.75, 3.06, 'Algeria'],
  ['Accra', 5.6, -0.19, 'Ghana'],
  ['Dakar', 14.72, -17.47, 'Senegal'],
  ['Johannesburg', -26.2, 28.05, 'South Africa'],
  ['Cape Town', -33.92, 18.42, 'South Africa'],
  ['Kampala', 0.35, 32.58, 'Uganda'],
  ['Dar es Salaam', -6.79, 39.21, 'Tanzania'],
  ['Harare', -17.83, 31.05, 'Zimbabwe'],
  ['Maputo', -25.97, 32.57, 'Mozambique'],

  // ── Americas ─────────────────────────────────────────────────────────
  ['Washington', 38.9, -77.04, 'USA', 'Washington DC', 'Washington, D.C.'],
  ['New York', 40.71, -74.0, 'USA'],
  ['Los Angeles', 34.05, -118.24, 'USA'],
  ['Chicago', 41.88, -87.63, 'USA'],
  ['Houston', 29.76, -95.37, 'USA'],
  ['Miami', 25.76, -80.19, 'USA'],
  ['Mexico City', 19.43, -99.13, 'Mexico'],
  ['Tijuana', 32.51, -117.03, 'Mexico'],
  ['Port-au-Prince', 18.59, -72.31, 'Haiti'],
  ['Havana', 23.11, -82.37, 'Cuba'],
  ['Guatemala City', 14.63, -90.51, 'Guatemala'],
  ['San Salvador', 13.69, -89.22, 'El Salvador'],
  ['Bogota', 4.71, -74.07, 'Colombia', 'Bogotá'],
  ['Caracas', 10.48, -66.9, 'Venezuela'],
  ['Brasilia', -15.79, -47.88, 'Brazil', 'Brasília'],
  ['Sao Paulo', -23.55, -46.63, 'Brazil', 'São Paulo'],
  ['Buenos Aires', -34.6, -58.38, 'Argentina'],
  ['Santiago', -33.45, -70.67, 'Chile'],
  ['Lima', -12.05, -77.04, 'Peru'],
  ['Quito', -0.18, -78.47, 'Ecuador'],
  ['Ottawa', 45.42, -75.7, 'Canada'],
  ['Toronto', 43.65, -79.38, 'Canada'],
  ['Panama Canal', 9.08, -79.68, 'Panama'],
  ['Darien Gap', 8.3, -77.5, '', 'Darién'],

  // ── Oceania / strategic ──────────────────────────────────────────────
  ['Sydney', -33.87, 151.21, 'Australia'],
  ['Port Moresby', -9.48, 147.19, 'Papua New Guinea'],
  ['Honiara', -9.45, 159.97, 'Solomon Islands'],
  ['Guam', 13.44, 144.79, 'Guam'],
];

/** Country-name → representative point (capital/centroid) for headline geocoding. */
const COUNTRIES: Record<string, [number, number]> = {
  ukraine: [49.0, 32.0], russia: [60.0, 90.0], china: [35.0, 105.0],
  taiwan: [23.7, 121.0], japan: [36.0, 138.0], 'north korea': [40.0, 127.0],
  'south korea': [36.5, 128.0], india: [21.0, 78.0], pakistan: [30.0, 69.0],
  afghanistan: [34.5, 66.0], iran: [32.0, 53.0], iraq: [33.0, 44.0],
  syria: [35.0, 38.0], lebanon: [33.9, 35.9], israel: [31.0, 34.9],
  palestine: [31.9, 35.2], yemen: [15.5, 48.0], 'saudi arabia': [24.0, 45.0],
  turkey: [39.0, 35.0], egypt: [27.0, 30.0], sudan: [15.0, 30.0],
  'south sudan': [7.5, 30.0], ethiopia: [9.0, 40.0], somalia: [5.0, 46.0],
  nigeria: [9.5, 8.0], mali: [17.5, -3.5], niger: [17.5, 8.0],
  'burkina faso': [12.3, -1.6], libya: [27.0, 17.0], 'dr congo': [-2.5, 23.0],
  congo: [-2.5, 23.0], mozambique: [-18.0, 35.0], 'south africa': [-29.0, 25.0],
  myanmar: [21.0, 96.0], thailand: [15.5, 101.0], philippines: [12.5, 122.0],
  indonesia: [-2.0, 118.0], australia: [-25.0, 134.0],
  'united states': [39.0, -98.0], usa: [39.0, -98.0], 'u.s.': [39.0, -98.0],
  mexico: [23.0, -102.0], haiti: [19.0, -72.0], colombia: [4.0, -72.0],
  venezuela: [7.0, -66.0], brazil: [-10.0, -52.0], argentina: [-34.0, -64.0],
  chile: [-31.0, -71.0], peru: [-10.0, -75.0], ecuador: [-1.5, -78.5],
  panama: [8.9, -80.0], 'united kingdom': [54.0, -2.0], britain: [54.0, -2.0],
  france: [46.5, 2.5], germany: [51.0, 10.0], poland: [52.0, 20.0],
  italy: [42.8, 12.8], spain: [40.0, -3.5], greece: [39.0, 22.0],
  sweden: [62.0, 15.0], norway: [65.0, 12.0], finland: [64.0, 26.0],
  estonia: [59.0, 25.0], latvia: [57.0, 25.0], lithuania: [56.0, 24.0],
  belarus: [53.5, 28.0], moldova: [47.0, 29.0], georgia: [42.0, 44.0],
  armenia: [40.3, 45.0], azerbaijan: [40.2, 47.5], serbia: [44.0, 21.0],
  kosovo: [42.6, 20.9], romania: [46.0, 25.0], hungary: [47.0, 19.5],
  netherlands: [52.2, 5.3], belgium: [50.6, 4.7], switzerland: [46.8, 8.2],
  'north atlantic': [50.0, -35.0],
};

interface IndexedPlace {
  place: Place;
  regex: RegExp;
  /** Longer names match first (specificity). */
  specificity: number;
}

const INDEX: IndexedPlace[] = [];
const COUNTRY_INDEX: { name: string; regex: RegExp; lat: number; lon: number }[] = [];

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const [name, lat, lon, country, ...aliases] of PLACES) {
  const terms = [name, ...aliases].map(escapeRe);
  INDEX.push({
    place: { name, lat, lon, country: country || undefined, aliases },
    regex: new RegExp(`\\b(${terms.join('|')})\\b`, 'i'),
    specificity: Math.max(...terms.map((t) => t.length)),
  });
}
INDEX.sort((a, b) => b.specificity - a.specificity);

for (const [name, [lat, lon]] of Object.entries(COUNTRIES)) {
  COUNTRY_INDEX.push({
    name,
    regex: new RegExp(`\\b${escapeRe(name)}\\b`, 'i'),
    lat,
    lon,
  });
}
COUNTRY_INDEX.sort((a, b) => b.name.length - a.name.length);

/** Direct country-name → centroid lookup (for sources that name countries). */
export function countryCentroid(name: string): { name: string; lat: number; lon: number } | null {
  const hit = COUNTRIES[name.trim().toLowerCase()];
  return hit ? { name, lat: hit[0], lon: hit[1] } : null;
}

export interface GeoHit {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  /** 'place' = specific toponym, 'country' = country-level mention. */
  kind: 'place' | 'country';
}

/**
 * Extract up to `max` geolocated mentions from text. Specific places win over
 * country-level mentions; each unique coordinate is returned once.
 */
export function extractPlaces(text: string, max = 3): GeoHit[] {
  const hits: GeoHit[] = [];
  const seen = new Set<string>();

  for (const { place, regex } of INDEX) {
    if (hits.length >= max) break;
    if (!regex.test(text)) continue;
    const key = `${place.lat.toFixed(2)},${place.lon.toFixed(2)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({ name: place.name, lat: place.lat, lon: place.lon, country: place.country, kind: 'place' });
  }

  for (const c of COUNTRY_INDEX) {
    if (hits.length >= max) break;
    if (!c.regex.test(text)) continue;
    const key = `${c.lat.toFixed(2)},${c.lon.toFixed(2)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({ name: c.name.replace(/\b\w/g, (m) => m.toUpperCase()), lat: c.lat, lon: c.lon, kind: 'country' });
  }

  return hits;
}
