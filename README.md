# <img src="src/lib/assets/favicon.svg" width="24" height="24" alt="Librarian logo"> Librarian

![Librarian screenshot](https://github.com/user-attachments/assets/8e8541a5-ec91-4957-b9fc-5cdd5470aece)

Read-only Iceberg catalog explorer for Cloudflare R2 Data Catalog. Deploys as a Cloudflare Worker.

## Features

- Browse namespaces and tables
- Inspect schemas, partitions, snapshots, and table properties
- Record and file counts computed from Iceberg manifests fetched directly from R2

## Setup

Install dependencies and inspect the Varlock schema:

```sh
pnpm install
pnpm exec varlock load
```

Configuration is defined in `.env.schema` and loaded from a 1Password Environment via Varlock.
Create a 1Password Environment for this deployment with these variables:

- `CATALOG_URI`
- `CATALOG_WAREHOUSE`
- `NAMESPACE_SUFFIX_ORDER`
- `CATALOG_TOKEN`

For local development, Varlock uses the 1Password desktop app/CLI integration:

```sh
pnpm exec varlock load
pnpm dev
```

For Cloudflare Workers Builds, set these build-time variables in the dashboard:

- `APP_ENV=production`
- `OP_SERVICE_ACCOUNT_TOKEN=<1Password service account token>`

Before deploying, enable Cloudflare Access for the `librarian` Worker and protect **All traffic**. Production requests that do not include an authenticated Worker Access context receive a `403` response.

Optional namespace ordering:

- Set `NAMESPACE_SUFFIX_ORDER=bronze,silver,gold` to prioritize known suffixes on the final namespace segment, e.g. `tenant_bronze`, `tenant_silver`, `tenant_gold`.
- Leave it unset to keep the default generic lexicographic namespace ordering.

## Development

```sh
pnpm install
pnpm dev
```

Cloudflare Access protects the deployed Worker and is bypassed in dev mode.

If you want to run the built Worker locally, use:

```sh
pnpm preview
```
