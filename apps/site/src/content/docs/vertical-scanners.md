---
title: Scanner verticali
description: Scanner Phase 6 — SQS, Aurora, SageMaker, ambienti Dev/PR, EKS.
order: 8
---

# Scanner verticali (Phase 6)

La Phase 6 ha aggiunto 9 scanner specializzati su 5 verticali, oltre ai 29 scanner generalisti. Puoi eseguirne uno singolo:

```bash
node apps/cli/dist/main.js analyze --scanners eks-node-overprovisioned --live-pricing
```

## Serverless orphans

### `sqs-dlq-abandoned`

Una coda SQS identificata come Dead Letter Queue (tramite la sua `RedrivePolicy`, l'essere referenziata come target del redrive di un'altra coda, o un match sul nome `*-dlq`/`*-dead-letter`) il cui messaggio più vecchio non consumato ha più di 14 giorni.

- **Categoria:** waste (segnalazione di igiene)
- **Costo:** $0 (SQS non ha costo di storage)
- **Valore:** intercettare errori ignorati e integrazioni morte

Nessuna soglia dedicata oltre `--min-age-days` / `cloudrift:ignore`.

### `lambda-loggroup-orphaned`

Un CloudWatch Log Group sotto `/aws/lambda/` la cui funzione Lambda non esiste più. Distinto dallo scanner generalista `log-group`, che segnala retention mancante su log group di funzioni *ancora attive*.

- **Categoria:** waste
- **Costo:** $0,03/GB-mese (dati di log memorizzati)

## Aurora Serverless v2

### `aurora-serverless-overprovisioned`

Un cluster Aurora Serverless v2 il cui Min ACU è molto superiore al picco `ServerlessDatabaseCapacity` osservato in 7 giorni.

- **Categoria:** optimization
- **Min ACU suggerito:** `ceil(peakACU * 1.2)` — 20% di headroom sopra il picco
- **Risparmio:** `(MinACU − suggestedMinACU) × $87,60/ACU-mese`
- **Config:** `thresholds.auroraMinAcuUtilizationPercent` (default `50`)

**Rischio:** un picco raro fuori dalla finestra di 7 giorni appare come sovradimensionamento. Verifica su una finestra più lunga per workload con spike prima di abbassare il Min ACU.

## Suite SageMaker

Tre scanner che formano una vista del ciclo di vita dei modelli (notebook → endpoint → artefatto orfano):

### `sagemaker-notebook-idle`

Un'istanza notebook `InService` con CPU max ≤ `thresholds.sagemakerNotebookCpuPercent` (default `2`) in 7 giorni.

- **Richiede:** `--live-pricing`
- **Costo:** costo pieno instance-hour
- **Nota:** solo CPU. Per istanze GPU, non dice nulla sull'utilizzo GPU

### `sagemaker-endpoint-idle`

Un endpoint `InService` con zero `Invocations` in 7 giorni.

- **Richiede:** `--live-pricing`
- **Costo:** costo pieno instance-hour × numero istanze della variante

### `sagemaker-training-orphaned`

Un modello SageMaker registrato non referenziato da nessuna Endpoint Config.

- **Categoria:** optimization (igiene del namespace)
- **Costo:** costo stimato storage S3 Standard del `ModelDataUrl`
- **Rischio:** un modello tenuto per rollback/backup appare identico a uno abbandonato dalla vista API-only; il periodo di grazia è l'unica mitigazione

## Ambienti Dev/PR fantasma

### `environment-ghost`

Raggruppa risorse (EC2, RDS, Lambda, Load Balancer) per tag value o naming pattern, poi segnala un gruppo come "fantasma" solo quando **tutte** le risorse al suo interno sono inattive da `environmentDetection.inactivityDays` (default 7) o più.

**Configurazione** (`cloudrift.config.json`):

```json
{
  "environmentDetection": {
    "tagKeys": ["Environment", "env", "branch"],
    "namingPatterns": ["*-pr-*", "*-preview-*", "*-dev-*", "*-feat-*"],
    "inactivityDays": 7
  }
}
```

- `tagKeys` viene provato per primo (risorse raggruppate per valore del tag)
- `namingPatterns` è il fallback per risorse senza tag corrispondente
- Questo è lo scanner più sperimentale — la qualità dipende interamente dalla disciplina di tagging/naming

Inizia aggiungendo un `tagKeys` che corrisponda a come la tua organizzazione effettivamente tagga gli ambienti effimeri.

## EKS cost visibility

Entrambi gli scanner sono **solo AWS-API** — nessun kubeconfig, nessuna connettività intra-cluster. È una scelta deliberata: richiedere accesso RBAC in lettura al cluster romperebbe il modello di trust "basta un ruolo IAM".

### `eks-node-overprovisioned`

Un EKS Node Group il cui rapporto CPU requested/allocatable (da Container Insights a livello nodo) è sotto `thresholds.eksNodeUtilizationPercent` (default `30`) in 7 giorni.

- **Richiede:** `--live-pricing` + Container Insights attivo sul cluster
- **Risparmio:** `(nodeCount − suggestedNodeCount) × prezzo istanza`
- **Nodi suggeriti:** scala verso un target del 70% di utilizzo, mai sotto 1 nodo
- **Degradation graceful:** se Container Insights non è attivo, lo scanner emette un warning e non produce findings

**Nota:** legge solo aggregati a livello Node Group, mai le richieste/limiti dei singoli Pod. Non può dire *quali* Pod sono sovradimensionati, solo che il gruppo nel suo insieme appare overprovisioned.

### `eks-orphan-pvc`

Un volume EBS creato per un PersistentVolumeClaim Kubernetes (identificato tramite il tag `kubernetes.io/created-for/pvc/name` del CSI driver) che è:

- Non attaccato (`state: available`), oppure
- Ancora taggato per un cluster EKS che non esiste più (tag legacy `kubernetes.io/cluster/<nome>` correlato con `eks:ListClusters`)

- **Costo:** stesso pricing statico EBS (non richiede `--live-pricing`)
- **Nota:** il tag del nome cluster è una convenzione legacy. Volumi creati dal CSI driver EBS senza `--extra-tags` vengono rilevati solo dal check "non attaccato", mai da quello "cluster cancellato"

## Permessi IAM

Le azioni richieste da tutti e 9 gli scanner sono nella policy IAM standard: azioni SQS in lettura, `rds:DescribeDBClusters`, `tag:GetResources`, `eks:ListClusters`/`ListNodegroups`/`DescribeNodegroup`, più le azioni `sagemaker:*` in lettura. Quelli gated su `--live-pricing` richiedono in più `pricing:GetProducts`.
