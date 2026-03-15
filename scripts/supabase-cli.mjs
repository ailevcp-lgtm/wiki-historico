import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const repoRoot = process.cwd();
const protectedKeys = new Set(Object.keys(process.env));
const env = { ...process.env };

loadEnvFile(resolve(repoRoot, ".env"), env, protectedKeys);
loadEnvFile(resolve(repoRoot, ".env.local"), env, protectedKeys);

const args = process.argv.slice(2);
const wantsHelp = args.includes("--help") || args.includes("-h");

if (args.length === 0) {
  console.error("Uso: node scripts/supabase-cli.mjs <comando-supabase>");
  process.exit(1);
}

const projectRef = getProjectRef(env);
const isLinkCommand = args[0] === "link";
const finalArgs = [...args];

if (!wantsHelp && isLinkCommand && !args.includes("--project-ref")) {
  if (!projectRef) {
    console.error(
      "No pude resolver el project ref. Define SUPABASE_PROJECT_REF o usa NEXT_PUBLIC_SUPABASE_URL con el dominio estándar de Supabase."
    );
    process.exit(1);
  }

  finalArgs.push("--project-ref", projectRef);
}

if (!wantsHelp && isLinkCommand) {
  const missing = getMissingRequiredEnv(env, ["SUPABASE_ACCESS_TOKEN", "SUPABASE_DB_PASSWORD"]);

  if (missing.length > 0) {
    console.error(
      `Faltan variables para hacer link sin prompts: ${missing.join(", ")}. Cárgalas en .env.local o expórtalas antes de correr el comando.`
    );
    process.exit(1);
  }
}

const cliPath = resolve(
  repoRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "supabase.cmd" : "supabase"
);

if (!existsSync(cliPath)) {
  console.error("No encontré la CLI local de Supabase en node_modules/.bin/supabase.");
  process.exit(1);
}

const child = spawn(cliPath, finalArgs, {
  cwd: repoRoot,
  env,
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

function loadEnvFile(filePath, targetEnv, blockedKeys) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;

    if (blockedKeys.has(key)) {
      continue;
    }

    targetEnv[key] = stripWrappingQuotes(rawValue.trim());
  }
}

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function getProjectRef(targetEnv) {
  if (targetEnv.SUPABASE_PROJECT_REF) {
    return targetEnv.SUPABASE_PROJECT_REF;
  }

  if (targetEnv.SUPABASE_PROJECT_ID) {
    return targetEnv.SUPABASE_PROJECT_ID;
  }

  if (!targetEnv.NEXT_PUBLIC_SUPABASE_URL) {
    return undefined;
  }

  try {
    const hostname = new URL(targetEnv.NEXT_PUBLIC_SUPABASE_URL).hostname;
    const [subdomain] = hostname.split(".");

    return subdomain || undefined;
  } catch {
    return undefined;
  }
}

function getMissingRequiredEnv(targetEnv, keys) {
  return keys.filter((key) => !targetEnv[key]);
}
