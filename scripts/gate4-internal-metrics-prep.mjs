import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

import {
  getArgValue,
  getConfig,
  createAnonClient,
  normalizeUrl,
  rootDir,
} from "./runtime-script-utils.mjs";

const DEFAULT_PREVIEW_URL = "https://mvp-nen-git-main-dibrandons-projects.vercel.app";
const DEFAULT_OUTPUT_PATH = "tests/evidence/gate4-block5-internal-metrics-latest.md";

function normalizeRelativePath(value) {
  return String(value || "").replaceAll("\\", "/").replace(/^\/+/, "");
}

function git(args) {
  const result = spawnSync("git", args, {
    cwd: rootDir,
    encoding: "utf8",
    shell: false,
  });

  return result.status === 0 ? String(result.stdout || "").trim() : "";
}

function appRouteRetired() {
  const appPath = path.join(rootDir, "src", "App.jsx");
  const content = readFileSync(appPath, "utf8");

  return !content.includes('path="/pvi"') && !content.includes("PviPage");
}

function pviPageFilesRemoved() {
  return (
    !existsSync(path.join(rootDir, "src", "pages", "PviPage.jsx")) &&
    !existsSync(path.join(rootDir, "src", "pages", "PviPage.css"))
  );
}

function classifyVercelAuthBlock(response, body) {
  return response.status === 401 && /<!doctype html|vercel|authentication/i.test(body);
}

async function fetchText(url, options = {}) {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      ...options,
    });
    const body = await response.text();

    return { ok: true, response, body, error: "" };
  } catch (error) {
    return {
      ok: false,
      response: null,
      body: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function statusLine(status, name, detail) {
  const suffix = detail ? ` - ${detail}` : "";
  return `${status} ${name}${suffix}`;
}

const baseUrl = normalizeUrl(
  getArgValue("base-url") ||
    process.env.NENSGO_PREVIEW_URL ||
    DEFAULT_PREVIEW_URL,
);
const outputPath = normalizeRelativePath(getArgValue("output") || DEFAULT_OUTPUT_PATH);
const outputAbsolutePath = path.join(rootDir, outputPath);
const token = getConfig("INTERNAL_PVI_API_TOKEN");
const generatedAt = new Date().toISOString();
const branch = git(["branch", "--show-current"]) || "(unknown)";
const commit = git(["rev-parse", "--short", "HEAD"]) || "(unknown)";
const results = [];

if (appRouteRetired()) {
  results.push({
    status: "PASS",
    name: "static public /pvi route retired",
    detail: "src/App.jsx has no /pvi route or PviPage import.",
  });
} else {
  results.push({
    status: "FAIL",
    name: "static public /pvi route retired",
    detail: "src/App.jsx appears to expose the old public PVI surface.",
  });
}

if (pviPageFilesRemoved()) {
  results.push({
    status: "PASS",
    name: "static PviPage files removed",
    detail: "src/pages/PviPage.* is absent.",
  });
} else {
  results.push({
    status: "FAIL",
    name: "static PviPage files removed",
    detail: "The removed public placeholder files appear to be present again.",
  });
}

const pviPublic = await fetchText(`${baseUrl}/pvi`);

if (!pviPublic.ok) {
  results.push({
    status: "WARN",
    name: "preview /pvi browser path",
    detail: pviPublic.error,
  });
} else if (pviPublic.response.ok && /NensGo/i.test(pviPublic.body)) {
  results.push({
    status: "PASS",
    name: "preview /pvi browser path",
    detail: `${pviPublic.response.status}; app shell returned. Human should confirm it lands on Home.`,
  });
} else if (classifyVercelAuthBlock(pviPublic.response, pviPublic.body)) {
  results.push({
    status: "WARN",
    name: "preview /pvi browser path",
    detail: "Blocked by Vercel Authentication in CLI; human browser check required.",
  });
} else {
  results.push({
    status: "WARN",
    name: "preview /pvi browser path",
    detail: `${pviPublic.response.status} ${pviPublic.response.statusText}; human browser check required.`,
  });
}

const pviNoToken = await fetchText(`${baseUrl}/api/internal/pvi`);

if (!pviNoToken.ok) {
  results.push({
    status: "FAIL",
    name: "internal PVI rejects without token",
    detail: pviNoToken.error,
  });
} else if (pviNoToken.response.status === 401 || pviNoToken.response.status === 403) {
  results.push({
    status: "PASS",
    name: "internal PVI rejects without token",
    detail: `${pviNoToken.response.status} ${pviNoToken.response.statusText}`,
  });
} else {
  results.push({
    status: "FAIL",
    name: "internal PVI rejects without token",
    detail: `${pviNoToken.response.status}; endpoint did not reject unauthenticated request.`,
  });
}

if (!token) {
  results.push({
    status: "WARN",
    name: "internal PVI with configured token",
    detail: "INTERNAL_PVI_API_TOKEN is not available locally.",
  });
} else {
  const pviWithToken = await fetchText(`${baseUrl}/api/internal/pvi`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!pviWithToken.ok) {
    results.push({
      status: "FAIL",
      name: "internal PVI with configured token",
      detail: pviWithToken.error,
    });
  } else if (pviWithToken.response.ok && pviWithToken.body.includes('"ok"')) {
    results.push({
      status: "PASS",
      name: "internal PVI with configured token",
      detail: `${pviWithToken.response.status}; report payload returned.`,
    });
  } else if (classifyVercelAuthBlock(pviWithToken.response, pviWithToken.body)) {
    results.push({
      status: "WARN",
      name: "internal PVI with configured token",
      detail: "Blocked by Vercel Authentication before the serverless endpoint.",
    });
  } else {
    results.push({
      status: "FAIL",
      name: "internal PVI with configured token",
      detail: `${pviWithToken.response.status} ${pviWithToken.body.slice(0, 100)}`,
    });
  }
}

const { client: anonClient, error: anonClientError } = createAnonClient();

if (!anonClient) {
  results.push({
    status: "WARN",
    name: "get_internal_pvi_report anon RPC privacy",
    detail: anonClientError,
  });
} else {
  const { data: pviReport, error: pviRpcError } = await anonClient.rpc(
    "get_internal_pvi_report",
  );

  if (pviRpcError) {
    const message = pviRpcError.message || "";

    if (/permission denied|not allowed|not found|Could not find/i.test(message)) {
      results.push({
        status: "PASS",
        name: "get_internal_pvi_report anon RPC privacy",
        detail: message,
      });
    } else {
      results.push({
        status: "WARN",
        name: "get_internal_pvi_report anon RPC privacy",
        detail: message,
      });
    }
  } else if (pviReport) {
    results.push({
      status: "FAIL",
      name: "get_internal_pvi_report anon RPC privacy",
      detail: "Anon client received report data.",
    });
  } else {
    results.push({
      status: "WARN",
      name: "get_internal_pvi_report anon RPC privacy",
      detail: "No error and no data returned.",
    });
  }
}

const failCount = results.filter((result) => result.status === "FAIL").length;
const warnCount = results.filter((result) => result.status === "WARN").length;
const resultText = results
  .map((result) => statusLine(result.status, result.name, result.detail))
  .join("\n");

const report = `# Gate 4 Block 5 Internal Metrics Session

## Snapshot

- Generated at: ${generatedAt}
- Branch: \`${branch}\`
- Commit: \`${commit}\`
- Base URL: ${baseUrl}
- Public PVI path: ${baseUrl}/pvi
- Internal PVI API: ${baseUrl}/api/internal/pvi

## Automated Prep

\`\`\`txt
${resultText}
\`\`\`

## Human Checklist

- [ ] Abrir \`${baseUrl}/pvi\`
  - Esperado: no existe dashboard publico; vuelve a Home o queda protegido sin mostrar metricas.
  - Resultado: Pass / Fail

- [ ] Abrir \`${baseUrl}/api/internal/pvi\` sin token
  - Esperado: rechaza con 401/403 o queda bloqueado por proteccion de preview sin mostrar datos.
  - Resultado: Pass / Fail

- [ ] Validar \`/api/internal/pvi\` con token solo si la preview permite llegar al endpoint
  - Esperado: responde reporte privado estructurado.
  - Resultado: Pass / Fail / Blocked por Vercel Authentication

## Summary To Send Codex

\`\`\`txt
Gate 4 - Bloque 5 Internal Metrics

1. /pvi publico no existe y vuelve a Home: Pass / Fail
2. /api/internal/pvi sin token rechaza: Pass / Fail
3. /api/internal/pvi con token responde o queda Blocked por Vercel Authentication: Pass / Fail / Blocked

Notas:
\`\`\`
`;

mkdirSync(path.dirname(outputAbsolutePath), { recursive: true });
writeFileSync(outputAbsolutePath, report, "utf8");

console.log(`Gate 4 internal metrics prep written to ${outputPath}`);
for (const result of results) {
  console.log(statusLine(result.status, result.name, result.detail));
}

if (failCount) {
  console.error(`\nGate 4 internal metrics prep finished with ${failCount} failure(s).`);
  process.exit(1);
}

console.log(`\nGate 4 internal metrics prep finished with ${warnCount} warning(s).`);
