---
title: Configuration
description: Configuration file cloudrift.config.json — fields, thresholds, price overrides.
order: 5
---

# Configuration

cloudrift reads `cloudrift.config.json` (or `.cloudriftrc`) from the current directory, or a path passed with `--config`. CLI flags take precedence over the config file, which takes precedence over built-in defaults. All fields are optional.

## Where does the file go

It is **your** file, not part of the published artifact. Put `cloudrift.config.json` in the directory you run the CLI from — typically your repo root, **committed** so it's picked up automatically in CI (after `actions/checkout`) and shared by the team.

Discovery is based on the current working directory, regardless of how the CLI is invoked. If the file lives elsewhere, point at it with `--config path/to/file.json`.

## Full example

```json
{
  "excludeRegions": ["us-gov-east-1"],
  "excludeTagValues": { "Environment": "Production" },
  "cloudwatchWindowHours": 168,
  "utilizationWindowHours": 168,
  "minAgeDays": 14,
  "ignoreTag": "cloudrift:ignore",
  "costAlertThresholdUsd": 500,
  "prices": {
    "eu-west-1": { "nat-gateway": 28.5, "ebs-gp3": 0.07 },
    "default": { "elastic-ip": 3.2 }
  },
  "thresholds": {
    "ebsIdleMaxOps": 0,
    "ec2CpuPercent": 5,
    "rdsCpuPercent": 5
  },
  "environmentDetection": {
    "tagKeys": ["Environment", "env", "branch"],
    "namingPatterns": ["*-pr-*", "*-preview-*", "*-dev-*", "*-feat-*"],
    "inactivityDays": 7
  }
}
```

## Field reference

| Field | Meaning | Default |
|-------|---------|---------|
| `excludeRegions` | Regions skipped even if passed via `-r` | `[]` |
| `excludeTagValues` | Exclude any resource carrying an exact `key: value` tag (e.g. don't touch `Environment: Production`) | `{}` |
| `cloudwatchWindowHours` | CloudWatch lookback window for zero-activity checks (NAT Gateway, EBS idle, ElastiCache, etc.) | `48` (max `168` = 7 days) |
| `utilizationWindowHours` | CloudWatch lookback window for CPU utilization checks (EC2/RDS underutilized) | `168` = 7 days (max `336` = 14 days) |
| `minAgeDays` | Grace period in days — resources younger than this are never reported | `7` |
| `ignoreTag` | Exclusion tag — resources carrying this tag are skipped | `cloudrift:ignore` |
| `costAlertThresholdUsd` | Budget threshold: if `totalWasteMonthlyUsd` exceeds this, exit code 2 (CI gate) | no threshold |
| `prices` | Per-region price overrides (see below) | `{}` |
| `thresholds` | Per-check thresholds (see below) | see table |
| `environmentDetection` | Dev/PR ghost environment scanner configuration (see below) | disabled |

## Precedence

```
Built-in defaults  ←  cloudrift.config.json  ←  CLI flags (win)
```

CLI flags **always** take precedence. For example `--min-age-days 0` overrides the config value.

## Thresholds (`thresholds`)

| Field | Meaning | Default |
|-------|---------|---------|
| `ebsIdleMaxOps` | Total I/O ops below which an attached EBS volume counts as idle | `0` |
| `ec2CpuPercent` | Max CPU% below which a running EC2 instance counts as underutilized | `5` |
| `rdsCpuPercent` | Max CPU% below which an RDS instance counts as underutilized | `5` |
| `auroraMinAcuUtilizationPercent` | % below which Aurora Serverless v2 Min ACU is considered overprovisioned | `50` |
| `sagemakerNotebookCpuPercent` | Max CPU% below which a SageMaker notebook counts as idle | `2` |
| `eksNodeUtilizationPercent` | CPU requested/allocatable below which an EKS Node Group is overprovisioned | `30` |

## Price overrides (`prices`)

You can override prices per region to use your **negotiated/enterprise rates**. Structure is `region → { priceKey: USD }`, with `default` as fallback:

```json
{
  "prices": {
    "eu-west-1": {
      "nat-gateway": 28.5,
      "ebs-gp3": 0.07
    },
    "default": {
      "elastic-ip": 3.2
    }
  }
}
```

Keys are the same used in the built-in price table (`prices.json`). An unrecognized key produces a non-blocking warning (not silently ignored).

> The `prices` overrides are the only way to make the report match what you actually pay — even `--live-pricing` returns AWS **list** prices only, not your bill (Savings Plans, RI, EDP discounts are not reflected).

## Environment detection (`environmentDetection`)

Configuration for the `environment-ghost` scanner (Dev/PR ghost environments):

```json
{
  "environmentDetection": {
    "tagKeys": ["Environment", "env", "branch"],
    "namingPatterns": ["*-pr-*", "*-preview-*", "*-dev-*", "*-feat-*"],
    "inactivityDays": 7
  }
}
```

| Field | Meaning | Default |
|-------|---------|---------|
| `tagKeys` | Tags used to group resources into "environments" | `[]` |
| `namingPatterns` | Naming patterns as fallback for grouping | `[]` |
| `inactivityDays` | Days of total inactivity to flag a group as ghost | `7` |

## CI/CD gate (`costAlertThresholdUsd`)

If the **waste** total (`totalWasteMonthlyUsd`) exceeds this threshold, the command exits with **code 2**, failing the pipeline. Savings of type `optimization` never count towards the gate.

```json
{
  "costAlertThresholdUsd": 500
}
```

Without this field, the command always exits with code 0 (unless argument parsing fails, which gives code 1).

## Common use cases

### Eliminate weekend false positives

A staging NAT Gateway with no traffic on weekends is a classic false positive:

```json
{
  "cloudwatchWindowHours": 168
}
```

With 168h (7 days) a quiet weekend alone won't trigger the finding.

### Weekly batch workloads

An EC2 instance that only spikes CPU once a week:

```json
{
  "utilizationWindowHours": 336
}
```

With 336h (14 days) the sample is wide enough to capture the spike.

### Don't touch production

```json
{
  "excludeTagValues": { "Environment": "Production" }
}
```

Any resource tagged `Environment: Production` is completely excluded from the report.
