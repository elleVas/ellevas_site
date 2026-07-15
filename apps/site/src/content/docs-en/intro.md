---
title: Introduction
description: What is cloudrift and what it does.
order: 1
---

<div style="display:flex;align-items:center;gap:12px;margin-bottom:1rem;">
  <img src="/icons/cloudrift.png" alt="cloudrift logo" width="48" height="48" style="image-rendering:pixelated;" />
  <h1 style="margin:0;">cloudrift</h1>
</div>

**cloudrift** is a CLI that analyzes AWS accounts to identify wasted resources and estimate their monthly cost.

> ⚠️ cloudrift is a read-only analysis tool: it reports estimated waste and recommendations — it does not delete, modify or stop any AWS resource.

## Why

Unused AWS resources accumulate costs with no value. Unattached EBS volumes, unassociated Elastic IPs, stopped RDS instances, NAT Gateways with no traffic — cloudrift finds them automatically and tells you how much you're spending for nothing.

## What it detects

| Resource | Waste condition |
|----------|----------------|
| EBS Volumes | Unattached (`state: available`) |
| Elastic IP | Not associated to EC2/NAT |
| RDS Instances | Stopped (storage still billed) |
| Load Balancers | No registered targets (ALB/NLB) |
| EC2 Instances | Stopped (attached EBS still billed) |
| EBS Snapshots | Source volume deleted (orphans) |
| NAT Gateways | Zero traffic in the last 48h |
| CloudWatch Log Groups | No retention policy |
| S3 Buckets | No lifecycle configuration |
| Lambda Functions | (Near) zero invocations in 7 days |
| EFS, DynamoDB, ElastiCache, Redshift, OpenSearch, MSK, FSx, DocumentDB, Neptune, MQ, WorkSpaces, VPN, Transit Gateway, Kinesis | Idle/overprovisioned |

Each finding is labeled `waste` (real waste) or `optimization` (savings opportunity).

## Key features

- Multi-service, multi-region scanning
- Monthly cost estimate for each resource (region-aware pricing)
- PDF report with executive summary and recommendations
- CI/CD gate: blocks pipeline if waste exceeds a threshold
- Policy as Code with OPA for advanced rules
- False positive protection (grace period, exclusion tags)
- Output in table, JSON or markdown format

## Tech stack

- **TypeScript** (strict mode)
- **AWS SDK v3**
- **DDD Architecture** (Ports & Adapters)
- **Nx monorepo** with pnpm
- **Jest** for testing
