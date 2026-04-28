export interface RuleMeta {
  emphasis?: "high" | "normal" | "low";
  paths?: string[];
}

export interface ParsedRule {
  id: string;
  text: string;
  meta: RuleMeta;
  section: string;
}

export interface ParsedRuleSet {
  projectName: string;
  description: string;
  rules: ParsedRule[];
  rawSections: Map<string, string>;
}
