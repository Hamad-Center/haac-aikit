import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { upsertMarkerRegion } from "../render/markers.js";
import type { WriteResult } from "../types.js";

export interface SafeWriteOptions {
  dryRun?: boolean;
  force?: boolean;
  /** If true, use BEGIN/END markers to update only the managed region. */
  useMarkers?: boolean;
  /** New managed content (only used when useMarkers is true). */
  managedContent?: string;
}

/**
 * Non-destructively write a file.
 *
 * - If the file does not exist: create it (including parent dirs).
 * - If the file exists and useMarkers=true: upsert only the managed region.
 * - If the file exists and useMarkers=false: report conflict unless --force.
 */
export function safeWrite(
  filePath: string,
  content: string,
  opts: SafeWriteOptions = {}
): WriteResult {
  const { dryRun = false, force = false, useMarkers = true, managedContent } = opts;
  const existed = existsSync(filePath);

  if (existed) {
    if (useMarkers && managedContent !== undefined) {
      const existing = readFileSync(filePath, "utf8");
      const { replaced } = upsertMarkerRegion(existing, managedContent, filePath);
      if (existing === replaced) {
        return { path: filePath, action: "skipped" };
      }
      if (!dryRun) writeFileSync(filePath, replaced, "utf8");
      return { path: filePath, action: "updated" };
    }

    // Non-marker path: don't blindly report conflict. Compare content first.
    const existing = readFileSync(filePath, "utf8");
    if (existing === content) {
      return { path: filePath, action: "skipped" };
    }
    if (!force) {
      return { path: filePath, action: "conflict" };
    }
  }

  if (!dryRun) {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, "utf8");
  }

  return { path: filePath, action: existed ? "updated" : "created" };
}
