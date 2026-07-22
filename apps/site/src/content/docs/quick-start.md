---
title: Quick Start
description: Installazione e primo utilizzo di cloudrift.
order: 2
---

# Quick Start

## Prerequisiti

- **Node.js 20+** — verifica con `node --version`
- **Credenziali AWS** con permessi in sola lettura (vedi [Permessi IAM](#permessi-iam-necessari) sotto)

## Installazione

```bash
npm install -g @cloudrift/cli
# oppure eseguilo una tantum, senza installarlo:
npx @cloudrift/cli analyze
```

**Dai sorgenti** (per contribuire, o per eseguire modifiche non ancora rilasciate):

```bash
git clone https://github.com/elleVas/cloudrift.git
cd cloudrift
pnpm install
pnpm nx build cli   # output compilato in apps/cli/dist/
```

Gli esempi qui sotto usano il comando `cloudrift` (installazione da npm). Esegui dai sorgenti? Sostituisci `cloudrift` con `node apps/cli/dist/main.js`.

## Configurazione credenziali AWS

cloudrift usa la chain standard di credenziali AWS SDK v3. Tre opzioni, in ordine di preferenza:

**Opzione A — AWS CLI (consigliato)**

```bash
aws configure
# inserisci: Access Key ID, Secret Access Key, regione default (es. us-east-1), output format (json)
```

Questo crea `~/.aws/credentials` con il profilo `default`.

**Opzione B — File `~/.aws/credentials` manuale**

```ini
[default]
aws_access_key_id     = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**Opzione C — Variabili d'ambiente**

```bash
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
export AWS_DEFAULT_REGION=us-east-1
```

**Verifica:** `aws sts get-caller-identity` deve restituire il tuo account ID senza errori.

## Permessi IAM necessari

L'utente/ruolo AWS deve avere questa policy in sola lettura:

```json
{
  "Effect": "Allow",
  "Action": [
    "ec2:DescribeVolumes",
    "ec2:DescribeAddresses",
    "ec2:DescribeInstances",
    "ec2:DescribeSnapshots",
    "ec2:DescribeImages",
    "ec2:DescribeNatGateways",
    "ec2:DescribeNetworkInterfaces",
    "ec2:DescribeLaunchTemplates",
    "ec2:DescribeLaunchTemplateVersions",
    "cloudwatch:GetMetricStatistics",
    "rds:DescribeDBInstances",
    "rds:DescribeDBClusters",
    "rds:DescribeDBSnapshots",
    "elasticloadbalancing:DescribeLoadBalancers",
    "elasticloadbalancing:DescribeTargetGroups",
    "elasticloadbalancing:DescribeTargetHealth",
    "logs:DescribeLogGroups",
    "s3:ListAllMyBuckets",
    "s3:GetBucketLifecycleConfiguration",
    "s3:ListMultipartUploadParts",
    "s3:ListBucketMultipartUploads",
    "ecr:DescribeRepositories",
    "ecr:DescribeImages",
    "secretsmanager:ListSecrets",
    "lambda:ListFunctions",
    "elasticfilesystem:DescribeFileSystems",
    "dynamodb:ListTables",
    "dynamodb:DescribeTable",
    "elasticache:DescribeCacheClusters",
    "sagemaker:ListNotebookInstances",
    "sagemaker:ListEndpoints",
    "sagemaker:DescribeEndpoint",
    "sagemaker:DescribeEndpointConfig",
    "sagemaker:ListEndpointConfigs",
    "sagemaker:ListModels",
    "sagemaker:DescribeModel",
    "sagemaker:ListTags",
    "sqs:ListQueues",
    "sqs:GetQueueAttributes",
    "sqs:ListDeadLetterSourceQueues",
    "sqs:ListQueueTags",
    "tag:GetResources",
    "eks:ListClusters",
    "eks:ListNodegroups",
    "eks:DescribeNodegroup",
    "sts:GetCallerIdentity"
  ],
  "Resource": "*"
}
```

> `--live-pricing` richiede in più `pricing:GetProducts` (AWS Pricing API). Non serve per il pricing statico di default.

## Primo utilizzo

```bash
# Scansione della regione di default (us-east-1)
# L'account ID viene rilevato automaticamente via STS
cloudrift analyze

# Scansione di più regioni
cloudrift analyze -r us-east-1 eu-west-1 ap-southeast-1

# Solo servizi specifici (salta il picker interattivo)
cloudrift analyze --scanners ebs-volume elastic-ip

# Tutti gli scanner senza picker interattivo
cloudrift analyze --all-services

# Disattiva il periodo di grazia (segnala risorse di qualsiasi età)
cloudrift analyze --min-age-days 0
```

### Il picker interattivo

Lanciando `analyze` in un vero terminale (fuori da CI), appare un **picker interattivo** — una checklist di tutti gli scanner, tutti pre-selezionati. Premi Invio per scansionare tutto, oppure deseleziona quelli che non ti servono.

Il picker **non appare mai** quando:
- `stdout` non è un TTY (piped output)
- La variabile `CI=true` è settata
- Usi `--silent`, `--scanners <kinds...>` o `--all-services`

In questi casi tutti gli scanner vengono eseguiti automaticamente.

## Formati di output

```bash
# Tabella console (default)
cloudrift analyze

# Output JSON (machine-readable, ideale per piping)
cloudrift analyze --format json | jq '.totalWasteMonthlyUsd'

# Filtra findings con jq
cloudrift analyze --format json | jq '.findings[] | select(.category=="waste")'

# Markdown per GitHub Actions step summary
cloudrift analyze --format markdown >> "$GITHUB_STEP_SUMMARY"
```

> Nei formati machine-readable (`json`, `markdown`) tutti i messaggi umani vanno su stderr, così su stdout resta solo il report — ideale per il piping.

## Report PDF

```bash
# PDF con nome automatico (reports/AWS_report_YYYY_MM_DD.pdf)
cloudrift analyze --pdf

# PDF con nome personalizzato, nessun output a terminale
cloudrift analyze --pdf ./report.pdf --silent
```

Il report PDF contiene:
- **Executive summary** — totale mensile e annuale, numero risorse, breakdown per tipo
- **Top raccomandazioni** — fino a 8 voci ordinate per impatto, con risparmio annuale
- **Pagine di dettaglio** — una tabella per ogni tipo di risorsa trovata
- **Scan warnings** — elencati se alcuni tipi non hanno potuto essere scansionati

> **Ordine dei flag:** il filename di `--pdf` è opzionale, quindi viene raccolto solo se segue immediatamente il flag. Usa `--pdf=./report.pdf --silent` per evitare ambiguità di ordine.

## Report JSON su file

```bash
# Scrive anche un file JSON su disco (indipendente da --format)
cloudrift analyze --json

# Con nome personalizzato
cloudrift analyze --json ./report.json --silent
```

## Gestione errori parziali

Se la scansione di un tipo di risorsa fallisce (es. permessi mancanti su CloudWatch per i NAT Gateway), il tool:

- Restituisce comunque tutti gli altri risultati
- Mostra una sezione **"Scan Warnings"** con i dettagli dell'errore
- Indica il totale come `(incomplete — see warnings above)`

```
  ⚠ Scan Warnings
  • NAT Gateways: Access denied to CloudWatch metrics

  Total estimated waste: $56.20/month (incomplete — see warnings above)
```

L'exit code resta guidato **solo** dalla soglia di costo, mai dagli errori di scansione.

## Tutte le opzioni

| Flag | Descrizione | Default |
|------|-------------|---------|
| `-r, --regions <regioni...>` | Regioni AWS da scansionare | `us-east-1` |
| `--format <format>` | Formato stdout: `table`, `json`, `markdown` | `table` |
| `--config <path>` | Percorso del file di config | auto-rilevato |
| `--live-pricing` | Prezzi correnti dall'AWS Pricing API | off |
| `--scanners <kinds...>` | Solo questi servizi (salta picker) | — |
| `--all-services` | Tutti gli scanner senza picker | on in CI/non-TTY |
| `--account-id <id>` | Override account ID (auto-rilevato via STS) | auto |
| `--min-age-days <giorni>` | Periodo di grazia in giorni | `7` |
| `--ignore-tag <tag>` | Tag di esclusione | `cloudrift:ignore` |
| `--pdf [filename]` | Genera report PDF | — |
| `--json [filename]` | Genera report JSON su disco | — |
| `--silent` | Nessun output su stdout | off |
| `-h, --help` | Mostra l'help | — |

## Comandi cost e trend

Oltre alla waste detection, cloudrift offre due comandi per confrontare e tracciare la spesa AWS via Cost Explorer:

```bash
# Confronta spesa di questo mese con gli stessi giorni del mese scorso
cloudrift cost

# Trend mensile degli ultimi 12 mesi
cloudrift trend --months 12

# Solo EC2 e S3, salta la conferma di fatturazione
cloudrift trend --months 12 --services ec2 s3 --yes

# Fallisce in CI se la spesa è aumentata più del 20%
cloudrift cost --fail-on-increase 20 --format json
```

> ⚠️ `cost` e `trend` chiamano **AWS Cost Explorer, che fattura $0.01 a richiesta** — gli unici comandi di cloudrift che possono generare un costo AWS. Entrambi chiedono conferma interattiva prima della prima chiamata (saltabile con `-y`/`--yes`, `--silent`, o in CI). I periodi chiusi vengono cachati su disco.

## Output di esempio

```
  Scanning us-east-1 (account 123456789012) for wasted cloud resources...

  EBS Volumes — Unattached
  ┌────────────────────┬───────────┬────────┬──────┬────────────┬────────────┐
  │ Volume ID          │ Region    │ Size   │ Type │ Created    │ Est. Cost  │
  ├────────────────────┼───────────┼────────┼──────┼────────────┼────────────┤
  │ vol-0abc123def456  │ us-east-1 │ 500 GB │ gp3  │ 2025-01-15 │ $40.00/mo  │
  └────────────────────┴───────────┴────────┴──────┴────────────┴────────────┘

  Total estimated waste: $40.00/month
```

## Prezzi per regione

I prezzi sono region-aware. Regioni con listino specifico: `us-east-1`, `us-west-2`, `eu-west-1`, `eu-central-1`, `ap-southeast-1`, `ap-northeast-1`. Le altre usano il fallback di us-east-1.

Ogni report mostra `prices as of` con la data di ultima verifica del listino.
