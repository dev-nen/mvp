import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

import {
  createAnonClient,
  createServiceClient,
  getArgValue,
  normalizeUrl,
  rootDir,
} from "./runtime-script-utils.mjs";

const DEFAULT_PREVIEW_URL = "https://mvp-nen-git-main-dibrandons-projects.vercel.app";
const DEFAULT_OUTPUT_PATH = "tests/evidence/gate4-smoke-session-latest.md";

function git(args) {
  const result = spawnSync("git", args, {
    cwd: rootDir,
    encoding: "utf8",
    shell: false,
  });

  return result.status === 0 ? String(result.stdout || "").trim() : "";
}

function normalizeRelativePath(value) {
  return String(value || "").replaceAll("\\", "/").replace(/^\/+/, "");
}

function markdownCell(value) {
  return asciiText(value)
    .replaceAll("|", "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function asciiText(value) {
  return String(value ?? "")
    .replaceAll("\u00c3\u00a1", "a")
    .replaceAll("\u00c3\u00a9", "e")
    .replaceAll("\u00c3\u00ad", "i")
    .replaceAll("\u00c3\u00b3", "o")
    .replaceAll("\u00c3\u00ba", "u")
    .replaceAll("\u00c3\u00b1", "n")
    .replaceAll("\u00c3\u0081", "A")
    .replaceAll("\u00c3\u0089", "E")
    .replaceAll("\u00c3\u008d", "I")
    .replaceAll("\u00c3\u0093", "O")
    .replaceAll("\u00c3\u009a", "U")
    .replaceAll("\u00c3\u0091", "N")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "?");
}

function titleFromDraft(draft) {
  return (
    draft.reviewed_payload_json?.activity?.title ||
    draft.parsed_payload_json?.activity?.title ||
    draft.reviewed_payload_json?.title ||
    draft.parsed_payload_json?.title ||
    "(sin titulo)"
  );
}

function pickActivity(catalogRows, predicate) {
  return catalogRows.find(predicate) || null;
}

function activityLabel(activity) {
  if (!activity) {
    return "No disponible en dataset actual";
  }

  return `id ${activity.id} - ${asciiText(activity.title)}`;
}

function checklistItem(action, expected, evidence) {
  return [
    `- [ ] Accion: ${action}`,
    `  - Esperado: ${expected}`,
    `  - Evidencia minima: ${evidence}`,
    "  - Resultado: Pass / Fail",
  ].join("\n");
}

const baseUrl = normalizeUrl(
  getArgValue("base-url") ||
    process.env.NENSGO_PREVIEW_URL ||
    DEFAULT_PREVIEW_URL,
);
const outputPath = normalizeRelativePath(getArgValue("output") || DEFAULT_OUTPUT_PATH);
const outputAbsolutePath = path.join(rootDir, outputPath);
const generatedAt = new Date().toISOString();
const branch = git(["branch", "--show-current"]) || "(unknown)";
const commit = git(["rev-parse", "--short", "HEAD"]) || "(unknown)";

const { client: anon, error: anonError } = createAnonClient();
const { client: service, error: serviceError } = createServiceClient();

const warnings = [];
let catalogRows = [];
let contactRows = [];
let internalAccessCount = null;
let draftRows = [];

if (!anon) {
  warnings.push(`Supabase anon client no disponible: ${anonError}`);
} else {
  const { data, error } = await anon
    .from("catalog_activities_read")
    .select("id, title, image_url, city_id, category_label")
    .limit(100);

  if (error) {
    warnings.push(`No se pudo leer catalog_activities_read: ${error.message}`);
  } else {
    catalogRows = data || [];
  }

  const { data: contacts, error: contactsError } = await anon
    .from("activity_contact_options")
    .select("activity_id, contact_method, is_active, is_deleted")
    .eq("is_active", true)
    .eq("is_deleted", false)
    .limit(200);

  if (contactsError) {
    warnings.push(`No se pudo leer activity_contact_options: ${contactsError.message}`);
  } else {
    contactRows = contacts || [];
  }
}

if (!service) {
  warnings.push(`Service role local no disponible: ${serviceError}`);
} else {
  const { count, error } = await service
    .from("internal_tool_access")
    .select("*", { count: "exact", head: true });

  if (error) {
    warnings.push(`No se pudo leer internal_tool_access: ${error.message}`);
  } else {
    internalAccessCount = count ?? 0;
  }

  const { data, error: draftsError } = await service
    .from("activity_drafts")
    .select("id, review_status, approved_activity_id, parsed_payload_json, reviewed_payload_json, created_at")
    .order("id", { ascending: true })
    .limit(25);

  if (draftsError) {
    warnings.push(`No se pudo leer activity_drafts: ${draftsError.message}`);
  } else {
    draftRows = data || [];
  }
}

const contactCountByActivity = new Map();

for (const row of contactRows) {
  contactCountByActivity.set(
    row.activity_id,
    (contactCountByActivity.get(row.activity_id) || 0) + 1,
  );
}

const withImage = pickActivity(catalogRows, (row) => Boolean(row.image_url));
const zeroContact = pickActivity(catalogRows, (row) => !contactCountByActivity.has(row.id));
const oneContact = pickActivity(
  catalogRows,
  (row) => contactCountByActivity.get(row.id) === 1,
);
const multiContact = pickActivity(
  catalogRows,
  (row) => (contactCountByActivity.get(row.id) || 0) > 1,
);
const pendingDrafts = draftRows.filter((row) => row.review_status === "pending_review");
const approvedDrafts = draftRows.filter((row) => row.review_status === "approved");
const rejectedDrafts = draftRows.filter((row) => row.review_status === "rejected");

if (!zeroContact) {
  warnings.push("Dataset sin actividad publica con 0 contactos activos.");
}

if (!multiContact) {
  warnings.push("Dataset sin actividad publica con multiples contactos activos.");
}

if (!pendingDrafts.length) {
  warnings.push("No hay drafts pending_review para smoke de Draft Inbox.");
}

const catalogTable = catalogRows.length
  ? [
      "| Caso | Actividad |",
      "| --- | --- |",
      `| Imagen real | ${markdownCell(activityLabel(withImage))} |`,
      `| 0 contactos | ${markdownCell(activityLabel(zeroContact))} |`,
      `| 1 contacto | ${markdownCell(activityLabel(oneContact))} |`,
      `| Multiples contactos | ${markdownCell(activityLabel(multiContact))} |`,
    ].join("\n")
  : "No hay catalogo disponible para preparar casos.";

const draftTable = draftRows.length
  ? [
      "| Draft | Estado | Titulo | Approved activity |",
      "| ---: | --- | --- | --- |",
      ...draftRows.map((draft) =>
        `| ${draft.id} | ${markdownCell(draft.review_status)} | ${markdownCell(titleFromDraft(draft))} | ${markdownCell(draft.approved_activity_id || "-")} |`,
      ),
    ].join("\n")
  : "No hay drafts disponibles para preparar casos.";

const report = `# Gate 4 Smoke Session - Runtime Real

## Uso

Este archivo es una hoja de sesion generada para bajar friccion. No es source
of truth permanente: si cambia el dataset, vuelve a correr:

\`\`\`powershell
npm.cmd run gate4:prep
\`\`\`

Completa solo el bloque que estes testeando. Si aparece un fallo, no sigas con
bloques destructivos; manda a Codex la seccion fallida y evidencia minima.

## Snapshot

- Generated at: ${generatedAt}
- Branch: \`${branch}\`
- Commit: \`${commit}\`
- Base URL: ${baseUrl}
- Home: ${baseUrl}/
- Perfil: ${baseUrl}/perfil
- Favoritos: ${baseUrl}/favoritos
- Draft Inbox: ${baseUrl}/internal/drafts
- Internal PVI API: ${baseUrl}/api/internal/pvi

## Warnings Actuales

${
  warnings.length
    ? warnings.map((warning) => `- ${warning}`).join("\n")
    : "- Sin warnings de preparacion."
}

## Dataset Para El Smoke

### Catalogo Y Contacto

${catalogTable}

### Draft Inbox

- Internal tool access rows: ${internalAccessCount === null ? "no comprobado" : internalAccessCount}
- Drafts pending_review: ${pendingDrafts.length}
- Drafts approved: ${approvedDrafts.length}
- Drafts rejected: ${rejectedDrafts.length}

${draftTable}

## Stop Conditions

- [ ] Si login/auth falla, parar y no probar favoritos ni Draft Inbox.
- [ ] Si Draft Inbox no carga, parar antes de aprobar drafts.
- [ ] Si aprobar un draft falla, no probar approved lifecycle.
- [ ] Si un bug parece de SQL/config externa, guardar error exacto y no repetir clicks.

## Bloque 1 - Publico Sin Cambios Destructivos

${checklistItem(
  `Abrir ${baseUrl}/ y confirmar que carga catalogo real`,
  "Se ven cards reales, imagen real o fallback correcto, sin copy debug viejo.",
  "Captura o nota de primera card visible.",
)}

${checklistItem(
  "Usar busqueda/filtro simple en Home",
  "El catalogo se filtra sin errores visuales ni fallback a mocks.",
  "Filtro usado y resultado visible.",
)}

${checklistItem(
  `Abrir detalle de actividad con 1 contacto (${activityLabel(oneContact)})`,
  "El modal abre y muestra CTA de contacto directa sin texto tecnico.",
  "Actividad usada y resultado.",
)}

${checklistItem(
  zeroContact
    ? `Abrir detalle de actividad con 0 contactos (${activityLabel(zeroContact)})`
    : "Saltar caso 0 contactos: dataset no lo cubre hoy",
  zeroContact
    ? "La UI comunica indisponibilidad sin fallback falso."
    : "Queda marcado como Partial por datos.",
  "Pass/Fail o Blocked por dataset.",
)}

${checklistItem(
  multiContact
    ? `Abrir detalle de actividad con multiples contactos (${activityLabel(multiContact)})`
    : "Saltar caso multiples contactos: dataset no lo cubre hoy",
  multiContact
    ? "La UI abre chooser de contacto."
    : "Queda marcado como Partial por datos.",
  "Pass/Fail o Blocked por dataset.",
)}

## Bloque 2 - Auth, Perfil Y Favoritos

${checklistItem(
  "Desde anonimo, intentar guardar favorito",
  "Aparece gate de acceso correcto.",
  "Captura del gate o nota del estado.",
)}

${checklistItem(
  "Entrar con usuario ya validado y completar onboarding si aparece",
  "El usuario queda ready y vuelve a la accion o a la app sin loop.",
  "Email de prueba usado, sin pegar tokens.",
)}

${checklistItem(
  "Agregar favorito, recargar, quitar favorito, recargar",
  "El favorito persiste y luego desaparece usando user_favorite_activities.",
  "Actividad usada y comportamiento tras reload.",
)}

${checklistItem(
  "Abrir /perfil y revisar copy visible",
  "No reaparece copy tecnica vieja ni debug de auth.",
  "Captura si aparece copy sospechosa.",
)}

## Bloque 3 - Draft Inbox

${checklistItem(
  "Abrir /internal/drafts con usuario autorizado",
  "La lista carga y muestra drafts seed reales.",
  "Ids visibles en lista.",
)}

${checklistItem(
  pendingDrafts[0]
    ? `Abrir draft id ${pendingDrafts[0].id} y guardar una nota de revision`
    : "Saltar guardar draft: no hay pending_review",
  "El guardado muestra exito y sobrevive refresh.",
  "Draft id y nota breve usada.",
)}

${checklistItem(
  pendingDrafts[1]
    ? `Abrir draft id ${pendingDrafts[1].id} y rechazarlo`
    : "Saltar rechazo: falta segundo pending_review",
  "El estado pasa a rejected y la pantalla queda read-only.",
  "Draft id rechazado.",
)}

## Bloque 4 - Aprobacion Y Lifecycle

${checklistItem(
  pendingDrafts[2]
    ? `Abrir draft id ${pendingDrafts[2].id} y aprobarlo`
    : "Saltar aprobacion: falta tercer pending_review",
  "Se crea una actividad real y el draft queda approved con approved_activity_id.",
  "Draft id y approved_activity_id.",
)}

${checklistItem(
  "Abrir la actividad aprobada desde el link interno",
  "Carga /internal/activities/:activityId y muestra estado de publicacion.",
  "Activity id abierto.",
)}

${checklistItem(
  "Editar un campo menor y guardar",
  "El cambio persiste tras refresh.",
  "Campo cambiado.",
)}

${checklistItem(
  "Despublicar y revisar catalogo publico",
  "La actividad sale de catalog_activities_read sin hard delete.",
  "Activity id y captura/nota de ausencia.",
)}

${checklistItem(
  "Republicar y revisar catalogo publico",
  "La misma actividad vuelve al catalogo.",
  "Activity id y captura/nota de presencia.",
)}

## Bloque 5 - Internal Metrics

${checklistItem(
  "Confirmar que /pvi publico no existe",
  "El wildcard vuelve a Home; no hay dashboard publico.",
  "URL probada.",
)}

${checklistItem(
  "Confirmar /api/internal/pvi sin token",
  "Responde 401/403, nunca datos.",
  "Status observado.",
)}

${checklistItem(
  "Confirmar /api/internal/pvi con token solo si Vercel Authentication no bloquea el request",
  "Responde reporte privado; si Vercel Auth bloquea, marcar Blocked por preview protection.",
  "Status observado, sin pegar token.",
)}

## Resumen Para Enviar A Codex

\`\`\`txt
Gate 4 bloque probado:
Entorno:
Pass:
Fail:
Blocked por datos/config:
Evidencia minima:
\`\`\`
`;

mkdirSync(path.dirname(outputAbsolutePath), { recursive: true });
writeFileSync(outputAbsolutePath, report, "utf8");

console.log(`Gate 4 smoke prep written to ${outputPath}`);
console.log(`Base URL: ${baseUrl}`);

if (warnings.length) {
  console.log("\nWarnings:");
  for (const warning of warnings) {
    console.log(`WARN ${warning}`);
  }
}
