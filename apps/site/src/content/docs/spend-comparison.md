---
title: Confronto e trend di spesa
description: Confronta e traccia la spesa AWS reale via Cost Explorer.
order: 4
---

## Confronto e trend di spesa

Oltre alla waste detection, cloudrift può anche confrontare e tracciare la spesa AWS reale via Cost Explorer:

```sh
cloudrift cost                          # questo mese finora vs. gli stessi giorni del mese scorso, per servizio
cloudrift trend --months 12             # spesa mensile negli ultimi 12 mesi, grafico a barre ANSI
```

> ⚠️ A differenza di ogni scanner sopra (chiamate describe/list gratuite), `cost`/`trend` chiamano **AWS Cost Explorer, che fattura $0.01 a richiesta** — gli unici comandi di cloudrift che possono generare un costo AWS. Entrambi chiedono conferma prima della prima chiamata (saltabile con `-y`/`--yes`); i periodi di fatturazione chiusi vengono cachati su disco così rilanciare lo stesso comando per le stesse date non fattura di nuovo.
