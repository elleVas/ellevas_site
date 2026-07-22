---
title: Pricing
description: How cloudrift resolves costs — static table, AWS Pricing API, custom overrides.
order: 7
---

# Pricing

cloudrift estimates the monthly cost of every wasted resource. Prices are resolved from three layers, per `(region, priceKey)` — the most specific wins.

## The three layers

```
┌─────────────────────────────────────────────────────┐
│  1. Config overrides (prices)       ← ALWAYS WINS   │
├─────────────────────────────────────────────────────┤
│  2. AWS Pricing API (--live-pricing)                │
├─────────────────────────────────────────────────────┤
│  3. Built-in static table (prices.json)             │
└─────────────────────────────────────────────────────┘
```

### 1. Config overrides (highest priority)

Your negotiated/enterprise rates, defined in the `prices` field of `cloudrift.config.json`:

```json
{
  "prices": {
    "eu-west-1": { "nat-gateway": 28.5, "ebs-gp3": 0.07 },
    "default": { "elastic-ip": 3.2 }
  }
}
```

This is the **only way** to make the report match what you actually pay.

### 2. AWS Pricing API (`--live-pricing`)

With the `--live-pricing` flag, cloudrift fetches current public list prices from the AWS Pricing API at startup:

```bash
node apps/cli/dist/main.js analyze --live-pricing
```

The adapter accepts a price **only when the filters resolve to a single value** — ambiguous results fall back to the static table without guessing. Any Pricing API failure degrades the entire layer to the static fallback with a warning (never a crash).

> **Requires** the `pricing:GetProducts` IAM permission in addition to the standard permissions.

### 3. Built-in static table

Always present as the final fallback. Contains specific prices for 6 regions (`us-east-1`, `us-west-2`, `eu-west-1`, `eu-central-1`, `ap-southeast-1`, `ap-northeast-1`) with fallback to `us-east-1` for all others.

## Main price table (us-east-1)

| Resource | Price |
|----------|-------|
| EBS gp3 | $0.080/GB-month |
| EBS gp2 | $0.100/GB-month |
| EBS io1/io2 | $0.125/GB-month |
| EBS st1 | $0.045/GB-month |
| EBS sc1 | $0.018/GB-month |
| EBS snapshot | $0.05/GB-month |
| Unassociated Elastic IP | $3.60/month |
| RDS storage gp2/gp3 | $0.115/GB-month |
| ALB/NLB (base) | ~$16.20/month |
| NAT Gateway (base) | ~$32.40/month |
| CloudWatch Logs | $0.03/GB-month |
| EFS Standard | $0.30/GB-month |

## Live-pricing gated scanners (per-instance)

Some scanners need a per-instance-type/node-type price that's too variable for the static table. These are registered **only with `--live-pricing`**:

- `ec2-underutilized` — EC2 per instance type
- `rds-underutilized` — RDS per instance class and engine
- `elasticache-idle` — per cache node type
- `redshift-idle-cluster` — per node type
- `opensearch-idle-domain` — per instance type
- `msk-idle-cluster` — per broker instance type
- `documentdb-idle-instance` — per instance class
- `neptune-idle-instance` — per instance class
- `mq-idle-broker` — per broker instance type
- `workspaces-idle` — per bundle type
- `sagemaker-notebook-idle` — per instance type
- `sagemaker-endpoint-idle` — per instance type
- `eks-node-overprovisioned` — per node instance type

Without `--live-pricing` these scanners simply aren't run (they aren't registered in the composition root), rather than reporting a zero estimate.

## How it's shown in reports

Every report (table, PDF, JSON) shows a `prices as of` indicator reflecting the layer used:

- Static only: the date the `prices.json` file was last updated
- With live pricing: the date of the live fetch
- With overrides: `… + custom overrides`

## Honest caveat on pricing

Even with `--live-pricing`, AWS returns **list** prices — not your actual bill. Savings Plans, Reserved Instances and EDP discounts are not reflected. The `prices` overrides in the config are the only way to encode the rates you actually pay.

cloudrift's pricing is an estimation tool, not a precise billing calculator. Use it as an indicator of magnitudes and priorities, not as a substitute for Cost Explorer.
