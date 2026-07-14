---
title: Quick Start
description: Installazione e primo utilizzo di cloudrift.
order: 2
---

# Quick Start

## Prerequisiti

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Credenziali AWS con permessi in sola lettura

## Installazione

cloudrift non è ancora pubblicato su npm. Va compilato ed eseguito dai sorgenti:

```bash
git clone https://github.com/elleVas/cloudrift.git
cd cloudrift
pnpm install
pnpm nx build cli
```

L'output viene compilato in `apps/cli/dist/`.

## Configurazione credenziali AWS

cloudrift usa la chain standard di credenziali AWS SDK v3:

1. Variabili d'ambiente (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. Profilo AWS (`~/.aws/credentials`)
3. IAM Role (se su EC2/ECS/Lambda)

```bash
# Opzione A — AWS CLI
aws configure

# Opzione B — variabili d'ambiente
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=wJal...
export AWS_DEFAULT_REGION=us-east-1
```

Verifica: `aws sts get-caller-identity` deve restituire il tuo account ID.

## Primo utilizzo

```bash
# Scansione della regione di default (us-east-1)
node apps/cli/dist/main.js analyze

# Scansione di più regioni
node apps/cli/dist/main.js analyze -r us-east-1 eu-west-1

# Solo servizi specifici
node apps/cli/dist/main.js analyze --scanners ebs-volume elastic-ip

# Output JSON
node apps/cli/dist/main.js analyze --format json

# Report PDF
node apps/cli/dist/main.js analyze --pdf

# Markdown per GitHub Actions step summary
node apps/cli/dist/main.js analyze --format markdown >> "$GITHUB_STEP_SUMMARY"
```

## Opzioni principali

| Flag | Descrizione | Default |
|------|-------------|---------|
| `-r, --regions` | Regioni AWS da scansionare | `us-east-1` |
| `--format` | Formato output: `table`, `json`, `markdown` | `table` |
| `--live-pricing` | Usa prezzi correnti da AWS Pricing API | off (tabella statica) |
| `--scanners` | Solo questi servizi (salta il picker) | — |
| `--all-services` | Tutti gli scanner senza picker interattivo | on in CI |
| `--min-age-days` | Grace period in giorni | `7` |
| `--ignore-tag` | Tag di esclusione | `cloudrift:ignore` |
| `--pdf [filename]` | Genera report PDF | — |
| `--json [filename]` | Genera report JSON su disco | — |
| `--silent` | Nessun output su stdout | off |
