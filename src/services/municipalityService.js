import { normalizeSearchText } from "@/helpers/textNormalize";
import {
  getSupabaseClient,
  getSupabaseClientError,
} from "@/services/supabaseClient";

const MUNICIPALITY_SELECT =
  "id, name, slug, province_code, province_name, autonomous_community_code, autonomous_community_name, municipality_code, dir3_code, name_search, search_text";
const MUNICIPALITY_BASIC_SELECT = "id, name";
const MUNICIPALITY_SOURCE_VIEW = "municipality_choices_read";
const MUNICIPALITY_SOURCE_TABLE = "cities";
const SANT_PERE_DE_RIBES_MUNICIPALITY_CODE = "082310";
const SANT_PERE_DE_RIBES_DIR3_CODE = "L01082310";
const ROQUETES_DISPLAY_NAME = "Les Roquetes (Sant Pere de Ribes)";
const ROQUETES_ALIASES = [
  "les roquetes",
  "roquetes",
  "les roquetas",
  "roquetas",
  "sant pere",
  "san pere",
];

let santPereMunicipalityPromise = null;

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getMunicipalityError() {
  return (
    getSupabaseClientError() ||
    "No pudimos cargar los municipios disponibles ahora mismo."
  );
}

function escapeLikePattern(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function buildMunicipalityChoice(row) {
  const name = getTrimmedText(row.name);

  return {
    id: row.id,
    name,
    displayName: name,
    provinceCode: getTrimmedText(row.province_code),
    provinceName: getTrimmedText(row.province_name),
    autonomousCommunityCode: getTrimmedText(row.autonomous_community_code),
    autonomousCommunityName: getTrimmedText(row.autonomous_community_name),
    municipalityCode: getTrimmedText(row.municipality_code),
    dir3Code: getTrimmedText(row.dir3_code),
    isSynthetic: false,
  };
}

function isRecoverableMunicipalitySchemaError(error) {
  const errorText = [
    error?.code,
    error?.message,
    error?.details,
    error?.hint,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    errorText.includes("42p01") ||
    errorText.includes("42703") ||
    errorText.includes("pgrst200") ||
    errorText.includes("pgrst205") ||
    errorText.includes("does not exist") ||
    errorText.includes("could not find") ||
    errorText.includes("schema cache")
  );
}

async function runMunicipalityQuery(queryFactories) {
  let lastRecoverableError = null;

  for (const queryFactory of queryFactories) {
    const { data, error } = await queryFactory();

    if (!error) {
      return data ?? [];
    }

    if (!isRecoverableMunicipalitySchemaError(error)) {
      throw new Error(getMunicipalityError());
    }

    lastRecoverableError = error;
  }

  if (lastRecoverableError) {
    throw new Error(getMunicipalityError());
  }

  return [];
}

async function searchMunicipalityRows(supabase, normalizedQuery, limit) {
  const escapedQuery = escapeLikePattern(normalizedQuery);
  const ilikePattern = `%${escapedQuery}%`;

  return runMunicipalityQuery([
    () =>
      supabase
        .from(MUNICIPALITY_SOURCE_VIEW)
        .select(MUNICIPALITY_SELECT)
        .ilike("search_text", ilikePattern)
        .order("name", { ascending: true })
        .limit(limit),
    () =>
      supabase
        .from(MUNICIPALITY_SOURCE_TABLE)
        .select(MUNICIPALITY_SELECT)
        .ilike("search_text", ilikePattern)
        .eq("place_type", "municipality")
        .eq("is_active", true)
        .order("name", { ascending: true })
        .limit(limit),
    () =>
      supabase
        .from(MUNICIPALITY_SOURCE_TABLE)
        .select(MUNICIPALITY_BASIC_SELECT)
        .ilike("name", ilikePattern)
        .order("name", { ascending: true })
        .limit(limit),
  ]);
}

async function readSantPereMunicipalityRow(supabase) {
  const santPereNamePattern = "Sant Pere de Ribes";

  const rows = await runMunicipalityQuery([
    () =>
      supabase
        .from(MUNICIPALITY_SOURCE_VIEW)
        .select(MUNICIPALITY_SELECT)
        .or(
          `municipality_code.eq.${SANT_PERE_DE_RIBES_MUNICIPALITY_CODE},dir3_code.eq.${SANT_PERE_DE_RIBES_DIR3_CODE}`,
        )
        .limit(1),
    () =>
      supabase
        .from(MUNICIPALITY_SOURCE_TABLE)
        .select(MUNICIPALITY_SELECT)
        .or(
          `municipality_code.eq.${SANT_PERE_DE_RIBES_MUNICIPALITY_CODE},dir3_code.eq.${SANT_PERE_DE_RIBES_DIR3_CODE}`,
        )
        .limit(1),
    () =>
      supabase
        .from(MUNICIPALITY_SOURCE_TABLE)
        .select(MUNICIPALITY_BASIC_SELECT)
        .eq("name", santPereNamePattern)
        .limit(1),
  ]);

  return rows[0] ?? null;
}

async function readMunicipalityRowById(supabase, cityId) {
  const rows = await runMunicipalityQuery([
    () =>
      supabase
        .from(MUNICIPALITY_SOURCE_VIEW)
        .select(MUNICIPALITY_SELECT)
        .eq("id", cityId)
        .limit(1),
    () =>
      supabase
        .from(MUNICIPALITY_SOURCE_TABLE)
        .select(MUNICIPALITY_SELECT)
        .eq("id", cityId)
        .limit(1),
    () =>
      supabase
        .from(MUNICIPALITY_SOURCE_TABLE)
        .select(MUNICIPALITY_BASIC_SELECT)
        .eq("id", cityId)
        .limit(1),
  ]);

  return rows[0] ?? null;
}

function shouldIncludeRoquetesOption(normalizedQuery) {
  return ROQUETES_ALIASES.some((alias) => {
    const normalizedAlias = normalizeSearchText(alias);

    return (
      normalizedAlias.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedAlias)
    );
  });
}

function buildRoquetesChoice(santPereMunicipality) {
  if (!santPereMunicipality?.id) {
    return null;
  }

  return {
    ...santPereMunicipality,
    name: "Les Roquetes",
    displayName: ROQUETES_DISPLAY_NAME,
    parentMunicipalityName: santPereMunicipality.name,
    isSynthetic: true,
    syntheticKey: "les-roquetes",
  };
}

function sortMunicipalityChoices(leftChoice, rightChoice) {
  if (leftChoice.isSynthetic !== rightChoice.isSynthetic) {
    return leftChoice.isSynthetic ? 1 : -1;
  }

  return leftChoice.displayName.localeCompare(rightChoice.displayName);
}

async function readSantPereMunicipality() {
  if (santPereMunicipalityPromise) {
    return santPereMunicipalityPromise;
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error(getMunicipalityError());
  }

  santPereMunicipalityPromise = readSantPereMunicipalityRow(supabase)
    .then((row) => {
      return row ? buildMunicipalityChoice(row) : null;
    })
    .catch((error) => {
      santPereMunicipalityPromise = null;
      throw error;
    });

  return santPereMunicipalityPromise;
}

export function normalizeMunicipalityQuery(query) {
  return normalizeSearchText(query);
}

export function getMunicipalityChoiceLabel(choice) {
  const displayName = getTrimmedText(choice?.displayName || choice?.name);
  const provinceName = getTrimmedText(choice?.provinceName);

  if (!displayName) {
    return "";
  }

  return provinceName ? `${displayName} · ${provinceName}` : displayName;
}

export async function getMunicipalityChoiceById(cityId) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error(getMunicipalityError());
  }

  const row = await readMunicipalityRowById(supabase, cityId);

  return row ? buildMunicipalityChoice(row) : null;
}

export async function searchMunicipalityChoices(query, { limit = 20 } = {}) {
  const normalizedQuery = normalizeMunicipalityQuery(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error(getMunicipalityError());
  }

  const includeRoquetes = shouldIncludeRoquetesOption(normalizedQuery);
  const requestedLimit = includeRoquetes ? Math.max(limit - 1, 1) : limit;
  const rows = await searchMunicipalityRows(
    supabase,
    normalizedQuery,
    requestedLimit,
  );

  const choicesByKey = new Map();

  rows.forEach((row) => {
    const choice = buildMunicipalityChoice(row);

    if (choice.id) {
      choicesByKey.set(`city:${choice.id}`, choice);
    }
  });

  if (includeRoquetes) {
    // Temporary curated exception: move Les Roquetes/Roquetas to a proper
    // known_localities or areas model once locality-level persistence exists.
    const santPereMunicipality = await readSantPereMunicipality();
    const roquetesChoice = buildRoquetesChoice(santPereMunicipality);

    if (roquetesChoice) {
      choicesByKey.set("synthetic:les-roquetes", roquetesChoice);
    }
  }

  return [...choicesByKey.values()].sort(sortMunicipalityChoices).slice(0, limit);
}
