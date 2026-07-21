---
title: Limiti e note oneste
description: Cosa cloudrift non fa e non può sapere — limiti dichiarati per ogni tipo di check.
order: 7
---

# Limiti e note oneste

cloudrift è progettato per essere trasparente sui propri limiti. Ogni tipo di check ha confini precisi — ecco cosa il tool **non può** dirti e perché.

## Lambda — solo conteggio invocazioni

Controlliamo solo il **numero di invocazioni** nella finestra di osservazione (7 giorni), nient'altro.

**Cosa non facciamo:**
- Non facciamo rightsizing della memoria — richiederebbe Lambda Insights (costo extra, da attivare per ogni funzione), fuori scope per uno scan read-only senza permessi IAM aggiuntivi
- Non rileviamo la **Provisioned Concurrency** idle, che *è* fatturata indipendentemente dalle invocazioni

**Implicazione pratica:** una funzione con zero invocazioni ha per definizione $0 di costo diretto (pay-per-use). Il valore di questo finding è **igiene** (codice morto, ruoli IAM inutili, event source da rimuovere), non un risparmio in dollari.

## Rightsizing EC2/RDS — euristica a metrica singola

Il check di sottoutilizzo è un'euristica su **una sola metrica** — CPU massima sotto una soglia nella finestra di osservazione (default 5% su 14 giorni).

**Cosa non guardiamo:**
- RAM
- Throughput di rete
- IOPS disco
- Numero di connessioni (per RDS)

**Perché:** non richiede permessi IAM aggiuntivi e funziona uguale su ogni account. Non è un sostituto di [AWS Compute Optimizer](https://aws.amazon.com/compute-optimizer/), che modella più metriche e raccomanda un target specifico.

**Come usare il finding:** trattalo come **"vai a controllare questa istanza"**, non come una raccomandazione di sizing. Verifica con Compute Optimizer (o con le tue metriche) prima di ridimensionare.

## EKS Node Groups — solo aggregati a livello nodo

Il check sul sovradimensionamento dei nodi legge gli aggregati **a livello di nodo** di Container Insights (`node_cpu_request`/`node_cpu_limit`) tramite la sola AWS API.

**Cosa non vediamo:**
- Le richieste/limiti dei singoli Pod (`resources.requests`/`resources.limits`)
- Non parliamo mai con la Kubernetes API (nessun kubeconfig richiesto)

**Prerequisito:** Container Insights deve essere attivo sul cluster. Se non lo è, lo scanner non segnala nulla (non indovina).

**Come usare il finding:** il numero di nodi suggerito è un punto di partenza per l'indagine, non una raccomandazione di sizing.

**EKS PVC orfani — limite sui tag:**
- Il tag del cluster proprietario viene dal tag legacy `kubernetes.io/cluster/<nome>` del provisioner in-tree
- Volumi creati dal CSI driver EBS senza `--extra-tags` non portano il nome del cluster
- Questi volumi vengono segnalati solo tramite il check "non attaccato", mai tramite quello sul cluster cancellato

## Aurora Serverless v2 — finestra di osservazione

Il finding si basa sul picco ACU osservato in 7 giorni. Il Min ACU suggerito è `ceil(peakACU * 1.2)` — 20% di headroom sopra il picco osservato.

**Rischio:** un picco raro settimanale che cade fuori dalla finestra di 7 giorni appare come sovradimensionamento permanente. Il 20% di headroom è la mitigazione, non una garanzia. Verifica su una finestra più lunga per workload con spike rari prima di abbassare il Min ACU.

## SageMaker Notebooks — solo CPU

Il check usa solo CPU (soglia default 2%). Per istanze GPU, il finding non dice nulla sull'utilizzo GPU — non distingue tra "kernel idle" e "qualcuno sta leggendo il notebook senza eseguire celle".

Tratta il finding come "vai a controllare questo notebook", non come spreco confermato.

## SageMaker Models orfani — falsi positivi intenzionali

Un modello tenuto deliberatamente per rollback/backup appare identico a uno davvero abbandonato dalla vista API-only. Il periodo di grazia (`--min-age-days`) è l'unica mitigazione.

## Dev/PR ghost environments — dipende dai tag

Lo scanner `environment-ghost` raggruppa risorse per tag value o naming pattern, poi segnala solo quando **tutte** le risorse del gruppo sono inattive. La qualità del risultato dipende interamente dalla disciplina di tagging/naming del tuo account. Un team senza convenzioni di tagging non vedrà nulla.

## Pricing — non è la tua bolletta

Anche con `--live-pricing`, AWS restituisce prezzi di **listino**:

- Savings Plans non riflessi
- Reserved Instances non riflesse
- Sconti EDP non riflessi
- Tariffe negoziate non riflesse

L'unico modo per avvicinarsi alla bolletta reale: override `prices` nel config con le tue tariffe effettive.

## Cosa non è cloudrift

- **Non è un tool di enforcement** — segnala, non agisce
- **Non sostituisce AWS Compute Optimizer** — per raccomandazioni di sizing usa Compute Optimizer
- **Non sostituisce Cost Explorer** — per analisi precisa dei costi usa la console AWS
- **Non copre tutti i servizi AWS** — ci sono centinaia di servizi, cloudrift ne copre 38
- **Non rileva Provisioned Concurrency Lambda** — fuori scope per ora
- **Non parla con la Kubernetes API** — solo AWS API, nessun kubeconfig
