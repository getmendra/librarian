# <img src="src/lib/assets/favicon.svg" width="24" height="24" alt="Librarian logo"> Librarian

![Librarian screenshot](https://github.com/user-attachments/assets/8e8541a5-ec91-4957-b9fc-5cdd5470aece)

Read-only Iceberg catalog explorer for Cloudflare R2 Data Catalog. Deploys as a Cloudflare Worker.

## Features

- Browse namespaces and tables
- Inspect schemas, partitions, snapshots, and table properties
- Record and file counts computed from Iceberg manifests fetched directly from R2

## Setup

Copy `.env.example` to `.env` and fill in your values. Set the catalog token secret:

```sh
wrangler secret put CATALOG_TOKEN
```

Optional namespace ordering:

- Set `NAMESPACE_SUFFIX_ORDER=bronze,silver,gold` to prioritize known suffixes on the final namespace segment, e.g. `tenant_bronze`, `tenant_silver`, `tenant_gold`.
- Leave it unset to keep the default generic lexicographic namespace ordering.

## Development

```sh
pnpm install
pnpm dev
```

CF Access auth is bypassed in dev mode.

## Deploy

```sh
pnpm deploy
```
