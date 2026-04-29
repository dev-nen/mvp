import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

import { getArgValue, rootDir } from "./runtime-script-utils.mjs";

const DEFAULT_OUTPUT_PATH = "tests/evidence/gate6-closure-candidate-latest.md";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function normalizeRelativePath(value) {
  return String(value || "").replaceAll("\\", "/").replace(/^\/+/, "");
}

function cleanOutput(value) {
  return String(value || "")
    .replace(/\u001b\[[0-9;]*m/g, "")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "?")
    .trim();
}

function run(command, args, displayCommand = [command, ...args].join(" ")) {
  const isWindowsCmd = process.platform === "win32" && command.endsWith(".cmd");
  const spawnCommand = isWindowsCmd ? "cmd.exe" : command;
  const spawnArgs = isWindowsCmd
    ? ["/d", "/s", "/c", [command, ...args].join(" ")]
    : args;

  const result = spawnSync(spawnCommand, spawnArgs, {
    cwd: rootDir,
    encoding: "utf8",
    shell: false,
    env: {
      ...process.env,
      FORCE_COLOR: "0",
      NO_COLOR: "1",
    },
  });

  return {
    command: displayCommand,
    exitCode: typeof result.status === "number" ? result.status : 1,
    stdout: cleanOutput(result.stdout),
    stderr: cleanOutput(result.stderr || result.error?.message || ""),
  };
}

function git(args) {
  const result = run("git", args);

  return result.exitCode === 0 ? result.stdout : "";
}

function summarize(output) {
  return {
    pass: (output.match(/^PASS /gm) || []).length,
    warn: (output.match(/^WARN /gm) || []).length,
    fail: (output.match(/^FAIL /gm) || []).length,
  };
}

function fence(value) {
  return `\`\`\`txt\n${value || "(sin salida)"}\n\`\`\``;
}

const outputPath = normalizeRelativePath(getArgValue("output") || DEFAULT_OUTPUT_PATH);
const outputAbsolutePath = path.join(rootDir, outputPath);
const generatedAt = new Date().toISOString();
const branch = git(["branch", "--show-current"]) || "(unknown)";
const commit = git(["rev-parse", "--short", "HEAD"]) || "(unknown)";
const status = git(["status", "--short"]);

const checks = [
  run(npmCommand, ["run", "check"], "npm.cmd run check"),
  run(npmCommand, ["run", "gate3:audit"], "npm.cmd run gate3:audit"),
  run(npmCommand, ["run", "gate4:metrics"], "npm.cmd run gate4:metrics"),
  run(npmCommand, ["run", "gate5:prep"], "npm.cmd run gate5:prep"),
];

const commandRows = checks.map((check) => {
  const summary = summarize(`${check.stdout}\n${check.stderr}`);

  return `| \`${check.command}\` | ${check.exitCode} | ${summary.pass} | ${summary.warn} | ${summary.fail} |`;
});

const hasCommandFailure = checks.some((check) => check.exitCode !== 0);
const workingTreeClean = !status.trim();
const closureStatus =
  hasCommandFailure
    ? "Blocked by command failure"
    : workingTreeClean
      ? "Candidate after human Block 5 confirmation"
      : "Candidate with uncommitted generated/local changes";

const report = `# Gate 6 Closure Candidate Prep

## Snapshot

- Generated at: ${generatedAt}
- Branch: \`${branch}\`
- Commit: \`${commit}\`
- Working tree clean before report: ${workingTreeClean ? "Yes" : "No"}
- Closure status: ${closureStatus}

## Automated Checks

| Command | Exit | PASS | WARN | FAIL |
| --- | ---: | ---: | ---: | ---: |
${commandRows.join("\n")}

## Human Closure Checklist

- [ ] Gate 4 Block 5 internal metrics marked Pass/Blocked with evidence.
- [ ] Contact multi-option remains explicitly \`Blocked\` by dataset, or a real fixture was added and tested.
- [ ] Test activity #7 remains unpublished unless deliberately needed again.
- [ ] No hidden operational blocker remains in Supabase or Vercel.
- [ ] If no code fix is needed, merge this branch into \`main\` with a non-FF merge if preserving Git Graph tree is desired.

## Current Known Non-Blocking Items

- Multi-contact chooser cannot be fully smoked until data exists.
- Public catalog may need manual refresh after internal publish lifecycle writes.
- Authorized \`/api/internal/pvi\` may be blocked by Vercel Authentication on protected preview.

## Command Output

${checks.map((check) => `### ${check.command}\n\n${fence([check.stdout, check.stderr].filter(Boolean).join("\n"))}`).join("\n\n")}
`;

mkdirSync(path.dirname(outputAbsolutePath), { recursive: true });
writeFileSync(outputAbsolutePath, report, "utf8");

console.log(`Gate 6 closure candidate prep written to ${outputPath}`);
console.log(`Closure status: ${closureStatus}`);

if (hasCommandFailure) {
  process.exit(1);
}
