---
title: Quick Start
description: Installation and first usage of cloudrift.
order: 2
---

# Quick Start

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- AWS credentials with read-only permissions

## Installation

cloudrift is not yet published on npm. It must be built and run from source:

```bash
git clone https://github.com/elleVas/cloudrift.git
cd cloudrift
pnpm install
pnpm nx build cli
```

Output is compiled to `apps/cli/dist/`.

## AWS credentials setup

cloudrift uses the standard AWS SDK v3 credential chain:

1. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. AWS profile (`~/.aws/credentials`)
3. IAM Role (if on EC2/ECS/Lambda)

```bash
# Option A — AWS CLI
aws configure

# Option B — environment variables
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=wJal...
export AWS_DEFAULT_REGION=us-east-1
```

Verify: `aws sts get-caller-identity` should return your account ID.

## First usage

```bash
# Scan the default region (us-east-1)
node apps/cli/dist/main.js analyze

# Scan multiple regions
node apps/cli/dist/main.js analyze -r us-east-1 eu-west-1

# Specific services only
node apps/cli/dist/main.js analyze --scanners ebs-volume elastic-ip

# JSON output
node apps/cli/dist/main.js analyze --format json

# PDF report
node apps/cli/dist/main.js analyze --pdf

# Markdown for GitHub Actions step summary
node apps/cli/dist/main.js analyze --format markdown >> "$GITHUB_STEP_SUMMARY"
```

## Main options

| Flag | Description | Default |
|------|-------------|---------|
| `-r, --regions` | AWS regions to scan | `us-east-1` |
| `--format` | Output format: `table`, `json`, `markdown` | `table` |
| `--live-pricing` | Use current prices from AWS Pricing API | off (static table) |
| `--scanners` | Only these services (skips picker) | — |
| `--all-services` | All scanners without interactive picker | on in CI |
| `--min-age-days` | Grace period in days | `7` |
| `--ignore-tag` | Exclusion tag | `cloudrift:ignore` |
| `--pdf [filename]` | Generate PDF report | — |
| `--json [filename]` | Generate JSON report to disk | — |
| `--silent` | No stdout output | off |
