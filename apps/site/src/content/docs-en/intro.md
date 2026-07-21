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

> ⚠️ **Disclaimer:** cloudrift is a read-only analysis tool: it reports estimated waste and recommendations — it does not delete, modify or stop any AWS resource. All findings should be validated by your infrastructure team before taking action.

## Why

Unused AWS resources accumulate costs with no value. Unattached EBS volumes, unassociated Elastic IPs, stopped RDS instances, NAT Gateways with no traffic — cloudrift finds them automatically and tells you how much you're spending for nothing.

## What it detects

cloudrift analyzes **38 resource types** divided into two categories:

- **`waste`** — money being spent now, eliminable by removing/detaching the resource. Contributes to the headline total and the CI gate.
- **`optimization`** — a savings opportunity that keeps the resource, shown separately and never gated.

### Core resources (waste)

| Resource | Waste condition | Estimated cost (us-east-1) |
|----------|----------------|---------------------------|
| **EBS Volumes** | Unattached (`state: available`) | gp3: $0.08/GB-mo · gp2: $0.10/GB-mo · io1: $0.125/GB-mo |
| **Elastic IPs** | Unassociated (no EC2/NAT binding) | $3.60/month fixed |
| **RDS Instances** | Stopped (storage still billed) | gp2/gp3: $0.115/GB-month |
| **Load Balancers** | No registered targets (ALB/NLB) | ~$16.20/month fixed |
| **EC2 Instances** | Stopped (attached EBS still billed) | Sum of attached EBS volumes |
| **EBS Snapshots** | Source volume deleted (orphans) | $0.05/GB-month |
| **NAT Gateways** | Zero outbound traffic in the last 48h | ~$32.40/month fixed |
| **EBS Volumes (idle)** | Attached but zero I/O in the last 48h | Same as above by type |
| **CloudWatch Log Groups** | No retention policy configured | $0.03/GB-month |
| **Orphaned ENIs** | `Status: available` (not attached) | $0 (hygiene flag) |
| **EFS File Systems (unused)** | No mount targets or zero I/O in 48h | $0.30/GB-month |
| **ElastiCache Clusters (idle)** | Zero connections in 48h | Full node-hour cost |
| **Redshift Clusters (idle)** | Zero DB connections in 48h | Node-hour × nodes |
| **OpenSearch Domains (idle)** | Zero requests in 48h | Instance-hour × instances |
| **MSK Clusters (idle)** | Zero broker traffic in 48h | Broker-hour × brokers |
| **FSx File Systems (idle)** | Zero I/O in 48h | $0.093–$0.14/GB-month |
| **DocumentDB (idle)** | Zero connections in 48h | Full instance-hour cost |
| **Neptune (idle)** | Zero query traffic in 48h | Full instance-hour cost |
| **Amazon MQ (idle)** | Zero network traffic in 48h | Broker-hour (×2 for Multi-AZ) |
| **WorkSpaces (idle)** | AlwaysOn, no user connection in 30 days | Full bundle monthly cost |
| **VPN Site-to-Site (idle)** | Zero tunnel traffic in 48h | ~$36.50/month |
| **Transit Gateway (idle)** | Zero traffic in 48h | ~$36.50/month |
| **Kinesis Streams (idle)** | Provisioned, zero records in 48h | ~$10.95/month per shard |
| **SQS DLQ (abandoned)** | Oldest message > 14 days | $0 (hygiene flag) |
| **CloudWatch Log Groups (orphaned Lambda)** | Lambda function no longer exists | $0.03/GB-month |
| **SageMaker Notebook Instances (idle)** | `InService`, max CPU ≤ 2% over 7 days | Full instance-hour cost |
| **SageMaker Endpoints (idle)** | `InService`, zero invocations over 7 days | Full instance-hour cost × instance count |

### Optimizations

| Resource | Condition | Estimated saving |
|----------|-----------|-----------------|
| **EBS gp2→gp3** | In-use gp2 volume upgradeable | ≈ $0.02/GB-mo |
| **EC2 (underutilized)** | Running, max CPU ≤ 5% over 14 days | ~50% of monthly cost (estimate) |
| **RDS (underutilized)** | Max CPU ≤ 5% over 14 days | ~50% of monthly cost (estimate) |
| **S3 Buckets (no lifecycle)** | No lifecycle configuration | ~40% of Standard storage (estimate) |
| **Lambda (underutilized)** | Zero invocations in 7 days | $0 (hygiene, pay-per-use) |
| **DynamoDB (overprovisioned)** | Read/write utilization < 10% in 7 days | ~50% of provisioned RCU/WCU (estimate) |
| **Aurora Serverless v2** | Min ACU overprovisioned | (Min ACU − suggested) × $87.60/ACU-month |
| **SageMaker Models (orphaned)** | Not referenced by any endpoint | Estimated S3 storage cost |
| **EKS Node Groups** | CPU requested < 30% of allocatable | (nodes − suggested) × instance price |
| **EKS Orphaned PVC** | Kubernetes-provisioned EBS unattached | EBS price by type |
| **Dev/PR Environments (ghost)** | All resources inactive for 7+ days | Estimated total of the group |

## False-positive guards

- **Grace period** — resources younger than 7 days (configurable via `--min-age-days`) are never reported
- **Exclusion tag** — any resource tagged `cloudrift:ignore` (configurable via `--ignore-tag`) is skipped
- **AMI-bound snapshots** — orphan snapshots referenced by a registered AMI are not reported (they cannot be deleted anyway)

## Key features

- Multi-service scanning (38 scanners) and multi-region
- Monthly cost estimate for every resource (region-aware pricing, 6 regions with specific pricing)
- PDF report with executive summary and recommendations
- CI/CD gate: blocks pipeline if waste exceeds a threshold (`costAlertThresholdUsd`)
- Policy as Code with OPA for advanced rules (per-tag, per-type, per-count)
- Interactive scanner picker in terminal, auto-skip in CI
- Output in table, JSON or markdown format
- Three pricing layers: static, live AWS Pricing API, custom overrides

## Tech stack

- **TypeScript** (strict mode)
- **AWS SDK v3** (modular clients, built-in retry/backoff)
- **DDD Architecture** (Ports & Adapters) with plugin model
- **Nx monorepo** with pnpm
- **Jest** for testing (unit, contract with fixture replay, e2e LocalStack)
- **esbuild** for CLI bundling
- **pdfkit** for PDF generation (no headless browser)
- **Commander.js** for argument parsing
- **Zod** for config validation
