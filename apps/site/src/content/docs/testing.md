---
title: Testing
description: Piramide dei test — unit, contract, e2e LocalStack, verifica manuale AWS.
order: 13
---

# Testing

cloudrift usa una piramide dei test a più livelli per bilanciare velocità, confidenza e costo.

## La piramide

```
        ┌─────────────────────────┐
        │   CLI e2e (apps/cli)    │   a livello comando: formato, exit code, artifact
        ├─────────────────────────┤
        │ Infra (contract tests)  │   fixture di risposta replay: forma → findings
        ├─────────────────────────┤
        │  Infra (scanner specs)  │   AWS SDK mockato: forma query, pagination, errori
        ├─────────────────────────┤
        │  Domain (entity/policy) │   logica pura: regole waste, boundary, no I/O
        └─────────────────────────┘
        ┌─────────────────────────┐
        │  LocalStack e2e (free)  │   scripts/e2e-localstack.mjs, 17/43 scanner
        ├─────────────────────────┤
        │  Manual AWS sandbox     │   scripts/verify-against-aws.mjs
        └─────────────────────────┘
```

## Esecuzione dei test

```bash
# Tutti i test unitari
pnpm nx run-many -t test

# Singola libreria
pnpm nx test shared-kernel
pnpm nx test cloud-cost-domain
pnpm nx test cloud-cost-application
pnpm nx test cloud-cost-infrastructure-aws-adapter

# Lint
pnpm nx run-many -t lint

# Type check
pnpm nx run-many -t typecheck
```

## Livello 1 — Domain (entità e policy)

Test unitari puri, senza mock, senza I/O. Uno spec per entità, più test sulle policy che coprono:

- Waste vs non-waste
- Periodo di grazia (boundary esatto: età `===` `minAgeDays`)
- Ignore tag
- `excludeTagValues`
- Boundary delle soglie (CPU `===` threshold, ops `===` `maxOps`)

Si eseguono in millisecondi e catturano regressioni logiche immediatamente.

## Livello 2 — Infrastruttura (scanner specs)

Uno spec per scanner, con il client AWS SDK mockato. Ogni spec copre:

- Il filtro candidati (es. `DescribeVolumes` con `Filters=[status=available]`)
- Pagination
- Concorrenza
- Gestione errori SDK
- Chiamata `destroy()` sul client
- Parametri CloudWatch esatti (`Namespace`, `Period`, `Statistics`, `Dimensions`) per scanner CW-based

## Livello 3 — Infrastruttura (contract tests)

Gli spec degli scanner costruiscono payload minimali a mano; non possono provare che la forma corrisponda a risposte AWS reali. `scanner-contract.spec.ts` riproduce fixture di risposte AWS complete (da `src/testing/contract-fixtures/`) attraverso l'intera pipeline dello scanner — list → type-narrowing → metrica → entità → policy — e verifica che escano gli stessi findings.

Tutti i 43 scanner hanno fixture di contract. Un test di copertura fallisce se un `ResourceKind` viene rilasciato senza fixture.

## Livello 4 — CLI e2e

`analyze-waste.command.spec.ts` guida il comando con un fake `AnalyzeDeps` (senza AWS), testando:

- Selezione formato (table/json/markdown)
- Exit code (0/1/2)
- Artifact `--json <file>` e `--pdf <file>`
- Gestione scan parziale (errori di scan non crashano il comando)

## Harness LocalStack e2e

Esegue il binario CLI buildato contro una vera API AWS-compatibile containerizzata. Nessuna credenziale AWS reale necessaria.

**Copertura:** 17 su 43 scanner (gli altri richiedono servizi che LocalStack Community non supporta).

### Setup

```bash
# Una tantum: registrati su app.localstack.cloud e prendi il tuo Auth Token
export LOCALSTACK_AUTH_TOKEN=<your-token>

# Build della CLI
pnpm nx run cli:build

# Esegui l'harness e2e
pnpm nx run cli:e2e-localstack
```

Richiede Docker. L'harness:
1. Avvia un container LocalStack (`docker-compose.localstack.yml`)
2. Crea una risorsa sprecata per ogni kind (`scripts/seed-localstack.mjs`)
3. Esegue `cloudrift analyze` contro il container
4. Verifica che ogni kind atteso abbia prodotto un finding
5. Distrugge il container (anche in caso di errore)

### Ispezione manuale contro LocalStack

Per vedere una tabella o PDF con i dati seedati:

```bash
# Avvia LocalStack
export LOCALSTACK_AUTH_TOKEN=<your-token>
docker compose -f docker-compose.localstack.yml up -d --wait

# Punta l'SDK a LocalStack
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Seed delle risorse
node scripts/seed-localstack.mjs

# Ispeziona come tabella
node apps/cli/dist/main.js analyze --regions us-east-1 --min-age-days 0 --format table --all-services

# Oppure come PDF
node apps/cli/dist/main.js analyze --regions us-east-1 --min-age-days 0 --pdf --all-services

# Smonta quando hai finito
docker compose -f docker-compose.localstack.yml down -v
```

## Verifica manuale su sandbox AWS

`scripts/verify-against-aws.mjs` esegue gli scanner contro un account AWS reale. **Non viene eseguito da CI** — va lanciato a mano su un account sandbox.

```bash
pnpm nx run-many -t build
CLOUDRIFT_VERIFY_AWS_SANDBOX=1 pnpm verify:aws -- --region us-east-1
```

Lo script rifiuta di partire senza:
- `CLOUDRIFT_VERIFY_AWS_SANDBOX=1` (protezione contro la produzione)
- Credenziali AWS risolvibili (verificate via STS)

Per ogni scanner stampa: kind, numero finding, costo mensile stimato, primi 5 finding, e eventuali errori.

## Stato della verifica su AWS reale

Con la crescita del numero di scanner, la verifica su AWS reale si è spostata su un ciclo separato di deploy/validate/destroy contro un account AWS reale (uno stack CDK di test in un repo gemello, `cloudrift-cdk-test`).

**Copertura attuale: 36 dei 43 scanner hanno trovato uno spreco reale su un account AWS live.** I restanti 7 si dividono in due tipi di gap:

- `rds-manual-snapshot-old` e `secretsmanager-unused` — girati end-to-end senza errori, ma senza trovare nulla da segnalare (condizioni non soddisfatte nell'account di test)
- `rds-underutilized`, `aurora-serverless-overprovisioned`, `sqs-dlq-abandoned`, `eks-node-overprovisioned`, `environment-ghost` — richiedono risorse con pattern d'uso organici per 7–14 giorni, non producibili con uno stack sintetico di breve durata

## Debug logging

```bash
DEBUG=cloudrift:* node apps/cli/dist/main.js analyze
```

Scrive su stderr. Attenzione: l'output include ID di risorse AWS — non condividere in issue pubbliche senza controllare.
