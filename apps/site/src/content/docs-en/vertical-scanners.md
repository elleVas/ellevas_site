---
title: Vertical Scanners
description: Phase 6 scanners — SQS, Aurora, SageMaker, Dev/PR environments, EKS.
order: 9
---

# Vertical Scanners (Phase 6)

Phase 6 added 9 specialized scanners across 5 verticals, on top of the 29 generalist scanners. Run any of them standalone:

```bash
node apps/cli/dist/main.js analyze --scanners eks-node-overprovisioned --live-pricing
```

## Serverless orphans

### `sqs-dlq-abandoned`

An SQS queue identified as a Dead Letter Queue (via its `RedrivePolicy`, being referenced as the target of another queue's redrive policy, or a `*-dlq`/`*-dead-letter` name match) whose oldest unconsumed message is older than 14 days.

- **Category:** waste (hygiene flag)
- **Cost:** $0 (SQS has no storage cost)
- **Value:** catching ignored errors and dead integrations

No dedicated config thresholds beyond `--min-age-days` / `cloudrift:ignore`.

### `lambda-loggroup-orphaned`

A CloudWatch Log Group under `/aws/lambda/` whose Lambda function no longer exists. Distinct from the generalist `log-group` scanner, which flags missing retention on *live* functions' log groups.

- **Category:** waste
- **Cost:** $0.03/GB-month (stored log data)

## Aurora Serverless v2

### `aurora-serverless-overprovisioned`

An Aurora Serverless v2 cluster whose Min ACU floor sits well above the peak `ServerlessDatabaseCapacity` observed over a 7-day window.

- **Category:** optimization
- **Suggested Min ACU:** `ceil(peakACU * 1.2)` — 20% headroom above the observed peak
- **Saving:** `(MinACU − suggestedMinACU) × $87.60/ACU-month`
- **Config:** `thresholds.auroraMinAcuUtilizationPercent` (default `50`)

**Risk:** a rare peak outside the 7-day window looks like overprovisioning. Verify against a longer observation window for spiky workloads before lowering Min ACU.

## SageMaker suite

Three scanners forming a model lifecycle view (notebook → endpoint → orphaned artifact):

### `sagemaker-notebook-idle`

A notebook instance `InService` with max CPU ≤ `thresholds.sagemakerNotebookCpuPercent` (default `2`) over a 7-day window.

- **Requires:** `--live-pricing`
- **Cost:** full instance-hour cost
- **Caveat:** CPU-only. GPU instances may cost hundreds/day and this check says nothing about GPU utilization

### `sagemaker-endpoint-idle`

An endpoint `InService` with zero `Invocations` over a 7-day window.

- **Requires:** `--live-pricing`
- **Cost:** full instance-hour cost × production variant instance count

### `sagemaker-training-orphaned`

A registered SageMaker Model not referenced by any Endpoint Config.

- **Category:** optimization (namespace hygiene)
- **Cost:** estimated S3 Standard storage of `ModelDataUrl`
- **Risk:** a model kept for rollback/backup looks identical to abandoned from the API-only view; the grace period is the only mitigation

## Dev/PR ghost environments

### `environment-ghost`

Groups resources (EC2, RDS, Lambda, Load Balancers) by tag value or naming-pattern match, then flags a group as "ghost" only when **every** resource in it has been inactive for `environmentDetection.inactivityDays` (default 7) or longer.

**Configuration** (`cloudrift.config.json`):

```json
{
  "environmentDetection": {
    "tagKeys": ["Environment", "env", "branch"],
    "namingPatterns": ["*-pr-*", "*-preview-*", "*-dev-*", "*-feat-*"],
    "inactivityDays": 7
  }
}
```

- `tagKeys` is tried first (resources grouped by tag value)
- `namingPatterns` is the fallback for resources without a matching tag
- This is the most experimental scanner — quality depends entirely on your tagging/naming discipline

Start by adding a `tagKeys` entry that matches how your org actually tags ephemeral environments.

## EKS cost visibility

Both scanners are **AWS-API-only** — no kubeconfig, no cluster-internal connectivity. This is a deliberate constraint: requiring cluster RBAC read access would break the "just an IAM role" trust model.

### `eks-node-overprovisioned`

An EKS Node Group whose CPU requested-to-allocatable ratio (per CloudWatch Container Insights node-level aggregates) is below `thresholds.eksNodeUtilizationPercent` (default `30`) over 7 days.

- **Requires:** `--live-pricing` + Container Insights enabled on the cluster
- **Saving:** `(nodeCount − suggestedNodeCount) × instance price`
- **Suggested node count:** scales toward 70%-target utilization, never below 1 node
- **Graceful degradation:** if Container Insights isn't enabled, the scanner emits a warning and produces no finding

**Caveat:** reads node-group-level aggregates only, never individual Pod requests/limits. It cannot tell you *which* Pods are oversized, only that the group as a whole looks overprovisioned.

### `eks-orphan-pvc`

An EBS volume provisioned for a Kubernetes PersistentVolumeClaim (identified via the CSI driver's `kubernetes.io/created-for/pvc/name` tag) that is either:

- Unattached (`state: available`), or
- Still tagged for an EKS cluster that no longer exists (via the legacy `kubernetes.io/cluster/<name>` tag correlated against `eks:ListClusters`)

- **Cost:** same static EBS pricing (no `--live-pricing` needed)
- **Caveat:** the cluster-name tag is a legacy convention. Volumes provisioned by the EBS CSI driver without `--extra-tags` are only caught by the unattached check, never the deleted-cluster one

## IAM permissions

All 9 scanners' required actions are included in the standard IAM policy: `sqs:*` read actions, `rds:DescribeDBClusters`, `tag:GetResources`, `eks:ListClusters`/`ListNodegroups`/`DescribeNodegroup`, plus the `sagemaker:*` read actions. The `--live-pricing` gated ones additionally need `pricing:GetProducts`.
