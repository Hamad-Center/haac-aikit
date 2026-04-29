import * as p from "@clack/prompts";
import kleur from "kleur";
import { readConfig } from "../fs/readConfig.js";
import type { CliArgs } from "../types.js";

/**
 * update: shows what's drifted, confirms with the user, then syncs.
 * Unlike `sync` which is non-interactive and always writes, `update`
 * shows the diff first and asks before overwriting.
 *
 * In a non-TTY context the @clack/prompts confirm dialog crashes with
 * `uv_tty_init returned EINVAL`. We detect that up front and either
 * fall through to sync (when --yes is passed) or refuse with a clear
 * pointer at the right command.
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

  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    process.stderr.write(
      kleur.yellow("aikit update is interactive. ") +
        `In a non-TTY context (CI, pipes, scripts), run ${kleur.cyan("aikit update --yes")} ` +
        `or ${kleur.cyan("aikit sync --force")} instead.\n`
    );
    process.exit(1);
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
