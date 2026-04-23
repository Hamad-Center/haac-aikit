import * as p from "@clack/prompts";
import { readConfig } from "../fs/readConfig.js";
import type { CliArgs } from "../types.js";

/**
 * update: shows what's drifted, confirms with the user, then syncs.
 * Unlike `sync` which is non-interactive and always writes, `update`
 * shows the diff first and asks before overwriting.
 */
export async function runUpdate(argv: CliArgs): Promise<void> {
  const config = readConfig(argv.config);
  if (!config) {
    p.log.error(".aikitrc.json not found. Run `aikit` to initialise.");
    process.exit(1);
  }

  // Run diff to show what would change
  const { runDiff } = await import("./diff.js");
  await runDiff({ ...argv, "dry-run": true });

  if (argv.yes) {
    const { runSync } = await import("./sync.js");
    await runSync(argv);
    return;
  }

  const proceed = await p.confirm({
    message: "Apply these updates?",
    initialValue: true,
  });

  if (!proceed || p.isCancel(proceed)) {
    p.cancel("Update cancelled.");
    return;
  }

  const { runSync } = await import("./sync.js");
  await runSync(argv);
}
