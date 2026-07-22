---
title: Spend comparison and trend
description: Compare and track actual AWS spend via Cost Explorer.
order: 4
---

## Spend comparison and trend

Beyond waste detection, cloudrift can also compare and track actual AWS spend via Cost Explorer:

```sh
cloudrift cost                          # this month so far vs. the same days last month, by service
cloudrift trend --months 12             # monthly spend over the last 12 months, ANSI bar chart
```

> ⚠️ Unlike every scanner above (free describe/list calls), `cost`/`trend` call **AWS Cost Explorer, which bills $0.01 per request** — the only cloudrift commands that can generate an AWS cost. Both prompt for confirmation before the first call (skippable with `-y`/`--yes`); closed billing periods are cached to disk so re-running the same command for the same dates doesn't bill again.
