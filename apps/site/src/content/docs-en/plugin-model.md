---
title: Plugin Model
description: How cloudrift scanners work and how to add a new one.
order: 4
---

# Plugin Model

Each AWS service is analyzed by an independent **scanner**. Scanners implement the `WasteScannerPort` interface defined in the domain layer. The coordinator (`AnalyzeCloudWasteUseCase`) is generic over registered scanners — it knows nothing about specific services.

## WasteScannerPort interface

Every scanner implements this port:

```typescript
interface WasteScannerPort {
  readonly resourceKind: ResourceKind;
  scan(params: ScanParams): Promise<WastedResource[]>;
}
```

## Existing scanners

| Scanner | Service | Waste condition |
|---------|---------|-----------------|
| EBS Volumes | EC2/EBS | Unattached (`state: available`) |
| EBS Volumes (idle) | EC2/EBS | Attached but zero I/O in 48h |
| EBS gp2→gp3 | EC2/EBS | gp2 volume upgradeable to gp3 |
| Elastic IPs | EC2 | Not associated |
| EC2 Instances | EC2 | Stopped (attached EBS still billed) |
| EC2 (underutilized) | EC2 | Running, max CPU ≤ 5% in 14 days |
| EBS Snapshots | EC2/EBS | Source volume deleted (orphans) |
| RDS Instances | RDS | Stopped (storage still billed) |
| RDS (underutilized) | RDS | Max CPU ≤ 5% in 14 days |
| Load Balancers | ELBv2 | No registered targets |
| NAT Gateways | VPC | Zero outbound traffic in 48h |
| CloudWatch Log Groups | CloudWatch | No retention policy |
| S3 Buckets | S3 | No lifecycle configuration |
| Lambda Functions | Lambda | Zero invocations in 7 days |
| EFS File Systems | EFS | Zero I/O in 48h |
| DynamoDB Tables | DynamoDB | Provisioned, utilization < 10% in 7 days |
| ElastiCache, Redshift, OpenSearch, MSK, FSx, DocumentDB, Neptune, MQ, WorkSpaces, VPN, Transit Gateway, Kinesis | Various | Idle (zero activity in 48h) |
| SQS DLQ (abandoned) | SQS | Oldest message > 14 days |
| CloudWatch Log Groups (orphaned Lambda) | CloudWatch | Lambda function no longer exists |
| Aurora Serverless v2 | RDS | Min ACU overprovisioned |
| SageMaker Notebooks/Endpoints/Models | SageMaker | Idle or orphaned |
| Dev/PR Environments (ghost) | Multi-service | All resources inactive for 7+ days |
| EKS Node Groups / Orphaned PVC | EKS | Overprovisioned or unattached |
| AMI (unused) | EC2 | Not referenced by instances or launch templates |
| ECR Images (untagged) | ECR | Dangling image in a repository |
| S3 Multipart uploads (abandoned) | S3 | Incomplete upload never completed |
| RDS Manual Snapshots (old) | RDS | Snapshot older than grace period |
| Secrets Manager (unused) | Secrets Manager | Not accessed in 30+ days |

## Adding a new scanner

Step-by-step guide (from the [README](https://github.com/elleVas/cloudrift)):

1. **Add the new kind** to the `ResourceKind` union type in `wasted-resource.ts` — the compiler then points to every spot that needs updating
2. **Create the entity** in `libs/cloud-cost/domain/src/entities/` implementing `WastedResource`
3. **Create the waste policy** in `libs/cloud-cost/domain/src/policies/` (grace period and ignore tag come free from the base class)
4. **Add the price key** to `prices.json` — `PricingPort` is a generic `getPrice(region, key)`, no interface changes needed
5. **Implement the scanner** in `libs/cloud-cost/infrastructure/aws-adapter/src/scanners/` (implements `WasteScannerPort`)
6. **Register** the presenter in `apps/cli/src/formatters/resource-presenters.ts` and the scanner in `analyze-waste.composition.ts`

**No changes needed** to `AnalyzeCloudWasteUseCase`, `WastedResourcesSummary`, `WasteReportDto`, or the formatters.

The TypeScript compiler guides the entire process: after adding the kind to the `ResourceKind` union, `pnpm nx run-many -t typecheck` shows exactly what needs to be completed.
