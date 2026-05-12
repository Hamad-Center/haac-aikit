import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

// Single source of truth for the package version — substituted at build time
// from package.json so the runtime constant can't drift. Pre-0.9.0 this lived
// as a hand-edited string in src/cli.ts and silently disagreed across releases.
const pkg = JSON.parse(readFileSync("./package.json", "utf8")) as { version: string };

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  outExtension: () => ({ js: ".mjs" }),
  target: "node20",
  bundle: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false,
  noExternal: ["@clack/prompts", "kleur", "mri"],
  define: {
    "process.env.HAAC_AIKIT_VERSION": JSON.stringify(pkg.version),
  },
});
