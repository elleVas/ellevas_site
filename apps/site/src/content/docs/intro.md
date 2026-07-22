---
title: Introduzione
description: Cos'è cloudrift e a cosa serve.
order: 1
---

<div style="display:flex;align-items:center;gap:12px;margin-bottom:1rem;">
  <img src="/icons/cloudrift.png" alt="cloudrift logo" width="48" height="48" style="image-rendering:pixelated;" />
  <h1 style="margin:0;">cloudrift</h1>
</div>

**cloudrift** è una CLI che analizza account AWS per identificare risorse sprecate e stimarne il costo mensile.

> ⚠️ **Disclaimer:** cloudrift è uno strumento di analisi in sola lettura: segnala spreco stimato e raccomandazioni — non cancella, modifica o ferma alcuna risorsa AWS. Ogni finding deve essere validato dal tuo team infrastrutturale prima di agire.

## Perché

Le risorse AWS inutilizzate accumulano costi senza valore. EBS volumes non attaccati, Elastic IP non associati, RDS ferme, NAT Gateway senza traffico — cloudrift li trova automaticamente e ti dice quanto stai spendendo per niente.

## Cosa rileva

cloudrift analizza **43 tipi di risorse** suddivisi in due categorie:

- **`waste`** — denaro speso ora, eliminabile rimuovendo la risorsa. Contribuisce al totale principale e al gate CI.
- **`optimization`** — opportunità di risparmio che mantiene la risorsa, mostrata a parte e mai usata come gate.

### Risorse principali (waste)

| Risorsa | Condizione di spreco | Costo stimato (us-east-1) |
|---------|---------------------|---------------------------|
| **EBS Volumes** | Non attaccati (`state: available`) | gp3: $0,08/GB-mese · gp2: $0,10/GB-mese · io1: $0,125/GB-mese |
| **Elastic IP** | Non associati a EC2/NAT | $3,60/mese fisso |
| **RDS Instances** | Ferme (`stopped`) | gp2/gp3: $0,115/GB-mese |
| **Load Balancers** | Nessun target registrato (ALB/NLB) | ~$16,20/mese fisso |
| **EC2 Instances** | Ferme (EBS attaccati fatturati) | Somma dei volumi EBS |
| **EBS Snapshots** | Volume sorgente cancellato (orfani) | $0,05/GB-mese |
| **NAT Gateways** | Zero traffico outbound nelle ultime 48h | ~$32,40/mese fisso |
| **EBS Volumes (idle)** | Attaccati ma zero I/O nelle ultime 48h | Come sopra per tipo |
| **CloudWatch Log Groups** | Nessuna retention policy | $0,03/GB-mese |
| **ENI orfane** | `Status: available` (non attaccate) | $0 (igiene) |
| **EFS File Systems (unused)** | Zero mount targets o zero I/O in 48h | $0,30/GB-mese |
| **ElastiCache Clusters (idle)** | Zero connessioni in 48h | Costo pieno node-hour |
| **Redshift Clusters (idle)** | Zero connessioni DB in 48h | Node-hour × nodi |
| **OpenSearch Domains (idle)** | Zero richieste in 48h | Instance-hour × istanze |
| **MSK Clusters (idle)** | Zero traffico broker in 48h | Broker-hour × broker |
| **FSx File Systems (idle)** | Zero I/O in 48h | $0,093–$0,14/GB-mese |
| **DocumentDB (idle)** | Zero connessioni in 48h | Costo pieno instance-hour |
| **Neptune (idle)** | Zero query in 48h | Costo pieno instance-hour |
| **Amazon MQ (idle)** | Zero traffico rete in 48h | Broker-hour (×2 per Multi-AZ) |
| **WorkSpaces (idle)** | AlwaysOn, nessuna connessione in 30 giorni | Costo pieno mensile bundle |
| **VPN Site-to-Site (idle)** | Zero traffico tunnel in 48h | ~$36,50/mese |
| **Transit Gateway (idle)** | Zero traffico in 48h | ~$36,50/mese |
| **Kinesis Streams (idle)** | Provisioned, zero record in 48h | ~$10,95/mese per shard |
| **SQS DLQ (abbandonate)** | Messaggio più vecchio > 14 giorni | $0 (igiene) |
| **CloudWatch Log Groups (Lambda orfani)** | Funzione Lambda non più esistente | $0,03/GB-mese |
| **SageMaker Notebook Instances (idle)** | `InService`, CPU max ≤ 2% in 7 giorni | Costo pieno instance-hour |
| **SageMaker Endpoints (idle)** | `InService`, zero invocazioni in 7 giorni | Costo pieno instance-hour × istanze |
| **AMI (inutilizzate)** | AMI di proprietà non referenziata da nessuna istanza o launch template | Costo degli snapshot EBS sottostanti, $0,05/GB-mese |
| **Immagini ECR (senza tag)** | Immagine dangling (nessun tag) in un repository | $0,10/GB-mese |
| **Multipart upload S3 (abbandonati)** | Multipart upload incompleto, mai completato né annullato | $0,023/GB-mese |
| **Snapshot RDS manuali (vecchi)** | Snapshot manuale più vecchio del periodo di grazia | $0,095/GB-mese |
| **Secret Secrets Manager (inutilizzati)** | Mai acceduti, o non acceduti negli ultimi 30 giorni | $0,40/segreto/mese fisso |

### Ottimizzazioni (optimization)

| Risorsa | Condizione | Risparmio stimato |
|---------|-----------|-------------------|
| **EBS gp2→gp3** | Volume gp2 in uso aggiornabile | ≈ $0,02/GB-mese |
| **EC2 (underutilized)** | Running, CPU max ≤ 5% in 14 giorni | ~50% del costo mensile (stima) |
| **RDS (underutilized)** | CPU max ≤ 5% in 14 giorni | ~50% del costo mensile (stima) |
| **S3 Buckets (no lifecycle)** | Nessuna lifecycle configuration | ~40% dello storage Standard (stima) |
| **Lambda (underutilized)** | Zero invocazioni in 7 giorni | $0 (igiene, pay-per-use) |
| **DynamoDB (overprovisioned)** | Read/write utilization < 10% in 7 giorni | ~50% del costo RCU/WCU (stima) |
| **Aurora Serverless v2** | Min ACU sovradimensionato | (Min ACU − suggerito) × $87,60/ACU-mese |
| **SageMaker Models (orfani)** | Non referenziati da endpoint | Costo stimato storage S3 |
| **EKS Node Groups** | CPU requested < 30% allocatable | (nodi − suggeriti) × prezzo istanza |
| **EKS PVC orfani** | Volume Kubernetes non attaccato | Prezzo EBS per tipo |
| **Ambienti Dev/PR fantasma** | Tutte le risorse inattive da 7+ giorni | Totale del gruppo |

## Protezioni contro i falsi positivi

- **Periodo di grazia** — risorse più giovani di 7 giorni (configurabile con `--min-age-days`) non vengono mai segnalate
- **Tag di esclusione** — qualunque risorsa con `cloudrift:ignore` (configurabile con `--ignore-tag`) viene saltata
- **Snapshot legati ad AMI** — non vengono segnalati (non sarebbero comunque cancellabili)

## Caratteristiche principali

- Scansione multi-servizio (43 scanner) e multi-regione
- Stima dei costi mensili per ogni risorsa (prezzi region-aware, 6 regioni con listino specifico)
- Confronto e trend di spesa via AWS Cost Explorer (`cost`, `trend`)
- Wizard interattivo per la selezione di scanner, regioni e modalità
- Report PDF con executive summary e raccomandazioni
- CI/CD gate: blocca la pipeline se gli sprechi superano una soglia (`costAlertThresholdUsd`)
- Policy as Code con OPA per regole avanzate (per-tag, per-tipo, per-conteggio)
- Picker interattivo degli scanner in terminale, skip automatico in CI
- Output in formato table, JSON o markdown
- Tre livelli di pricing: statico, AWS Pricing API live, override personalizzati

## Stack tecnico

- **TypeScript** (strict mode)
- **AWS SDK v3** (client modulari, retry/backoff built-in)
- **Architettura DDD** (Ports & Adapters) con plugin model
- **Nx monorepo** con pnpm
- **Jest** per il testing (unit, contract con fixture replay, e2e LocalStack)
- **esbuild** per il bundling della CLI
- **pdfkit** per la generazione PDF (no headless browser)
- **Commander.js** per il parsing argomenti
- **Zod** per la validazione del config
