import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function normalizeUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

export function readDotEnv(relativePath) {
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

    const [key, ...rawValueParts] = trimmedLine.split("=");
    const rawValue = rawValueParts.join("=").trim();
    parsed[key.trim()] = rawValue.replace(/^["']|["']$/g, "");
  }

  return parsed;
}

export function getArgValue(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : "";
}

export function getConfig(name) {
  return (
    process.env[name] ||
    readDotEnv(".env.local")[name] ||
    readDotEnv(".env")[name] ||
    ""
  ).trim();
}

export function createAnonClient() {
  const supabaseUrl = getConfig("VITE_SUPABASE_URL");
  const supabaseAnonKey = getConfig("VITE_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return { client: null, error: "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required." };
  }

  return {
    client: createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
    error: "",
  };
}

export function createServiceClient() {
  const supabaseUrl = getConfig("VITE_SUPABASE_URL");
  const serviceRoleKey = getConfig("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return { client: null, error: "VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required." };
  }

  return {
    client: createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
    error: "",
  };
}

export class ResultCollector {
  constructor() {
    this.results = [];
  }

  pass(name, detail = "") {
    this.results.push({ status: "PASS", name, detail });
  }

  warn(name, detail = "") {
    this.results.push({ status: "WARN", name, detail });
  }

  fail(name, detail = "") {
    this.results.push({ status: "FAIL", name, detail });
  }

  print() {
    for (const result of this.results) {
      const detail = result.detail ? ` - ${result.detail}` : "";
      console.log(`${result.status} ${result.name}${detail}`);
    }
  }

  exitIfFailed(label) {
    const failedCount = this.results.filter((result) => result.status === "FAIL").length;
    const warningCount = this.results.filter((result) => result.status === "WARN").length;

    if (failedCount) {
      console.error(`\n${failedCount} ${label} check(s) failed.`);
      process.exit(1);
    }

    console.log(`\n${label} finished with ${warningCount} warning(s).`);
  }
}
