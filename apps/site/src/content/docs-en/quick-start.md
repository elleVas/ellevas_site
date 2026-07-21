---
title: Quick Start
description: Installation and first usage of cloudrift.
order: 2
---

# Quick Start

## Prerequisites

- **Node.js 20+** — check with `node --version`
- **AWS credentials** with read-only permissions (see [Required IAM permissions](#required-iam-permissions) below)

## Installation

```bash
npm install -g @cloudrift/cli
# or run it once-off, without installing:
npx @cloudrift/cli analyze
```

**From source** (for contributing, or to run unreleased changes):

```bash
git clone https://github.com/elleVas/cloudrift.git
cd cloudrift
pnpm install
pnpm nx build cli   # output compiled to apps/cli/dist/
```

The examples below use the `cloudrift` command (npm install). Running from source instead? Replace `cloudrift` with `node apps/cli/dist/main.js`.

## AWS credentials setup

cloudrift uses the standard AWS SDK v3 credential chain. Three options, in order of preference:

**Option A — AWS CLI (recommended)**

```bash
aws configure
# enter: Access Key ID, Secret Access Key, default region (e.g. us-east-1), output format (json)
```

This creates `~/.aws/credentials` with the `default` profile.

**Option B — Edit `~/.aws/credentials` manually**

```ini
[default]
aws_access_key_id     = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**Option C — Environment variables**

```bash
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
export AWS_DEFAULT_REGION=us-east-1
```

**Verify:** `aws sts get-caller-identity` should return your account ID without errors.

## Required IAM permissions

The AWS user/role must have this read-only policy:

```json
{
  "Effect": "Allow",
  "Action": [
    "ec2:DescribeVolumes",
    "ec2:DescribeAddresses",
    "ec2:DescribeInstances",
    "ec2:DescribeSnapshots",
    "ec2:DescribeImages",
    "ec2:DescribeNatGateways",
    "ec2:DescribeNetworkInterfaces",
    "cloudwatch:GetMetricStatistics",
    "rds:DescribeDBInstances",
    "rds:DescribeDBClusters",
    "elasticloadbalancing:DescribeLoadBalancers",
    "elasticloadbalancing:DescribeTargetGroups",
    "elasticloadbalancing:DescribeTargetHealth",
    "logs:DescribeLogGroups",
    "s3:ListAllMyBuckets",
    "s3:GetBucketLifecycleConfiguration",
    "lambda:ListFunctions",
    "elasticfilesystem:DescribeFileSystems",
    "dynamodb:ListTables",
    "dynamodb:DescribeTable",
    "elasticache:DescribeCacheClusters",
    "sagemaker:ListNotebookInstances",
    "sagemaker:ListEndpoints",
    "sagemaker:DescribeEndpoint",
    "sagemaker:DescribeEndpointConfig",
    "sagemaker:ListEndpointConfigs",
    "sagemaker:ListModels",
    "sagemaker:DescribeModel",
    "sagemaker:ListTags",
    "sqs:ListQueues",
    "sqs:GetQueueAttributes",
    "sqs:ListDeadLetterSourceQueues",
    "sqs:ListQueueTags",
    "tag:GetResources",
    "eks:ListClusters",
    "eks:ListNodegroups",
    "eks:DescribeNodegroup",
    "sts:GetCallerIdentity"
  ],
  "Resource": "*"
}
```

> `--live-pricing` additionally requires `pricing:GetProducts` (AWS Pricing API). Not needed for the default static pricing.

## First usage

```bash
# Scan the default region (us-east-1)
# Account ID is auto-detected via STS
cloudrift analyze

# Scan multiple regions
cloudrift analyze -r us-east-1 eu-west-1 ap-southeast-1

# Specific services only (skips the interactive picker)
cloudrift analyze --scanners ebs-volume elastic-ip

# All scanners without interactive picker
cloudrift analyze --all-services

# Disable the grace period (report resources of any age)
cloudrift analyze --min-age-days 0
```

### The interactive picker

Running `analyze` in a real terminal (outside CI) shows an **interactive picker** — a checkbox list of every scanner, all pre-selected. Press Enter to scan everything, or deselect what you don't need.

The picker **never appears** when:
- `stdout` is not a TTY (piped output)
- The `CI=true` environment variable is set
- You use `--silent`, `--scanners <kinds...>` or `--all-services`

In those cases all scanners run automatically.

## Output formats

```bash
# Console table (default)
cloudrift analyze

# JSON output (machine-readable, ideal for piping)
cloudrift analyze --format json | jq '.totalWasteMonthlyUsd'

# Filter findings with jq
cloudrift analyze --format json | jq '.findings[] | select(.category=="waste")'

# Markdown for GitHub Actions step summary
cloudrift analyze --format markdown >> "$GITHUB_STEP_SUMMARY"
```

> In machine-readable formats (`json`, `markdown`) all human messages are routed to stderr, so stdout carries only the report — ideal for piping.

## PDF report

```bash
# PDF with auto-generated filename (reports/AWS_report_YYYY_MM_DD.pdf)
cloudrift analyze --pdf

# PDF with custom filename, no terminal output
cloudrift analyze --pdf ./report.pdf --silent
```

The PDF report contains:
- **Executive summary** — monthly and annual waste totals, resource count, per-type breakdown
- **Top recommendations** — up to 8 items sorted by impact, with estimated annual saving
- **Detail pages** — one table per resource type found
- **Scan warnings** — listed if any resource type could not be scanned

> **Flag order:** the `--pdf` filename is optional, so it's only picked up if it immediately follows the flag. Use `--pdf=./report.pdf --silent` to avoid ambiguity.

## JSON file report

```bash
# Also writes a JSON file to disk (independent of --format)
cloudrift analyze --json

# With custom filename
cloudrift analyze --json ./report.json --silent
```

## Partial failure handling

If scanning a resource type fails (e.g. missing CloudWatch permissions for NAT Gateways), the tool:

- Still returns all other results
- Shows a **"Scan Warnings"** section with the error details
- Marks the total as `(incomplete — see warnings above)`

```
  ⚠ Scan Warnings
  • NAT Gateways: Access denied to CloudWatch metrics

  Total estimated waste: $56.20/month (incomplete — see warnings above)
```

The exit code is driven **only** by the cost threshold, never by scan errors.

## All options

| Flag | Description | Default |
|------|-------------|---------|
| `-r, --regions <regions...>` | AWS regions to scan | `us-east-1` |
| `--format <format>` | stdout format: `table`, `json`, `markdown` | `table` |
| `--config <path>` | Path to config file | auto-discovered |
| `--live-pricing` | Current prices from AWS Pricing API | off |
| `--scanners <kinds...>` | Only these services (skips picker) | — |
| `--all-services` | All scanners without picker | on in CI/non-TTY |
| `--account-id <id>` | Account ID override (auto-detected via STS) | auto |
| `--min-age-days <days>` | Grace period in days | `7` |
| `--ignore-tag <tag>` | Exclusion tag | `cloudrift:ignore` |
| `--pdf [filename]` | Generate PDF report | — |
| `--json [filename]` | Generate JSON report to disk | — |
| `--silent` | No stdout output | off |
| `-h, --help` | Show help | — |

## Example output

```
  Scanning us-east-1 (account 123456789012) for wasted cloud resources...

  EBS Volumes — Unattached
  ┌────────────────────┬───────────┬────────┬──────┬────────────┬────────────┐
  │ Volume ID          │ Region    │ Size   │ Type │ Created    │ Est. Cost  │
  ├────────────────────┼───────────┼────────┼──────┼────────────┼────────────┤
  │ vol-0abc123def456  │ us-east-1 │ 500 GB │ gp3  │ 2025-01-15 │ $40.00/mo  │
  └────────────────────┴───────────┴────────┴──────┴────────────┴────────────┘

  Total estimated waste: $40.00/month
```

## Per-region pricing

Prices are region-aware. Regions with specific pricing: `us-east-1`, `us-west-2`, `eu-west-1`, `eu-central-1`, `ap-southeast-1`, `ap-northeast-1`. All others fall back to us-east-1 defaults.

Every report shows `prices as of` with the date the price table was last verified.
