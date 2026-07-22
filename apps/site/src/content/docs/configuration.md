---
title: Configurazione
description: File di configurazione cloudrift.config.json — campi, soglie, override dei prezzi.
order: 3
---

# Configurazione

cloudrift legge `cloudrift.config.json` (o `.cloudriftrc`) dalla directory corrente, oppure il percorso passato con `--config`. I flag CLI hanno la precedenza sul file di config, che a sua volta ha la precedenza sui default built-in. Tutti i campi sono opzionali.

## Dove va il file

È un file **tuo**, non fa parte dell'artefatto pubblicato. Metti `cloudrift.config.json` nella directory da cui lanci la CLI — tipicamente la root del tuo repo, **committato** così viene preso automaticamente in CI (dopo `actions/checkout`) e condiviso dal team.

La ricerca si basa sulla working directory corrente, indipendentemente da come viene invocata la CLI. Se il file sta altrove, indicalo con `--config percorso/del/file.json`.

## Esempio completo

```json
{
  "excludeRegions": ["us-gov-east-1"],
  "excludeTagValues": { "Environment": "Production" },
  "cloudwatchWindowHours": 168,
  "utilizationWindowHours": 168,
  "minAgeDays": 14,
  "ignoreTag": "cloudrift:ignore",
  "costAlertThresholdUsd": 500,
  "prices": {
    "eu-west-1": { "nat-gateway": 28.5, "ebs-gp3": 0.07 },
    "default": { "elastic-ip": 3.2 }
  },
  "thresholds": {
    "ebsIdleMaxOps": 0,
    "ec2CpuPercent": 5,
    "rdsCpuPercent": 5
  },
  "environmentDetection": {
    "tagKeys": ["Environment", "env", "branch"],
    "namingPatterns": ["*-pr-*", "*-preview-*", "*-dev-*", "*-feat-*"],
    "inactivityDays": 7
  }
}
```

## Riferimento campi

| Campo | Significato | Default |
|-------|-------------|---------|
| `excludeRegions` | Regioni saltate anche se passate con `-r` | `[]` |
| `excludeTagValues` | Esclude risorse con un tag `chiave: valore` esatto (es. non toccare `Environment: Production`) | `{}` |
| `cloudwatchWindowHours` | Finestra CloudWatch per i check "zero-attività" (NAT Gateway, EBS idle, ElastiCache, ecc.) | `48` (max `168` = 7 giorni) |
| `utilizationWindowHours` | Finestra CloudWatch per i check di utilizzo CPU (EC2/RDS underutilized) | `168` = 7 giorni (max `336` = 14 giorni) |
| `minAgeDays` | Periodo di grazia in giorni — risorse più giovani non vengono segnalate | `7` |
| `ignoreTag` | Tag di esclusione — risorse con questo tag vengono saltate | `cloudrift:ignore` |
| `costAlertThresholdUsd` | Soglia di budget: se `totalWasteMonthlyUsd` la supera, exit code 2 (CI gate) | nessuna soglia |
| `prices` | Override prezzi per regione (vedi sotto) | `{}` |
| `thresholds` | Soglie per check specifici (vedi sotto) | vedi tabella |
| `environmentDetection` | Configurazione scanner ambienti Dev/PR fantasma (vedi sotto) | disabilitato |

## Precedenza

```
Default built-in  ←  cloudrift.config.json  ←  Flag CLI (vincono)
```

I flag CLI hanno **sempre** la precedenza. Ad esempio `--min-age-days 0` ignora il valore nel config.

## Soglie (`thresholds`)

| Campo | Significato | Default |
|-------|-------------|---------|
| `ebsIdleMaxOps` | Operazioni I/O totali sotto cui un volume EBS attaccato conta come idle | `0` |
| `ec2CpuPercent` | CPU massima % sotto cui un'istanza EC2 running conta come sottoutilizzata | `5` |
| `rdsCpuPercent` | CPU massima % sotto cui un'istanza RDS conta come sottoutilizzata | `5` |
| `auroraMinAcuUtilizationPercent` | % sotto cui il Min ACU di Aurora Serverless v2 è considerato sovradimensionato | `50` |
| `sagemakerNotebookCpuPercent` | CPU massima % sotto cui un notebook SageMaker conta come idle | `2` |
| `eksNodeUtilizationPercent` | CPU requested/allocatable sotto cui un Node Group EKS è sovradimensionato | `30` |

## Override dei prezzi (`prices`)

Puoi sovrascrivere i prezzi per regione per usare le tue **tariffe negoziate/aziendali**. La struttura è `regione → { chiavePrezzo: USD }`, con `default` come fallback:

```json
{
  "prices": {
    "eu-west-1": {
      "nat-gateway": 28.5,
      "ebs-gp3": 0.07
    },
    "default": {
      "elastic-ip": 3.2
    }
  }
}
```

Le chiavi sono le stesse usate nel listino built-in (`prices.json`). Una chiave non riconosciuta produce un warning non bloccante (non viene ignorata silenziosamente).

> Gli override `prices` sono l'unico modo per far combaciare il report con ciò che paghi davvero — anche `--live-pricing` restituisce solo i prezzi di **listino** AWS, non la tua bolletta (Savings Plans, RI, EDP non sono riflessi).

## Rilevamento ambienti (`environmentDetection`)

Configurazione per lo scanner `environment-ghost` (ambienti Dev/PR fantasma):

```json
{
  "environmentDetection": {
    "tagKeys": ["Environment", "env", "branch"],
    "namingPatterns": ["*-pr-*", "*-preview-*", "*-dev-*", "*-feat-*"],
    "inactivityDays": 7
  }
}
```

| Campo | Significato | Default |
|-------|-------------|---------|
| `tagKeys` | Tag con cui raggruppare le risorse in "ambienti" | `[]` |
| `namingPatterns` | Pattern di naming come fallback per il raggruppamento | `[]` |
| `inactivityDays` | Giorni di inattività totale per segnalare un gruppo come fantasma | `7` |

## Gate CI/CD (`costAlertThresholdUsd`)

Se il totale **waste** (`totalWasteMonthlyUsd`) supera questa soglia, il comando esce con **codice 2**, facendo fallire la pipeline. I risparmi di tipo `optimization` non contano mai per il gate.

```json
{
  "costAlertThresholdUsd": 500
}
```

Senza questo campo, il comando esce sempre con codice 0 (a meno di errori di parsing argomenti, che danno codice 1).

## Casi d'uso comuni

### Eliminare falsi positivi del weekend

Un NAT Gateway di staging senza traffico nel weekend è il classico falso positivo:

```json
{
  "cloudwatchWindowHours": 168
}
```

Con 168h (7 giorni) un weekend tranquillo non basta più a far scattare la segnalazione.

### Workload batch settimanali

Un'istanza EC2 che picca la CPU solo una volta a settimana:

```json
{
  "utilizationWindowHours": 336
}
```

Con 336h (14 giorni) il campione è abbastanza largo da catturare il picco.

### Non toccare la produzione

```json
{
  "excludeTagValues": { "Environment": "Production" }
}
```

Qualsiasi risorsa con il tag `Environment: Production` viene completamente esclusa dal report.
