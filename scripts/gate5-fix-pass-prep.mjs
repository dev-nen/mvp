import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

import { getArgValue, rootDir } from "./runtime-script-utils.mjs";

const DEFAULT_OUTPUT_PATH = "tests/evidence/gate5-fix-pass-plan-latest.md";

const evidenceFiles = [
  ["Gate 4 Block 1 Public", "tests/evidence/2026-04-28-gate4-block1-public.md"],
  ["Gate 4 Block 2 Auth/Favorites", "tests/evidence/2026-04-28-gate4-block2-auth-favorites.md"],
  ["Gate 4 Block 3 Draft Inbox", "tests/evidence/2026-04-28-gate4-block3-draft-inbox.md"],
  ["Gate 4 Block 4 Approved Lifecycle", "tests/evidence/2026-04-28-gate4-block4-approved-lifecycle.md"],
  ["Gate 4 Block 5 Internal Metrics", "tests/evidence/2026-04-29-gate4-block5-internal-metrics.md"],
];

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

function fileExists(relativePath) {
  return existsSync(path.join(rootDir, relativePath));
}

function evidenceTable() {
  return [
    "| Evidence | Path | Status |",
    "| --- | --- | --- |",
    ...evidenceFiles.map(([label, relativePath]) =>
      `| ${label} | \`${relativePath}\` | ${fileExists(relativePath) ? "Present" : "Missing"} |`,
    ),
  ].join("\n");
}

const outputPath = normalizeRelativePath(getArgValue("output") || DEFAULT_OUTPUT_PATH);
const outputAbsolutePath = path.join(rootDir, outputPath);
const generatedAt = new Date().toISOString();
const branch = git(["branch", "--show-current"]) || "(unknown)";
const commit = git(["rev-parse", "--short", "HEAD"]) || "(unknown)";
const gate4Block5Latest = "tests/evidence/gate4-block5-internal-metrics-latest.md";

const report = `# Gate 5 Fix Pass Prep

## Snapshot

- Generated at: ${generatedAt}
- Branch: \`${branch}\`
- Commit: \`${commit}\`

## Evidence Inventory

${evidenceTable()}

Generated internal-metrics prep:

- \`${gate4Block5Latest}\`: ${fileExists(gate4Block5Latest) ? "Present" : "Missing"}

## Current Classification

| Area | Status | Reading | Next action |
| --- | --- | --- | --- |
| Public catalog | Done | Blocks 1 and 2 passed for real catalog, images, search/filter, detail after auth, and favorite persistence. | No fix pass unless new regression appears. |
| Auth/profile/favorites | Done | Block 2 passed, profile copy was accepted. | No fix pass. |
| Draft Inbox | Done | Block 3 passed for access, listing, save, reject, and read-only rejected state. | No fix pass. |
| Approved lifecycle | Done | Block 4 passed for approve, internal activity page, edit, unpublish, republish, and cleanup unpublish. | No fix pass. |
| Contact one-option | Done | Activity id 2 contact path passed while authenticated. | No fix pass. |
| Contact zero-option | Partial | Behavior was observed during lifecycle with activity #7, but no durable real catalog fixture remains after cleanup. | Treat as data fixture gap, not repo bug. |
| Contact multi-option | Blocked | Dataset still has no public activity with multiple active contacts. | Needs data fixture before full chooser smoke. |
| Internal metrics | Done | Block 5 passed for public route retirement, unauthenticated API rejection, and anon RPC privacy. Authorized API-path check is blocked by Vercel Authentication on protected preview. | No fix pass unless an unprotected preview/prod check fails later. |
| Catalog freshness | Planned | Already-open public catalog did not re-render automatically after internal publish changes. | Tracked as tech debt, not lifecycle blocker. |

## Gate 5 Decision Rule

- If Gate 4 Block 5 passes or is explicitly \`Blocked\` by Vercel Authentication, no code fix batch is required right now.
- If Block 5 exposes private metrics publicly, stop and fix before closure.
- If multi-contact remains missing, keep it as \`Blocked\` by dataset and do not create fake frontend behavior.

## Human Summary Template

\`\`\`txt
Gate 5 fix-pass decision:
Code fix required: Yes / No
Blocked by data/config:
Issues to defer:
Ready for Gate 6: Yes / No
\`\`\`
`;

mkdirSync(path.dirname(outputAbsolutePath), { recursive: true });
writeFileSync(outputAbsolutePath, report, "utf8");

console.log(`Gate 5 fix-pass prep written to ${outputPath}`);
