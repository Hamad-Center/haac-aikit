import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkAndNotify, compareVersions } from "../src/notify.js";
import type { CliArgs } from "../src/types.js";

function args(overrides: Partial<CliArgs> = {}): CliArgs {
  return {
    _: [],
    yes: false,
    "dry-run": false,
    force: false,
    "skip-git-check": false,
    "no-color": false,
    help: false,
    version: false,
    ...overrides,
  } as CliArgs;
}

let origTTY: boolean | undefined;
let origCI: string | undefined;
let origDisable: string | undefined;
let stderr: string[];

beforeEach(() => {
  origTTY = process.stdout.isTTY;
  origCI = process.env.CI;
  origDisable = process.env.AIKIT_NO_UPDATE_CHECK;
  // Pretend interactive so opt-outs are exercised by the test config, not the host env.
  Object.defineProperty(process.stdout, "isTTY", { value: true, configurable: true });
  delete process.env.CI;
  delete process.env.AIKIT_NO_UPDATE_CHECK;
  stderr = [];
  vi.spyOn(process.stderr, "write").mockImplementation((chunk: unknown) => {
    stderr.push(String(chunk));
    return true;
  });
});

afterEach(() => {
  Object.defineProperty(process.stdout, "isTTY", { value: origTTY, configurable: true });
  if (origCI !== undefined) process.env.CI = origCI;
  if (origDisable !== undefined) process.env.AIKIT_NO_UPDATE_CHECK = origDisable;
  vi.restoreAllMocks();
});

describe("compareVersions", () => {
  it("returns 1 when a > b", () => {
    expect(compareVersions("0.9.0", "0.8.3")).toBe(1);
    expect(compareVersions("1.0.0", "0.99.99")).toBe(1);
    expect(compareVersions("0.10.0", "0.9.5")).toBe(1);
  });

  it("returns -1 when a < b", () => {
    expect(compareVersions("0.8.3", "0.9.0")).toBe(-1);
    expect(compareVersions("0.0.1", "0.0.2")).toBe(-1);
  });

  it("returns 0 when a == b", () => {
    expect(compareVersions("0.9.0", "0.9.0")).toBe(0);
  });

  it("strips pre-release suffixes", () => {
    expect(compareVersions("0.9.0-beta.1", "0.9.0")).toBe(0);
    expect(compareVersions("1.0.0-rc.2", "0.9.9")).toBe(1);
  });

  it("treats missing components as zero", () => {
    expect(compareVersions("1", "1.0.0")).toBe(0);
    expect(compareVersions("1.0", "1.0.0")).toBe(0);
  });
});

describe("checkAndNotify — opt-outs", () => {
  it("never prints when AIKIT_NO_UPDATE_CHECK is set", async () => {
    process.env.AIKIT_NO_UPDATE_CHECK = "1";
    // fetch shouldn't even be called — but if it were and returned newer, we'd still want zero output.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ version: "99.0.0" }) })
    );
    await checkAndNotify(args(), "0.9.0");
    expect(stderr.join("")).toBe("");
  });

  it("never prints when CI is set", async () => {
    process.env.CI = "true";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ version: "99.0.0" }) })
    );
    await checkAndNotify(args(), "0.9.0");
    expect(stderr.join("")).toBe("");
  });

  it("never prints when stdout is not a TTY", async () => {
    Object.defineProperty(process.stdout, "isTTY", { value: false, configurable: true });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ version: "99.0.0" }) })
    );
    await checkAndNotify(args(), "0.9.0");
    expect(stderr.join("")).toBe("");
  });

  it("never prints when --help is passed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ version: "99.0.0" }) })
    );
    await checkAndNotify(args({ help: true }), "0.9.0");
    expect(stderr.join("")).toBe("");
  });

  it("never prints when --no-update-check is passed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ version: "99.0.0" }) })
    );
    await checkAndNotify(args({ "no-update-check": true }), "0.9.0");
    expect(stderr.join("")).toBe("");
  });
});

describe("checkAndNotify — failure paths", () => {
  it("never throws when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    await expect(checkAndNotify(args(), "0.9.0")).resolves.toBeUndefined();
    // Should not print a banner either (no successful version to compare).
    expect(stderr.join("")).toBe("");
  });

  it("never throws when fetch returns non-200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    );
    await expect(checkAndNotify(args(), "0.9.0")).resolves.toBeUndefined();
    expect(stderr.join("")).toBe("");
  });

  it("never throws when registry returns malformed JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ /* no version field */ }) })
    );
    await expect(checkAndNotify(args(), "0.9.0")).resolves.toBeUndefined();
    expect(stderr.join("")).toBe("");
  });
});
