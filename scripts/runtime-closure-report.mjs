import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultOutputPath = "tests/evidence/runtime-closure-latest.md";
const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

function cleanOutput(value) {
  return String(value || "")
    .replace(ANSI_PATTERN, "")
    .replace(/\u2713/g, "OK")
    .replace(/\u2502/g, "|")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "?");
}

function normalizeRelativePath(value) {
  return String(value || "").replaceAll("\\", "/").replace(/^\/+/, "");
}

function getArgValue(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : "";
}

function run(command, args, displayCommand = [command, ...args].join(" ")) {
  const startedAt = new Date();
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    env: {
      ...process.env,
      FORCE_COLOR: "0",
      NO_COLOR: "1",
    },
    shell: false,
  });

  return {
    command: displayCommand,
    exitCode: typeof result.status === "number" ? result.status : 1,
    stdout: cleanOutput(result.stdout),
    stderr: cleanOutput(result.stderr || result.error?.message || ""),
    startedAt,
    finishedAt: new Date(),
  };
}

function runComposite(displayCommand, steps) {
  const startedAt = new Date();
  const outputs = [];
  let exitCode = 0;

  for (const step of steps) {
    const result = run(step.command, step.args, step.displayCommand);
    outputs.push(`$ ${result.command}`);
    outputs.push([result.stdout, result.stderr].filter(Boolean).join("\n").trim());

    if (result.exitCode !== 0) {
      exitCode = result.exitCode;
      break;
    }
  }

  return {
    command: displayCommand,
    exitCode,
    stdout: outputs.filter(Boolean).join("\n\n"),
    stderr: "",
    startedAt,
    finishedAt: new Date(),
  };
}

function git(args) {
  const result = spawnSync("git", args, {
    cwd: rootDir,
    encoding: "utf8",
    shell: false,
  });

  if (result.status !== 0) {
    return "";
  }

  return (result.stdout || "").trim();
}

function readEnvFile(relativePath) {
  const envPath = path.join(rootDir, relativePath);

  if (!existsSync(envPath)) {
    return {};
  }

  const parsed = {};
  const content = readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#") || !trimmedLine.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmedLine.split("=");
    parsed[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
  }

  return parsed;
}

function getConfig(name) {
  return (
    process.env[name] ||
    readEnvFile(".env.local")[name] ||
    readEnvFile(".env")[name] ||
    ""
  ).trim();
}

function summarizeRun(runResult) {
  const warningCount = (runResult.stdout.match(/^WARN /gm) || []).length;
  const passCount = (runResult.stdout.match(/^PASS /gm) || []).length;
  const failCount = (runResult.stdout.match(/^FAIL /gm) || []).length;

  return {
    passCount,
    warningCount,
    failCount,
    ok: runResult.exitCode === 0,
  };
}

function markdownFence(value) {
  const content = value.trim() || "(sin salida)";
  return `\`\`\`text\n${content}\n\`\`\``;
}

function checkbox(label, done) {
  return `- [${done ? "x" : " "}] ${label}`;
}

const outputPath = normalizeRelativePath(getArgValue("output") || defaultOutputPath);
const outputAbsolutePath = path.join(rootDir, outputPath);
const previewUrl =
  getArgValue("preview-url") ||
  process.env.NENSGO_PREVIEW_URL ||
  "https://mvp-nen-git-main-dibrandons-projects.vercel.app";

const commandRuns = [
  runComposite("npm run check", [
    {
      command: process.execPath,
      args: ["scripts/runtime-static-audit.mjs"],
      displayCommand: "node scripts/runtime-static-audit.mjs",
    },
    {
      command: process.execPath,
      args: ["scripts/runtime-contract-audit.mjs"],
      displayCommand: "node scripts/runtime-contract-audit.mjs",
    },
    {
      command: process.execPath,
      args: ["node_modules/vite/bin/vite.js", "build"],
      displayCommand: "vite build",
    },
  ]),
  run(
    process.execPath,
    ["scripts/runtime-preview-check.mjs", `--preview-url=${previewUrl}`],
    `node scripts/runtime-preview-check.mjs --preview-url=${previewUrl}`,
  ),
];

const [localCheck, previewCheck] = commandRuns;
const localSummary = summarizeRun(localCheck);
const previewSummary = summarizeRun(previewCheck);
const hasInternalPviToken = Boolean(getConfig("INTERNAL_PVI_API_TOKEN"));
const allRequiredCommandsPassed = commandRuns.every((item) => item.exitCode === 0);
const branch = git(["branch", "--show-current"]) || "(unknown)";
const commit = git(["rev-parse", "--short", "HEAD"]) || "(unknown)";
const generatedAt = new Date().toISOString();

const nextGate =
  allRequiredCommandsPassed && hasInternalPviToken
    ? "Gate 2 puede continuar cuando config externa/auth este lista."
    : allRequiredCommandsPassed
      ? "Gate 1 esta estructuralmente OK; falta validar token local de PVI o avanzar a Gate 2 humano."
      : "No avanzar gates: revisar fallos del reporte.";

const report = `# Runtime Closure Latest Report

## Snapshot

- Generated at: ${generatedAt}
- Branch: \`${branch}\`
- Commit: \`${commit}\`
- Preview URL: ${previewUrl}
- Overall command status: \`${allRequiredCommandsPassed ? "Pass" : "Fail"}\`
- Next reading: ${nextGate}

## Gate Readiness

${checkbox("Local static, contract, and build checks pass", localSummary.ok)}
${checkbox("Preview/Supabase read-only checks pass", previewSummary.ok)}
${checkbox("Local INTERNAL_PVI_API_TOKEN is available for authorized API check", hasInternalPviToken)}

## Human Checkpoints Still Required

- [ ] Gate 2: Supabase Auth providers, redirect URLs, and email verification configured.
- [ ] Gate 2: Vercel env vars/secrets confirmed and preview redeployed.
- [ ] Gate 3: internal user inserted in \`internal_tool_access\`.
- [ ] Gate 3: draft seed run against a real authorized internal user.
- [ ] Gate 4: browser smoke checklist executed by a human.

## Automated Command Summary

| Command | Exit | PASS | WARN | FAIL |
| --- | ---: | ---: | ---: | ---: |
| \`${localCheck.command}\` | ${localCheck.exitCode} | ${localSummary.passCount} | ${localSummary.warningCount} | ${localSummary.failCount} |
| \`${previewCheck.command}\` | ${previewCheck.exitCode} | ${previewSummary.passCount} | ${previewSummary.warningCount} | ${previewSummary.failCount} |

## Interpretation

- A preview \`401 Unauthorized\` for \`/\` is acceptable when Vercel Authentication protects preview deployments.
- \`/api/internal/pvi\` must reject unauthenticated requests.
- Direct anon Supabase access to \`get_internal_pvi_report\` must fail with a permission error.
- If \`INTERNAL_PVI_API_TOKEN\` is not local, the authorized PVI path remains unchecked by this report.

## Local Check Output

${markdownFence([localCheck.stdout, localCheck.stderr].filter(Boolean).join("\n"))}

## Preview Check Output

${markdownFence([previewCheck.stdout, previewCheck.stderr].filter(Boolean).join("\n"))}
`;

mkdirSync(path.dirname(outputAbsolutePath), { recursive: true });
writeFileSync(outputAbsolutePath, report, "utf8");

console.log(`Runtime closure report written to ${outputPath}`);

if (!allRequiredCommandsPassed) {
  process.exit(1);
}
