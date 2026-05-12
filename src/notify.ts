import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import kleur from "kleur";
import type { CliArgs } from "./types.js";

// Lightweight version of `update-notifier` — no extra deps, no detached child
// process. We cache the registry's latest version in ~/.aikit/cache/update.json
// and re-check at most once per 24h. Every other invocation reads the cache
// (~1ms) and either prints a one-line banner or skips silently.

const CACHE_DIR = join(homedir(), ".aikit", "cache");
const CACHE_FILE = join(CACHE_DIR, "update.json");
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h
const FETCH_TIMEOUT_MS = 1500;
const REGISTRY_URL = "https://registry.npmjs.org/haac-aikit/latest";

interface UpdateCache {
  latestVersion: string;
  checkedAt: string;
}

// Compares semver-like x.y.z strings. Returns >0 if a > b, <0 if a < b, 0 if equal.
// Tolerates trailing pre-release tags by trimming them (e.g. "0.9.0-beta.1" → "0.9.0").
export function compareVersions(a: string, b: string): number {
  const norm = (v: string): number[] =>
    v.split("-")[0]!.split(".").slice(0, 3).map((n) => Number.parseInt(n, 10) || 0);
  const pa = norm(a);
  const pb = norm(b);
  for (let i = 0; i < 3; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

function readCache(): UpdateCache | null {
  if (!existsSync(CACHE_FILE)) return null;
  try {
    const raw = readFileSync(CACHE_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as UpdateCache).latestVersion === "string" &&
      typeof (parsed as UpdateCache).checkedAt === "string"
    ) {
      return parsed as UpdateCache;
    }
    return null;
  } catch {
    return null;
  }
}

function writeCache(cache: UpdateCache): void {
  try {
    mkdirSync(dirname(CACHE_FILE), { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch {
    // Best effort — never let cache write failures affect the CLI.
  }
}

function isStale(cache: UpdateCache | null): boolean {
  if (!cache) return true;
  const age = Date.now() - new Date(cache.checkedAt).getTime();
  if (Number.isNaN(age)) return true;
  return age > CHECK_INTERVAL_MS;
}

async function fetchLatestVersion(): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(REGISTRY_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { version?: unknown };
    return typeof body.version === "string" ? body.version : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// True when the banner should not be shown — covers CI, non-interactive shells,
// explicit opt-out flags, and the help/version commands (where extra noise
// would obscure the actual output).
function shouldSkipNotification(argv: CliArgs): boolean {
  if (process.env.AIKIT_NO_UPDATE_CHECK) return true;
  if (process.env.CI) return true;
  if (!process.stdout.isTTY) return true;
  if (argv.help || argv.version) return true;
  if (argv["no-update-check"]) return true;
  return false;
}

function printBanner(current: string, latest: string): void {
  const msg =
    `\n${kleur.bold().yellow("┌─ update available ─────────────────────────────")}\n` +
    `${kleur.yellow("│")}  ${kleur.bold("haac-aikit")} ${kleur.green(`v${latest}`)} is available ` +
    `${kleur.dim(`(you have v${current})`)}\n` +
    `${kleur.yellow("│")}  Run ${kleur.cyan("npm i -g haac-aikit@latest")} to update\n` +
    `${kleur.yellow("│")}  After updating, run ${kleur.cyan("aikit whatsnew")} for changes\n` +
    `${kleur.yellow("└──────────────────────────────────────────────────")}\n`;
  // Write to stderr so the banner doesn't pollute scripts that pipe stdout.
  process.stderr.write(msg);
}

// Public entry point. Called from cli.ts after argv parsing, before command
// dispatch. Awaited so the banner appears before command output, but the
// network call has a 1.5s ceiling and never throws past this boundary.
export async function checkAndNotify(argv: CliArgs, currentVersion: string): Promise<void> {
  if (shouldSkipNotification(argv)) return;

  try {
    const cache = readCache();
    let latest: string | null = cache?.latestVersion ?? null;

    if (isStale(cache)) {
      const fetched = await fetchLatestVersion();
      if (fetched) {
        latest = fetched;
        writeCache({ latestVersion: fetched, checkedAt: new Date().toISOString() });
      }
    }

    if (latest && compareVersions(latest, currentVersion) > 0) {
      printBanner(currentVersion, latest);
    }
  } catch {
    // The CLI must never fail because the update check failed.
  }
}

// Test seam — lets tests override the cache file location without mocking fs.
export const _internal = { CACHE_FILE, CACHE_DIR };
