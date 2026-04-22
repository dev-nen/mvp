# NensGo Scout Sources Strategy

## Scope Note

This document is a planning artifact grounded in the current checked-out state
of `feat/real-db-auth-migration`.
Baseline checked on April 22, 2026 against the active branch working tree.
It does not implement connectors.
It defines a progressive source strategy that matches the current repo and
editorial-first validation goal.

## Status

- `Planned`

## Branch Context

- Active branch for this planning pass: `feat/real-db-auth-migration`
- The active branch is the source of truth for this document
- `main` is not part of this scope unless explicitly referenced later

## Goal

Define a progressive ingestion strategy that helps NensGo turn external source
material into reviewable drafts with lower operational cost and lower error risk
than a broad, source-agnostic first attempt.

The objective is not autonomous publication.
The objective is to feed Draft Inbox with useful drafts.

## Core Principle

Every source type should converge into the same internal editorial circuit:

- external source
- extraction
- normalization
- draft
- human review
- manual approval
- real activity creation

Nothing publishes automatically in this phase.

## Source Selection Criteria

The first sources should be chosen for operational usefulness, not novelty.

Priority factors:

- repeatable source shape
- lower parsing ambiguity
- public or institutionally visible origin
- relevance to local family activity supply
- lower manual cleanup cost
- realistic chance of reuse through a connector

Avoid choosing the first sources based on visual complexity alone.

## Recommended Source Priority

| Source class | Priority | Why it should come in this order | Example sources |
| --- | --- | --- | --- |
| Structured | Highest | Best extraction quality, lowest ambiguity, fastest connector reuse | CSV, XLSX, RSS, iCal, stable newsletters, structured institutional pages, open datasets |
| Semistructured | Medium | High value, but parsing cleanup starts to matter | PDFs, municipal agendas, cultural bulletins, downloadable documents, irregular institutional pages |
| Unstructured | Lowest for MVP | Highest upside, highest uncertainty, highest review cost | flyers, posters, photos, screenshots, forwarded creatives |

## Tactical Recommendation

Do not start by trying to "solve flyers".
Start with one or two source types that can validate the full editorial circuit
with lower risk.

Recommended first bias:

- structured institutional sources
- semistructured public agendas

Not recommended as the first validation slice:

- WhatsApp ingestion
- image-first OCR pipelines
- arbitrary social screenshots

## Connector Model

Scout should grow through connectors, not as one generic "AI parser".

Examples of future connectors:

- `csv_xlsx_connector`
- `rss_ical_connector`
- `email_connector`
- `webpage_connector`
- `pdf_connector`
- `image_connector`

All connectors should emit a common internal draft contract even if their
parsing logic differs.

## Common Connector Output Contract

Every connector should converge into a draft payload with at least:

- source type
- source label or identifier
- source reference URL or stored file path
- raw extracted text
- parsed candidate fields
- confidence score
- missing fields
- parsing notes

In the current branch context, that output should land in a draft object that
can later be reviewed against the real `activities` publish contract.

## MVP Source Mix Recommendation

The first real validation set should stay controlled.

Recommended sample size:

- 20 to 50 sources

Recommended initial mix:

- a small set of institutional CSV or XLSX lists
- a small set of RSS or iCal feeds if available
- a small set of stable bulletin emails or newsletters
- a small set of municipal or institutional PDFs
- only a very small image or flyer sample for future comparison, not as the
  main MVP load

## What Should Be Measured By Source Type

Each source class should be judged by editorial usefulness.

Key measures:

- percent of drafts that are reviewable
- percent of drafts that are approvable
- manual correction burden
- median review time
- common failure modes
- duplicate rate
- source sustainability for continued coverage

## Risks

- high noise from low-quality source material
- duplicate drafts when the same activity appears in several channels
- poor extraction of dates, age ranges, pricing, or contact information
- connector-specific logic leaking into the rest of the app instead of staying
  isolated
- pressure to jump too early into image-first ingestion because it feels more
  ambitious

## Stop Conditions

Pause connector expansion if any of the following becomes true:

- the inbox fills with drafts that are slower to review than manual entry
- most approvals still require near-total rewrite
- the team cannot reliably resolve required publish references
- duplicate handling becomes a bigger problem than ingestion speed

## Strategic Reading

If this strategy works, Scout becomes an internal ingestion capability that can
later support broader intake channels.
If it fails, the failure should be visible quickly through review time, approval
rate, and manual correction burden.

The first validation target is therefore modest and concrete:

- prove that structured or semistructured external sources can become useful
  reviewable drafts faster than manual load

## Recommended Next Step

Do not implement connector breadth first.
Use `docs/scout-draft-inbox-phase1-sdd.md` to define the landing zone first, and
only then add Scout Manual v0 on top of that review workflow.
