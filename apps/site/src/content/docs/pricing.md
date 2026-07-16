---
title: Pricing
description: Come cloudrift risolve i costi — tabella statica, AWS Pricing API, override personalizzati.
order: 6
---

# Pricing

cloudrift stima il costo mensile di ogni risorsa sprecata. I prezzi vengono risolti da tre livelli, per `(regione, chiave)` — il più specifico vince.

## I tre livelli

```
┌─────────────────────────────────────────────────────┐
│  1. Override del config (prices)    ← VINCE SEMPRE  │
├─────────────────────────────────────────────────────┤
│  2. AWS Pricing API (--live-pricing)                │
├─────────────────────────────────────────────────────┤
│  3. Tabella statica built-in (prices.json)          │
└─────────────────────────────────────────────────────┘
```

### 1. Override del config (massima priorità)

Le tue tariffe negoziate/aziendali, definite nel campo `prices` di `cloudrift.config.json`:

```json
{
  "prices": {
    "eu-west-1": { "nat-gateway": 28.5, "ebs-gp3": 0.07 },
    "default": { "elastic-ip": 3.2 }
  }
}
```

Questo è l'**unico modo** per far combaciare il report con ciò che paghi davvero.

### 2. AWS Pricing API (`--live-pricing`)

Con il flag `--live-pricing`, cloudrift recupera i prezzi di listino correnti dall'AWS Pricing API all'avvio della scansione:

```bash
node apps/cli/dist/main.js analyze --live-pricing
```

L'adapter accetta un prezzo **solo se i filtri risolvono un singolo valore** — se ambiguo, ricade sulla tabella statica senza provare a indovinare. Qualsiasi errore dell'API Pricing fa degradare l'intero livello al fallback statico con un warning (mai un crash).

> **Richiede** il permesso IAM `pricing:GetProducts` in aggiunta ai permessi standard.

### 3. Tabella statica built-in

Sempre presente come fallback finale. Contiene prezzi specifici per 6 regioni (`us-east-1`, `us-west-2`, `eu-west-1`, `eu-central-1`, `ap-southeast-1`, `ap-northeast-1`) con fallback a `us-east-1` per le altre.

## Tabella prezzi principali (us-east-1)

| Risorsa | Prezzo |
|---------|--------|
| EBS gp3 | $0,080/GB-mese |
| EBS gp2 | $0,100/GB-mese |
| EBS io1/io2 | $0,125/GB-mese |
| EBS st1 | $0,045/GB-mese |
| EBS sc1 | $0,018/GB-mese |
| EBS snapshot | $0,05/GB-mese |
| Elastic IP non associato | $3,60/mese |
| RDS storage gp2/gp3 | $0,115/GB-mese |
| ALB/NLB (base) | ~$16,20/mese |
| NAT Gateway (base) | ~$32,40/mese |
| CloudWatch Logs | $0,03/GB-mese |
| EFS Standard | $0,30/GB-mese |

## Scanner con pricing live (per-istanza)

Alcuni scanner necessitano di un prezzo per tipo di istanza/nodo, troppo variabile per la tabella statica. Questi vengono registrati **solo con `--live-pricing`**:

- `ec2-underutilized` — prezzo EC2 per instance type
- `rds-underutilized` — prezzo RDS per instance class e engine
- `elasticache-idle` — prezzo per cache node type
- `redshift-idle-cluster` — prezzo per node type
- `opensearch-idle-domain` — prezzo per instance type
- `msk-idle-cluster` — prezzo per broker instance type
- `documentdb-idle-instance` — prezzo per instance class
- `neptune-idle-instance` — prezzo per instance class
- `mq-idle-broker` — prezzo per broker instance type
- `workspaces-idle` — prezzo per bundle type
- `sagemaker-notebook-idle` — prezzo per instance type
- `sagemaker-endpoint-idle` — prezzo per instance type
- `eks-node-overprovisioned` — prezzo per instance type dei nodi

Senza `--live-pricing` questi scanner semplicemente non vengono eseguiti (non vengono registrati nel composition root), anziché riportare una stima zero.

## Come viene mostrato nel report

Ogni report (tabella, PDF, JSON) mostra un indicatore `prices as of` che riflette il livello usato:

- Solo statico: la data dell'ultimo aggiornamento del file `prices.json`
- Con live pricing: la data del fetch live
- Con override: `… + custom overrides`

## Nota onesta sul pricing

Anche con `--live-pricing`, AWS restituisce i prezzi di **listino** — non la tua bolletta reale. Savings Plans, Reserved Instances e sconti EDP non sono riflessi. Gli override `prices` nel config sono l'unico modo per encodare le tariffe che paghi veramente.

Il pricing di cloudrift è uno strumento di stima, non un calcolatore di fatturazione preciso. Usalo come indicatore di ordini di grandezza e priorità, non come sostituto di Cost Explorer.
