// React

// External libraries

// Internal application modules
import { buildDivIcon, buildImageDivIcon, tablerSvg } from "../utils/leafletIcons";

// Force marker images. Note: Drone.png and Quadcopter.png are used by shape,
// not filename -- Quadcopter.png is the actual quadcopter (force_type
// "drone"), Drone.png is a small fixed-wing aircraft shape (force_type
// "uav"), the opposite of what their names suggest.
import armorIcon from "../assets/tank.png";
import apcIcon from "../assets/apc.png";
import artilleryIcon from "../assets/artillery.png";
import droneIcon from "../assets/Quadcopter.png";
import uavIcon from "../assets/Drone.png";
import transportIcon from "../assets/truck.png";
import bulldozerIcon from "../assets/D9.png";
import vehicleIcon from "../assets/Jeep2.png";
import aircraftIcon from "../assets/AirPlane.png";
import helicopterIcon from "../assets/Chopper.png";

// Styles

/**
 * All force markers share one color (placeholder military green -- swap
 * this single value to retint every force icon and legend entry at once)
 * instead of a per-type color, matching the rest of each map's restrained
 * legend palette (colors there carry meaning -- red for an event, green for
 * hospitals -- rather than being decorative).
 */
export const FORCE_ICON_COLOR = "#4b5320";

/** Raw path data for the infantry glyph -- the one force type with no saved image (it's a group-of-people icon, not a single-soldier one, per its own convention). */
const INFANTRY_ICON_PATHS = [
  "M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0",
  "M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2",
  "M16 3.13a4 4 0 0 1 0 7.75",
  "M21 21v-2a4 4 0 0 0 -3 -3.85",
];

/**
 * Per-`force_type` marker config. Every type but `infantry` uses a saved
 * image (see the imports above); `infantry` uses the Tabler "users" glyph
 * (as raw path data for the Leaflet marker, and as the IconUsers component
 * for the legend) since no image was provided for it.
 */
export const FORCE_TYPE_META = {
  infantry: { label: 'חי"ר', paths: INFANTRY_ICON_PATHS },
  armor: { label: "שריון", image: armorIcon },
  apc: { label: 'נגמ"ש', image: apcIcon },
  artillery: { label: "ארטילריה", image: artilleryIcon },
  drone: { label: "רחפן", image: droneIcon },
  uav: { label: 'כטב"ם', image: uavIcon },
  transport: { label: "תחבורה", image: transportIcon },
  bulldozer: { label: "דחפור", image: bulldozerIcon },
  vehicle: { label: "רכב קל", image: vehicleIcon },
  aircraft: { label: "מטוס קרב", image: aircraftIcon },
  helicopter: { label: "מסוק", image: helicopterIcon },
};

/** One pre-built div-icon per `force_type`, keyed the same as FORCE_TYPE_META. Shared across every map that renders forces, so they look identical everywhere. */
export const FORCE_TYPE_ICONS = Object.fromEntries(
  Object.entries(FORCE_TYPE_META).map(([type, meta]) => [
    type,
    meta.image
      ? buildImageDivIcon({ src: meta.image, background: FORCE_ICON_COLOR, size: 24, glow: true })
      : buildDivIcon({ label: tablerSvg(meta.paths), background: FORCE_ICON_COLOR, size: 24, glow: true }),
  ]),
);

/**
 * Hebrew names for each `force_subtype`. Native-Hebrew platform names
 * (Merkava, Namer, Eitan, Achzarit, David, Sufa, Abir) use their real Hebrew
 * spelling, not a transliteration; foreign platforms use their official IDF
 * Hebrew nicknames (e.g. Apache -> Saraf, Black Hawk -> Yanshuf) except
 * F-15/F-16/F-35, which stay in Latin per how they're referred to even in
 * Hebrew text.
 */
const SUBTYPE_LABELS_HE = {
  merkava_3: "מרכבה 3",
  merkava_4: "מרכבה 4",
  merkava_5: "מרכבה 5",
  quadcopter: "רחפן",
  heron_tp: "איתן",
  heron_1: "שובל",
  hermes_900: "כוכב",
  hermes_450: "זיק",
  orbiter_4: "ניצוץ",
  skylark_1: "רוכב שמיים",
  skylark_3: "דוהר שמיים",
  m109: 'תומ"ח דוהר M109',
  sigma_155: 'תומ"ת רועם',
  truck: "משאית",
  d9: "D9",
  david: "דוד",
  sufa: "סופה",
  abir: "אביר",
  namer: "נמר",
  eitan: "איתן",
  achzarit: "אכזרית",
  f_15: "F-15",
  f_16: "F-16",
  f_35: "F-35",
  apache: "שרף",
  black_hawk: "ינשוף",
};

/** Hebrew names for every brigade/division/corps string in the seed data. */
const BRIGADE_LABELS_HE = {
  "179th Armored Brigade": "חטיבה משוריינת 179",
  '300th "Baram" Territorial Brigade': 'חטיבה אזורית 300 "ברעם"',
  "401st Armored Brigade": "חטיבה משוריינת 401",
  "417th Jordan Valley Territorial Brigade": "חטיבה אזורית 417 (בקעת הירדן)",
  '769th "Hiram" Territorial Brigade': 'חטיבה אזורית 769 "חירם"',
  "7th Armored Brigade": "חטיבה משוריינת 7",
  "91st Division": "אוגדה 91",
  "91st Division Artillery": "ארטילריית אוגדה 91",
  "Combat Engineering Corps": "חיל ההנדסה הקרבית",
  "Gaza Division": "אוגדת עזה",
  "Gaza Division Artillery": "ארטילריית אוגדת עזה",
  "Givati Brigade": "חטיבת גבעתי",
  "Golani Brigade": "חטיבת גולני",
  "Israeli Air Force": "חיל האוויר הישראלי",
  "Judea and Samaria Division": "אוגדת יהודה ושומרון",
  "Judea and Samaria Division Artillery": "ארטילריית אוגדת יהודה ושומרון",
  "Nahal Brigade": 'חטיבת נח"ל',
  "Paratroopers Brigade": "חטיבת הצנחנים",
};

/** Hebrew names for every battalion/company/squadron string in the seed data. */
const BATTALION_LABELS_HE = {
  "101st Battalion": "גדוד 101",
  "105 Squadron": "טייסת 105",
  "114 Squadron": "טייסת 114",
  "124 Squadron": "טייסת 124",
  "12th Battalion": "גדוד 12",
  "133 Squadron": "טייסת 133",
  "13th Battalion": "גדוד 13",
  '140 "Golden Eagle" Squadron': 'טייסת 140 "הנשר הזהוב"',
  "184th Battalion": "גדוד 184",
  "190 Squadron": "טייסת 190",
  "195th Battalion": "גדוד 195",
  "1st Battalion": "גדוד 1",
  "202nd Battalion": "גדוד 202",
  "215th Artillery Regiment": "גדוד תותחנים 215",
  "282nd Artillery Regiment": "גדוד תותחנים 282",
  "286th Artillery Regiment": "גדוד תותחנים 286",
  "2nd Battalion": "גדוד 2",
  "334th Artillery Regiment": "גדוד תותחנים 334",
  "3rd Battalion": "גדוד 3",
  "409th Battalion": "גדוד 409",
  "46th Battalion": "גדוד 46",
  '50th "Palchan" Battalion': 'גדוד 50 "פלחן"',
  "51st Battalion": "גדוד 51",
  "52nd Battalion": "גדוד 52",
  "601st Combat Engineering Battalion": "גדוד הנדסה קרבית 601",
  "605th Combat Engineering Battalion": "גדוד הנדסה קרבית 605",
  "614th Combat Engineering Battalion": "גדוד הנדסה קרבית 614",
  "71st Battalion": "גדוד 71",
  "75th Battalion": "גדוד 75",
  "82nd Battalion": "גדוד 82",
  "890th Battalion": "גדוד 890",
  "9210th Artillery Battalion": "גדוד תותחנים 9210",
  "9215th Artillery Battalion": "גדוד תותחנים 9215",
  "931st Battalion": "גדוד 931",
  "931st Battalion Logistics Company": "פלוגת לוגיסטיקה, גדוד 931",
  "932nd Battalion": "גדוד 932",
  "933rd Battalion": "גדוד 933",
  "9th Battalion": "גדוד 9",
  "Division UAV Squadron": 'טייסת כטב"ם אוגדתית',
  "Logistics Company": "פלוגת לוגיסטיקה",
  "Reconnaissance Company": "פלוגת סיור",
  "Shaked Battalion": "גדוד שקד",
};

/** Looks up a Hebrew label, falling back to the original English string if it's not in the dictionary (e.g. future data added outside this seed). */
function toHebrew(dictionary, value) {
  return dictionary[value] ?? value;
}

/** Builds a force's display label: "Subtype · Brigade, Battalion", or just "Brigade, Battalion" for infantry (no subtype) -- all in Hebrew. */
export function forceLabel(force) {
  const subtypeLabel = force.subtype ? (SUBTYPE_LABELS_HE[force.subtype] ?? force.subtype) : null;
  const brigadeLabel = toHebrew(BRIGADE_LABELS_HE, force.brigade);
  const battalionLabel = toHebrew(BATTALION_LABELS_HE, force.battalion);
  return subtypeLabel ? `${subtypeLabel} · ${brigadeLabel}, ${battalionLabel}` : `${brigadeLabel}, ${battalionLabel}`;
}
