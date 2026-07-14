---
title: Introduzione
description: Cos'è cloudrift e a cosa serve.
order: 1
---

# cloudrift

**cloudrift** è una CLI che analizza account AWS per identificare risorse sprecate e stimarne il costo mensile.

> ⚠️ cloudrift è uno strumento di analisi in sola lettura: segnala spreco stimato e raccomandazioni — non cancella, modifica o ferma alcuna risorsa AWS.

## Perché

Le risorse AWS inutilizzate accumulano costi senza valore. EBS volumes non attaccati, Elastic IP non associati, RDS ferme, NAT Gateway senza traffico — cloudrift li trova automaticamente e ti dice quanto stai spendendo per niente.

## Cosa rileva

| Risorsa | Condizione di spreco |
|---------|---------------------|
| EBS Volumes | Non attaccati (`state: available`) |
| Elastic IP | Non associati a EC2/NAT |
| RDS Instances | Ferme (storage ancora fatturato) |
| Load Balancers | Nessun target registrato (ALB/NLB) |
| EC2 Instances | Ferme (EBS attaccati fatturati) |
| EBS Snapshots | Volume sorgente cancellato (orfani) |
| NAT Gateways | Zero traffico nelle ultime 48h |
| CloudWatch Log Groups | Nessuna retention policy |
| S3 Buckets | Nessuna lifecycle configuration |
| Lambda Functions | (Quasi) zero invocazioni in 7 giorni |
| EFS, DynamoDB, ElastiCache, Redshift, OpenSearch, MSK, FSx, DocumentDB, Neptune, MQ, WorkSpaces, VPN, Transit Gateway, Kinesis | Idle/overprovisioned |

Ogni finding è etichettato `waste` (spreco reale) o `optimization` (opportunità di risparmio).

## Caratteristiche principali

- Scansione multi-servizio e multi-regione
- Stima dei costi mensili per ogni risorsa (prezzi region-aware)
- Report PDF con executive summary e raccomandazioni
- CI/CD gate: blocca la pipeline se gli sprechi superano una soglia
- Policy as Code con OPA per regole avanzate
- Protezioni contro falsi positivi (grace period, tag di esclusione)
- Output in formato table, JSON o markdown

## Stack tecnico

- **TypeScript** (strict mode)
- **AWS SDK v3**
- **Architettura DDD** (Ports & Adapters)
- **Nx monorepo** con pnpm
- **Jest** per il testing
