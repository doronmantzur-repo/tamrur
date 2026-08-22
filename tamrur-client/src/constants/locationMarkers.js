// React

// External libraries

// Internal application modules
import { LANDING_PAD_STATUS_COLOR_VARS } from "./evacuationMethod";
import { toHebrew } from "./forces";
import { buildDivIcon, tablerSvg } from "../utils/leafletIcons";

// Styles

/**
 * Raw path data for a hexagram (Star of David), two overlapping triangles
 * in a 24x24 viewBox -- no stock Tabler icon for this exists, so it's
 * hand-drawn like every other custom marker glyph in this codebase.
 * Exported so StarOfDavidIcon (MapLegendPrimitives.jsx) can render the same
 * shape as a real DOM icon for legends, instead of drifting out of sync
 * with a second, separately-maintained copy.
 */
export const STAR_OF_DAVID_PATHS = [
  "M12 3l7.79 13.5l-15.58 0l7.79 -13.5z",
  "M12 21l-7.79 -13.5l15.58 0l-7.79 13.5z",
];

/** Raw path data for Tabler's ambulance glyph, used for exchange points / other named locations. */
const AMBULANCE_ICON_PATHS = [
  "M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
  "M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
  "M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5",
  "M6 10h4m-2 -2v4",
];

/**
 * Hospital marker: blue rather than the landing-pad "available" green, so
 * the two don't read as the same marker on the map -- `info` is otherwise
 * unused by any marker on either map (pads use success/error, forces use a
 * hardcoded military green), and is already this theme's reserved hue for
 * clinical meaning the red/amber/green severity scale can't express.
 */
export const HOSPITAL_ICON = buildDivIcon({
  label: tablerSvg(STAR_OF_DAVID_PATHS),
  background: "var(--app-color-info)",
  size: 26,
  glow: true,
});

export const OTHER_LOCATION_ICON = buildDivIcon({
  label: tablerSvg(AMBULANCE_ICON_PATHS),
  background: "var(--app-color-text-muted)",
  size: 26,
  glow: true,
});

/** Builds a landing-pad marker ("H" on a circle colored by pad status), shared so every map that renders pads looks identical. */
export function buildLandingPadIcon(status) {
  return buildDivIcon({
    label: "H",
    background: LANDING_PAD_STATUS_COLOR_VARS[status],
    glow: true,
  });
}

/** Hebrew names for every hospital in the seed data (db/migrations/008_hospital_locations_seed.sql). */
const HOSPITAL_LABELS_HE = {
  "Sheba Medical Center (Tel HaShomer)": "מרכז רפואי שיבא (תל השומר)",
  "Tel Aviv Sourasky Medical Center (Ichilov)": "המרכז הרפואי תל אביב (איכילוב)",
  "Rambam Health Care Campus": 'קריית הבריאות רמב"ם',
  "Hadassah Medical Center (Ein Kerem)": "המרכז הרפואי הדסה עין כרם",
  "Hadassah Medical Center (Mount Scopus)": "המרכז הרפואי הדסה הר הצופים",
  "Shaare Zedek Medical Center": "המרכז הרפואי שערי צדק",
  "Soroka University Medical Center": "המרכז הרפואי האוניברסיטאי סורוקה",
  "Rabin Medical Center (Beilinson Campus)": "המרכז הרפואי רבין (קמפוס בילינסון)",
  "Rabin Medical Center (Hasharon Campus)": "המרכז הרפואי רבין (קמפוס השרון)",
  "Schneider Children's Medical Center": "המרכז הרפואי שניידר לילדים",
  "Shamir Medical Center (Assaf Harofeh)": "המרכז הרפואי שמיר (אסף הרופא)",
  "Meir Medical Center": "המרכז הרפואי מאיר",
  "Edith Wolfson Medical Center": "המרכז הרפואי וולפסון",
  "Barzilai Medical Center": "המרכז הרפואי ברזילי",
  "Samson Assuta Ashdod University Hospital": "בית החולים סמסון אסותא אשדוד",
  "Hillel Yaffe Medical Center": "המרכז הרפואי הלל יפה",
  "Galilee Medical Center (Nahariya)": "המרכז הרפואי לגליל (נהריה)",
  "Ziv Medical Center (Safed)": "המרכז הרפואי זיו (צפת)",
  "Baruch Padeh Medical Center (Poriya)": "המרכז הרפואי ברוך פדה (פוריה)",
  "Emek Medical Center (Afula)": "המרכז הרפואי העמק (עפולה)",
  "Carmel Medical Center (Haifa)": "המרכז הרפואי כרמל (חיפה)",
  "Bnai Zion Medical Center (Haifa)": "המרכז הרפואי בני ציון (חיפה)",
  "Laniado Hospital (Netanya)": "בית החולים לניאדו (נתניה)",
  "Ma'aynei HaYeshua Medical Center": "המרכז הרפואי מעייני הישועה",
  "Yoseftal Medical Center (Eilat)": "המרכז הרפואי יוספטל (אילת)",
  "Herzliya Medical Center": "המרכז הרפואי הרצליה",
  "Assuta Ramat HaChayal (Tel Aviv)": 'אסותא רמת החי"ל (תל אביב)',
  "ALYN Hospital (Jerusalem)": 'בית החולים אלי"ן (ירושלים)',
  "Herzog Hospital (Jerusalem)": "בית החולים הרצוג (ירושלים)",
  "Reuth Medical & Rehabilitation Center": "המרכז הרפואי שיקומי רעות",
  "Loewenstein Rehabilitation Hospital": "בית החולים לוונשטיין לשיקום",
  "Holy Family Hospital (Nazareth)": "בית החולים המשפחה הקדושה (נצרת)",
  "Nazareth Hospital (EMMS / The English Hospital)": "בית החולים נצרת (האנגלי)",
  "St. Vincent de Paul Hospital (French Hospital, Nazareth)": "בית החולים סנט וינסנט דה פול (הצרפתי, נצרת)",
};

/** Looks up a hospital's Hebrew display name, falling back to its English seed name if not in the dictionary (e.g. a hospital added outside the seed). */
export function hospitalLabel(name) {
  return toHebrew(HOSPITAL_LABELS_HE, name);
}
