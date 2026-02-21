# Librarian

Read-only Iceberg catalog explorer for Cloudflare R2 Data Catalog.

## Architecture

- SvelteKit + Cloudflare Workers, shadcn-svelte UI
- Iceberg REST Catalog API only (not CF Management API)
- CF Access JWT validation via `jose` (bypassed in dev via `$app/environment.dev`)
- Static env vars (`$env/static/private`), `CATALOG_TOKEN` as Worker secret (`$env/dynamic/private`)
- Must call `GET /v1/config?warehouse=` first to get the actual prefix for API calls

## Design decisions

- **Manifest stats from R2**: CF's REST catalog returns empty snapshot summaries. We fetch the manifest list (Avro) from R2 using vended S3 credentials to compute record/file counts. Custom Avro parser + S3 signer — zero dependencies.
- **Streaming**: `loadTable()` (REST) is fast, `loadTableStats()` (manifest fetch) is slow. Pages return metadata immediately and stream stats via SvelteKit promise streaming.
- **Clean minimal UI**: No cards for lists. Table-driven layouts, inline stats, skeleton placeholders for streamed data.

## Non-goals

- No write/mutate operations
- No in-app auth configuration (CF Access is external)
- No Cloudflare Management API usage
- No SQL query support
