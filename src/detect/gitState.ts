import { execFileSync } from "node:child_process";

export function isGitRepo(): boolean {
  try {
    execFileSync("git", ["rev-parse", "--git-dir"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function isDirtyTree(): boolean {
  try {
    const output = execFileSync("git", ["status", "--porcelain"], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    return output.trim().length > 0;
  } catch {
    return false;
  }
}
