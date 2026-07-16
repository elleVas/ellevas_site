---
title: Policy as Code (OPA)
description: Regole avanzate con Open Policy Agent — guida da zero con conftest.
order: 8
---

# Policy as Code (OPA)

Il gate `costAlertThresholdUsd` nel config è un confronto totale-vs-budget. Per regole più espressive — per tag, per tipo di risorsa, per conteggio — cloudrift supporta [Open Policy Agent](https://www.openpolicyagent.org/) (OPA).

## Come funziona

cloudrift **non esegue mai OPA da sé** — produce solo JSON. Tu (o la tua pipeline CI) esegui `conftest`/`opa` contro l'output JSON:

```bash
node apps/cli/dist/main.js analyze --format json > report.json
conftest test --policy policy report.json
```

`conftest` esce con codice 1 se una regola è violata, 0 se il report è pulito — esattamente il segnale che serve a uno step CI.

## Prerequisiti

Installa `conftest`:

```bash
# macOS
brew install conftest

# Altre piattaforme: https://www.conftest.dev/install/
```

## Provalo in 30 secondi (senza account AWS)

Il repo include un report di esempio in `policy/testdata/sample-report.json`. Puoi vedere le policy in azione subito:

```bash
conftest test --policy policy policy/testdata/sample-report.json
```

Output atteso — tutte e tre le policy di esempio negano qualcosa:

```
FAIL - policy/testdata/sample-report.json - main - 3 unattached EBS volumes found, more than the 2 allowed
FAIL - policy/testdata/sample-report.json - main - ebs-volume (vol-0abc123def456) in production is wasting $40/month
FAIL - policy/testdata/sample-report.json - main - total monthly waste $63.6 exceeds budget $50
```

## Policy di esempio incluse

| File | Regola |
|------|--------|
| `policy/waste-budget.rego` | Totale mensile spreco sopra un budget fisso |
| `policy/production-tag.rego` | Qualsiasi waste con tag `Environment: production` |
| `policy/idle-resource-count.rego` | Più di N volumi EBS non attaccati |

Ogni file ha un `_test.rego` associato. Test delle policy:

```bash
opa test policy/ -v
```

## Scrivere una regola personalizzata

Le policy condividono `package main`. Rego unisce i blocchi `deny contains msg if {...}` dello stesso package, quindi un quarto file ha bisogno solo dello stesso header e della sua condizione. Esempio — negare ogni finding sopra $100/mese:

```rego
# policy/high-cost-finding.rego
package main

import rego.v1

deny contains msg if {
  some finding in input.findings
  finding.category == "waste"
  finding.monthlyCostUsd > 100
  msg := sprintf("%s (%s) is wasting $%v/month", [finding.kind, finding.id, finding.monthlyCostUsd])
}
```

`input` è il JSON del report — i campi disponibili per ogni finding: `kind`, `category`, `tags`, `monthlyCostUsd`, `region`, `id`, `wasteReason`. Top-level: `totalWasteMonthlyUsd`, `wasteCount`, `findings[]`.

> **Gotcha Rego:** cloudrift serializza cifre intere senza decimale (es. `$40` diventa `40`, non `40.00`). Il verbo `%.2f` di Rego crasha su interi. Usa `%v` nelle tue regole.

## Integrare in CI

Aggiungi uno step dopo lo scan:

```yaml
      - run: node cloudrift-cli/apps/cli/dist/main.js analyze -r us-east-1 --format json > report.json
        working-directory: cloudrift-cli

      - uses: openpolicyagent/conftest-action@v1
        with:
          policy: cloudrift-cli/policy
          files: cloudrift-cli/report.json
```

Oppure installa `conftest` direttamente e lancia `conftest test --policy policy report.json`.

## Perché esterno alla CLI

Incorporare un runtime OPA (binario shelled-out o build WASM) dentro il pacchetto npm aggiungerebbe una dipendenza pesante e platform-specific per un risultato che — per la maggior parte degli utenti — un confronto numerico già fornisce. Il valore di un vero policy engine emerge solo con regole espressive e multi-segnale, o se vuoi riusare un bundle OPA/Rego che già mantieni per Terraform o Kubernetes. Tenendo OPA fuori dal pacchetto, cloudrift resta una CLI leggera e chi vuole questo livello lo attiva esplicitamente.
