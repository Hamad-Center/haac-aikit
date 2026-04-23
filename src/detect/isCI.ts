const CI_ENV_VARS = [
  "CI",
  "CONTINUOUS_INTEGRATION",
  "BUILD_NUMBER",
  "GITHUB_ACTIONS",
  "GITLAB_CI",
  "CIRCLECI",
  "TRAVIS",
  "JENKINS_URL",
  "TEAMCITY_VERSION",
  "BUILDKITE",
];

export function isCI(): boolean {
  return CI_ENV_VARS.some((v) => process.env[v] !== undefined);
}

export function isTTY(): boolean {
  return Boolean(process.stdout.isTTY);
}

export function isInteractive(): boolean {
  return isTTY() && !isCI();
}
