---
title: Honest Caveats
description: What cloudrift does not and cannot know — declared limits for each check type.
order: 9
---

# Honest Caveats

cloudrift is designed to be transparent about its own limits. Every check type has precise boundaries — here's what the tool **cannot** tell you and why.

## Lambda — invocation count only

We only check the **invocation count** over the lookback window (7 days), nothing else.

**What we don't do:**
- We do not rightsize memory allocation — that requires Lambda Insights (extra cost, must be enabled per-function), outside scope for a zero-extra-IAM read-only scan
- We do not catch idle **Provisioned Concurrency**, which *is* billed regardless of invocations

**Practical implication:** a function with zero invocations has, by definition, $0 direct cost (pay-per-use). The value of this finding is **hygiene** (dead code, unnecessary IAM roles, event sources to remove), not a dollar saving.

## EC2/RDS rightsizing — single-metric heuristic

The underutilized check is a heuristic on **one metric only** — max CPU below a threshold over the lookback window (default 5% over 14 days).

**What we don't look at:**
- RAM
- Network throughput
- Disk IOPS
- Connection count (for RDS)

**Why:** it requires no extra IAM permissions and works the same on every account. It's not a replacement for [AWS Compute Optimizer](https://aws.amazon.com/compute-optimizer/), which models multiple metrics and recommends a specific target type.

**How to use the finding:** treat it as **"go check this instance,"** not as a sizing recommendation. Cross-check with Compute Optimizer (or your own metrics) before resizing.

## EKS Node Groups — node-level aggregates only

The node-overprovisioned check reads **node-level** Container Insights aggregates (`node_cpu_request`/`node_cpu_limit`) via the AWS API only.

**What we don't see:**
- Individual Pod `resources.requests`/`resources.limits`
- We never talk to the Kubernetes API (no kubeconfig required)

**Prerequisite:** Container Insights must be enabled on the cluster. If it's not, the scanner reports nothing (it doesn't guess).

**How to use the finding:** the suggested node count is a starting point for investigation, not a sizing recommendation.

**EKS orphaned PVC — tag limitation:**
- The owning cluster name comes from the legacy `kubernetes.io/cluster/<name>` in-tree provisioner tag
- Volumes provisioned by the EBS CSI driver without `--extra-tags` won't carry the cluster name
- Those volumes are only flagged via the "unattached" check, never the "deleted cluster" check

## Aurora Serverless v2 — observation window

The finding is based on peak ACU observed over 7 days. The suggested Min ACU is `ceil(peakACU * 1.2)` — 20% headroom above the observed peak.

**Risk:** a rare weekly peak that falls outside the 7-day window looks like permanent overprovisioning. The 20% headroom is the mitigation, not a guarantee. Verify against a longer observation window for spiky workloads before lowering Min ACU.

## SageMaker Notebooks — CPU only

The check uses CPU only (default threshold 2%). For GPU notebook instances, the finding says nothing about GPU utilization — it also can't tell "idle kernel" from "someone reading a notebook without running cells."

Treat the finding as "go check this notebook," not as confirmed waste.

## SageMaker Models (orphaned) — intentional false positives

A model kept deliberately for rollback/backup looks identical to a truly abandoned one from the AWS-API-only view. The grace period (`--min-age-days`) is the only mitigation.

## Dev/PR ghost environments — depends on tagging

The `environment-ghost` scanner groups resources by tag value or naming pattern, then flags a group only when **every** resource in it has been inactive. Result quality depends entirely on your account's tagging/naming discipline. A team with neither will see nothing.

## Pricing — not your bill

Even with `--live-pricing`, AWS returns **list** prices:

- Savings Plans not reflected
- Reserved Instances not reflected
- EDP discounts not reflected
- Negotiated rates not reflected

The only way to approximate your actual bill: `prices` overrides in the config with your effective rates.

## What cloudrift is not

- **Not an enforcement tool** — it reports, it never acts
- **Not a replacement for AWS Compute Optimizer** — for sizing recommendations use Compute Optimizer
- **Not a replacement for Cost Explorer** — for precise cost analysis use the AWS console
- **Not a comprehensive AWS coverage** — there are hundreds of services, cloudrift covers 38
- **Does not detect Lambda Provisioned Concurrency** — out of scope for now
- **Does not talk to the Kubernetes API** — AWS API only, no kubeconfig
