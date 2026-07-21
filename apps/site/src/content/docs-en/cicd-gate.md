---
title: CI/CD Gate
description: How to set up the CI/CD gate that blocks the pipeline if AWS waste exceeds the budget.
order: 11
---

# CI/CD Gate

cloudrift is designed to run inside CI/CD pipelines. Two features make it CI-friendly:

1. `--format markdown` produces a report ready for PR comments / step summary
2. `costAlertThresholdUsd` in the config exits with **code 2** when waste exceeds the budget

## Configuration

In the `cloudrift.config.json` file (committed to the repo):

```json
{
  "costAlertThresholdUsd": 500,
  "minAgeDays": 7,
  "ignoreTag": "cloudrift:ignore"
}
```

If the total `waste` exceeds `costAlertThresholdUsd`, the command exits with code 2 → pipeline fails. Savings of type `optimization` never count towards the gate.

## GitHub Actions — as a reusable action

[`action.yml`](https://github.com/elleVas/cloudrift/blob/main/action.yml) at the repo root wraps `npm install -g @cloudrift/cli` + `cloudrift analyze`, posts the markdown report to the job summary, and fails the job on the same exit codes as the CLI (`2` = over budget):

```yaml
name: Cloud cost check
on: [pull_request]

permissions:
  contents: read

jobs:
  cloudrift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4 # for cloudrift.config.json, read from the cwd

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - uses: elleVas/cloudrift@v0.5.1
        with:
          regions: us-east-1 eu-west-1
          config: cloudrift.config.json
```

With a `cloudrift.config.json` committed (`{"costAlertThresholdUsd": 500}`), the action fails the check automatically when waste exceeds the budget. See `action.yml` for every input (`live-pricing`, `scanners`, `min-age-days`, `ignore-tag`, `pdf`, `json`, `format`, `version`, …) and the `report`/`exit-code` outputs.

## GitHub Actions — building from source

Alternative if you'd rather pin to an unreleased commit instead of a published version:

```yaml
name: Cloud cost check
on: [pull_request]

permissions:
  contents: read

jobs:
  cloudrift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          repository: elleVas/cloudrift
          path: cloudrift-cli

      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          cache-dependency-path: cloudrift-cli/pnpm-lock.yaml

      - run: pnpm install --frozen-lockfile
        working-directory: cloudrift-cli
      - run: pnpm nx build cli
        working-directory: cloudrift-cli

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      # Publish report to step summary; exits 2 if over budget
      - run: node cloudrift-cli/apps/cli/dist/main.js analyze -r us-east-1 eu-west-1 --format markdown >> "$GITHUB_STEP_SUMMARY"
```

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Scan completed, waste below threshold (or no threshold configured) |
| 2 | Total waste exceeds `costAlertThresholdUsd` — pipeline blocked |

## Notes

- In CI (or when stdout is not a TTY), the interactive picker doesn't appear: all scanners run automatically
- `cloudrift.config.json` is read from the current working directory — commit it to the repo to share with the team
