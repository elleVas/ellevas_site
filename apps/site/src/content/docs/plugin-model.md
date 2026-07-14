---
title: Plugin Model
description: Come funzionano gli scanner di cloudrift e come aggiungerne uno nuovo.
order: 4
---

# Plugin Model

Ogni servizio AWS è analizzato da uno **scanner** indipendente. Gli scanner implementano l'interfaccia `WasteScannerPort` definita nel domain layer. Il coordinatore (`AnalyzeCloudWasteUseCase`) è generico sugli scanner registrati — non sa nulla dei servizi specifici.

## Interfaccia WasteScannerPort

Ogni scanner implementa questa porta:

```typescript
interface WasteScannerPort {
  readonly resourceKind: ResourceKind;
  scan(params: ScanParams): Promise<WastedResource[]>;
}
```

## Scanner esistenti

| Scanner | Servizio | Condizione di spreco |
|---------|----------|---------------------|
| EBS Volumes | EC2/EBS | Non attaccati (`state: available`) |
| EBS Volumes (idle) | EC2/EBS | Attaccati ma zero I/O in 48h |
| EBS gp2→gp3 | EC2/EBS | Volume gp2 aggiornabile a gp3 |
| Elastic IPs | EC2 | Non associati |
| EC2 Instances | EC2 | Ferme (EBS attaccati fatturati) |
| EC2 (underutilized) | EC2 | Running, CPU max ≤ 5% in 14 giorni |
| EBS Snapshots | EC2/EBS | Volume sorgente cancellato (orfani) |
| RDS Instances | RDS | Ferme (storage fatturato) |
| RDS (underutilized) | RDS | CPU max ≤ 5% in 14 giorni |
| Load Balancers | ELBv2 | Nessun target registrato |
| NAT Gateways | VPC | Zero traffico outbound in 48h |
| CloudWatch Log Groups | CloudWatch | Nessuna retention policy |
| S3 Buckets | S3 | Nessuna lifecycle configuration |
| Lambda Functions | Lambda | Zero invocazioni in 7 giorni |
| EFS File Systems | EFS | Zero I/O in 48h |
| DynamoDB Tables | DynamoDB | Provisioned, utilizzo < 10% in 7 giorni |
| ElastiCache, Redshift, OpenSearch, MSK, FSx, DocumentDB, Neptune, MQ, WorkSpaces, VPN, Transit Gateway, Kinesis | Vari | Idle (zero attività in 48h) |

## Aggiungere un nuovo scanner

Guida step-by-step (dal [README](https://github.com/elleVas/cloudrift)):

1. **Aggiungi il nuovo kind** alla union type `ResourceKind` in `wasted-resource.ts` — il compilatore poi indica ogni punto da aggiornare
2. **Crea l'entità** in `libs/cloud-cost/domain/src/entities/` implementando `WastedResource`
3. **Crea la waste policy** in `libs/cloud-cost/domain/src/policies/` (grace period e ignore tag sono gratis dalla base class)
4. **Aggiungi la chiave prezzo** a `prices.json` — `PricingPort` è un generico `getPrice(region, key)`, nessuna interfaccia da toccare
5. **Implementa lo scanner** in `libs/cloud-cost/infrastructure/aws-adapter/src/scanners/` (implementa `WasteScannerPort`)
6. **Registra** il presenter in `apps/cli/src/formatters/resource-presenters.ts` e lo scanner in `analyze-waste.composition.ts`

Nessuna modifica ad `AnalyzeCloudWasteUseCase`, al summary o al report DTO.
