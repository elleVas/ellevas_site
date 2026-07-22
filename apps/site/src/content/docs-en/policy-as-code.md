---
title: Policy as Code (OPA)
description: Advanced rules with Open Policy Agent — from-zero walkthrough with conftest.
order: 6
---

# Policy as Code (OPA)

The `costAlertThresholdUsd` gate in the config is a total-vs-budget comparison. For more expressive rules — per-tag, per-resource-kind, per-count — cloudrift supports [Open Policy Agent](https://www.openpolicyagent.org/) (OPA).

## How it works

cloudrift **never runs OPA itself** — it only produces JSON. You (or your CI pipeline) run `conftest`/`opa` against the JSON output:

```bash
node apps/cli/dist/main.js analyze --format json > report.json
conftest test --policy policy report.json
```

`conftest` exits 1 if any rule denies something, 0 if the report is clean — exactly the signal a CI step needs.

## Prerequisites

Install `conftest`:

```bash
# macOS
brew install conftest

# Other platforms: https://www.conftest.dev/install/
```

## Try it in 30 seconds (no AWS account needed)

The repo ships a sample report at `policy/testdata/sample-report.json`. You can see the policies fire immediately:

```bash
conftest test --policy policy policy/testdata/sample-report.json
```

Expected output — all three example policies deny something:

```
FAIL - policy/testdata/sample-report.json - main - 3 unattached EBS volumes found, more than the 2 allowed
FAIL - policy/testdata/sample-report.json - main - ebs-volume (vol-0abc123def456) in production is wasting $40/month
FAIL - policy/testdata/sample-report.json - main - total monthly waste $63.6 exceeds budget $50
```

## Included example policies

| File | Rule |
|------|------|
| `policy/waste-budget.rego` | Total monthly waste over a fixed budget |
| `policy/production-tag.rego` | Any waste finding tagged `Environment: production` |
| `policy/idle-resource-count.rego` | More than N unattached EBS volumes |

Each has an associated `_test.rego` sibling. Run the policy tests:

```bash
opa test policy/ -v
```

## Writing a custom rule

All policies share `package main`. Rego merges same-named `deny contains msg if {...}` blocks, so a fourth file just needs the same package header and its own condition. Example — deny any finding over $100/month:

```rego
# policy/high-cost-finding.rego
package main

import rego.v1

deny contains msg if {
  some finding in input.findings
  finding.category == "waste"
  finding.monthlyCostUsd > 100
  msg := sprintf("%s (%s) is wasting $%v/month", [finding.kind, finding.id, finding.monthlyCostUsd])
}
```

`input` is the parsed JSON report — available fields per finding: `kind`, `category`, `tags`, `monthlyCostUsd`, `region`, `id`, `wasteReason`. Top-level: `totalWasteMonthlyUsd`, `wasteCount`, `findings[]`.

> **Rego gotcha:** cloudrift serializes whole-dollar amounts without a decimal point (e.g. `$40` becomes `40`, not `40.00`). Rego's `%.2f` format verb crashes on integers. Use `%v` in your rules.

## Wire it into CI

Add a step after the scan:

```yaml
      - run: node cloudrift-cli/apps/cli/dist/main.js analyze -r us-east-1 --format json > report.json
        working-directory: cloudrift-cli

      - uses: openpolicyagent/conftest-action@v1
        with:
          policy: cloudrift-cli/policy
          files: cloudrift-cli/report.json
```

Or install `conftest` directly and run `conftest test --policy policy report.json`.

## Why external to the CLI

Embedding an OPA runtime (a shelled-out binary or WASM build) inside the npm package would add a heavy, platform-specific dependency to get a result that — for most users — a numeric comparison already provides. The value of a real policy engine only shows up with expressive, multi-signal rules, or when reusing an OPA/Rego bundle already maintained for Terraform or Kubernetes. Keeping OPA outside the package means cloudrift stays a lightweight CLI and anyone who wants this layer opts into it explicitly.
