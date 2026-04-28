import { execFile } from "node:child_process";
import { promisify } from "node:util";
import kleur from "kleur";
import type { CliArgs } from "../types.js";

const runCmd = promisify(execFile);

interface PR {
  number: number;
  title: string;
}

export interface ReviewComment {
  body: string;
  prNumber: number;
}

interface RuleCandidate {
  id: string;
  text: string;
  evidenceCount: number;
  exemplar: string;
  prs: number[];
}

// Matches phrases that signal a reviewer is teaching a convention.
const CORRECTION_PHRASES = [
  /\bwe (?:always|usually|never|don't|do not|prefer|tend to|should|shouldn't)\b/i,
  /\b(?:please )?(?:always|never|don't|do not) [a-z]/i,
  /\bactually,?\s+(?:we|let's|i'd)/i,
  /\bshould (?:always |never |)be /i,
  /\b(?:our )?convention is to\b/i,
  /\bnit:?\s+/i,
  /\b(?:can we|could we|would prefer)\b/i,
];

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "is", "are", "was", "were",
  "be", "been", "being", "to", "of", "in", "on", "at", "by", "for", "with",
  "from", "this", "that", "these", "those", "it", "its", "we", "you", "i",
  "my", "your", "our", "their", "as", "so", "do", "does", "did", "have",
  "has", "had", "can", "could", "would", "should", "will", "may",
]);

export async function runLearn(argv: CliArgs): Promise<void> {
  const limit = Number(argv.limit ?? 30);
  if (!Number.isFinite(limit) || limit <= 0) {
    process.stderr.write("--limit must be a positive number\n");
    process.exit(1);
  }

  if (!(await ensureGh())) {
    process.stderr.write(
      kleur.red("aikit learn requires the GitHub CLI (`gh`) to be installed and authenticated.\n") +
        "Install: https://cli.github.com/  ·  Authenticate: `gh auth login`\n"
    );
    process.exit(1);
  }

  process.stdout.write(kleur.dim(`Fetching last ${limit} merged PRs...\n`));
  const prs = await fetchMergedPRs(limit);
  if (prs.length === 0) {
    process.stdout.write(kleur.yellow("No merged PRs found in this repo.\n"));
    return;
  }

  process.stdout.write(kleur.dim(`Pulling review comments from ${prs.length} PRs...\n`));
  const comments: ReviewComment[] = [];
  for (const pr of prs) {
    const prComments = await fetchReviewComments(pr.number);
    for (const c of prComments) comments.push({ body: c, prNumber: pr.number });
  }

  if (comments.length === 0) {
    process.stdout.write(kleur.yellow("No review comments found across the scanned PRs.\n"));
    return;
  }

  const teachingComments = comments.filter((c) => isTeachingComment(c.body));
  process.stdout.write(
    kleur.dim(`Found ${teachingComments.length} teaching comments out of ${comments.length} total.\n\n`)
  );

  const candidates = clusterCandidates(teachingComments);
  printCandidates(candidates);
}

async function ensureGh(): Promise<boolean> {
  try {
    await runCmd("gh", ["auth", "status"], { encoding: "utf8" });
    return true;
  } catch {
    return false;
  }
}

async function fetchMergedPRs(limit: number): Promise<PR[]> {
  const { stdout } = await runCmd(
    "gh",
    ["pr", "list", "--state", "merged", "--limit", String(limit), "--json", "number,title"],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
  );
  return JSON.parse(stdout) as PR[];
}

async function fetchReviewComments(prNumber: number): Promise<string[]> {
  try {
    const { stdout } = await runCmd(
      "gh",
      ["pr", "view", String(prNumber), "--json", "reviews,comments"],
      { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
    );
    const data = JSON.parse(stdout) as {
      reviews?: { body?: string }[];
      comments?: { body?: string }[];
    };
    const out: string[] = [];
    for (const r of data.reviews ?? []) if (r.body) out.push(r.body);
    for (const c of data.comments ?? []) if (c.body) out.push(c.body);
    return out;
  } catch {
    return [];
  }
}

export function isTeachingComment(body: string): boolean {
  if (body.length < 10 || body.length > 1500) return false;
  return CORRECTION_PHRASES.some((rx) => rx.test(body));
}

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t))
      .map(stem)
  );
}

// Crude stemmer that normalises common English plurals/tenses so "commit" and
// "commits" hash to the same token. Good enough for clustering — false matches
// are reviewed manually before becoming rules.
function stem(t: string): string {
  if (t.length < 5) return t;
  if (t.endsWith("ies")) return t.slice(0, -3) + "y";
  if (t.endsWith("ing")) return t.slice(0, -3);
  if (t.endsWith("ed")) return t.slice(0, -2);
  if (t.endsWith("es")) return t.slice(0, -2);
  if (t.endsWith("s")) return t.slice(0, -1);
  return t;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersect = 0;
  for (const t of a) if (b.has(t)) intersect++;
  return intersect / (a.size + b.size - intersect);
}

export function clusterCandidates(comments: ReviewComment[]): RuleCandidate[] {
  type Cluster = { seedTokens: Set<string>; comments: ReviewComment[] };
  const clusters: Cluster[] = [];
  // Permissive threshold — corrections often share only 2-3 signal tokens after
  // stopwords are stripped. False positives are reviewed manually before a rule
  // is accepted, so erring on the side of too many clusters is fine.
  const SIMILARITY_THRESHOLD = 0.15;

  for (const c of comments) {
    const tk = tokens(c.body);
    if (tk.size < 2) continue;
    let placed = false;
    for (const cluster of clusters) {
      // Compare to the seed (first comment's tokens) rather than the union, so
      // cluster drift doesn't make later comments harder to match.
      if (jaccard(tk, cluster.seedTokens) >= SIMILARITY_THRESHOLD) {
        cluster.comments.push(c);
        placed = true;
        break;
      }
    }
    if (!placed) clusters.push({ seedTokens: tk, comments: [c] });
  }

  // Convert to candidates, keep only clusters with 2+ pieces of evidence.
  return clusters
    .filter((c) => c.comments.length >= 2)
    .map((c) => candidateFromCluster(c.comments))
    .sort((a, b) => b.evidenceCount - a.evidenceCount);
}

function candidateFromCluster(comments: ReviewComment[]): RuleCandidate {
  // Pick the shortest non-trivial comment as the exemplar (review nits are
  // usually punchier than long architectural comments).
  const exemplar = [...comments]
    .map((c) => c.body.trim().split("\n").find((l) => l.trim().length > 10) ?? c.body.trim())
    .sort((a, b) => a.length - b.length)[0] ?? comments[0]?.body ?? "";
  const id = idFromText(exemplar);
  return {
    id,
    text: exemplar.slice(0, 240),
    evidenceCount: comments.length,
    exemplar,
    prs: [...new Set(comments.map((c) => c.prNumber))].sort((a, b) => a - b),
  };
}

export function idFromText(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .filter((t) => t.length > 2 && !STOPWORDS.has(t))
    .slice(0, 4)
    .join("-");
  return `learned.${slug || "unnamed"}`;
}

function printCandidates(candidates: RuleCandidate[]): void {
  if (candidates.length === 0) {
    process.stdout.write(kleur.yellow("No repeated correction patterns found. Try increasing --limit.\n"));
    return;
  }

  process.stdout.write(kleur.bold(`Proposed rule candidates (${candidates.length})\n`));
  process.stdout.write(kleur.dim("Each candidate is backed by ≥2 PR review comments.\n\n"));

  for (const c of candidates) {
    const prList = c.prs.slice(0, 5).map((n) => `#${n}`).join(", ");
    const more = c.prs.length > 5 ? `, +${c.prs.length - 5} more` : "";
    process.stdout.write(kleur.bold(`▸ ${c.id}\n`));
    process.stdout.write(`  ${kleur.dim("evidence:")} ${c.evidenceCount} comments across ${prList}${more}\n`);
    process.stdout.write(`  ${kleur.dim("exemplar:")} ${truncate(c.exemplar, 200)}\n\n`);
  }

  process.stdout.write(kleur.bold("Suggested AGENTS.md additions\n"));
  process.stdout.write(kleur.dim("Copy the block below into AGENTS.md inside a <!-- BEGIN:learned --> ... <!-- END:learned --> region:\n\n"));
  process.stdout.write("<!-- BEGIN:learned -->\n");
  process.stdout.write("## Learned conventions\n");
  for (const c of candidates) {
    process.stdout.write(`- <!-- id: ${c.id} --> ${truncate(c.exemplar, 240)}\n`);
  }
  process.stdout.write("<!-- END:learned -->\n");
}

function truncate(s: string, n: number): string {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length > n ? `${flat.slice(0, n - 1)}…` : flat;
}
