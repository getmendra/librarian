import { CATALOG_URI, CATALOG_WAREHOUSE } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { s3Get, type S3Credentials } from './s3';
import { parseAvro } from './avro';
import type {
	ListNamespacesResponse,
	GetNamespaceResponse,
	ListTablesResponse,
	LoadTableResponse
} from './types';

function authHeaders(): HeadersInit {
	return {
		Authorization: `Bearer ${env.CATALOG_TOKEN}`,
		Accept: 'application/json'
	};
}

interface CatalogConfig {
	overrides: Record<string, string>;
	defaults: Record<string, string>;
}

let prefixPromise: Promise<string> | null = null;

function fetchPrefix(): Promise<string> {
	if (!prefixPromise) {
		prefixPromise = (async () => {
			const res = await fetch(
				`${CATALOG_URI}/v1/config?warehouse=${encodeURIComponent(CATALOG_WAREHOUSE)}`,
				{ headers: authHeaders() }
			);
			if (!res.ok) {
				throw new Error(`Failed to fetch catalog config: ${res.status} ${res.statusText}`);
			}
			const config: CatalogConfig = await res.json();
			return config.overrides.prefix ?? CATALOG_WAREHOUSE;
		})();
	}
	return prefixPromise;
}

async function get<T>(path: string): Promise<T> {
	const prefix = await fetchPrefix();
	const fullUrl = `${CATALOG_URI}/v1/${prefix}${path}`;
	const res = await fetch(fullUrl, { headers: authHeaders() });
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Iceberg API error: ${res.status} ${res.statusText} for ${fullUrl}\n${body}`);
	}
	return res.json() as Promise<T>;
}

export function listNamespaces(): Promise<ListNamespacesResponse> {
	return get('/namespaces');
}

export function getNamespace(ns: string): Promise<GetNamespaceResponse> {
	return get(`/namespaces/${encodeURIComponent(ns)}`);
}

export function listTables(ns: string): Promise<ListTablesResponse> {
	return get(`/namespaces/${encodeURIComponent(ns)}/tables`);
}

function parseS3Uri(uri: string): { bucket: string; key: string } {
	const withoutScheme = uri.replace(/^s3:\/\//, '');
	const slashIndex = withoutScheme.indexOf('/');
	return {
		bucket: withoutScheme.slice(0, slashIndex),
		key: withoutScheme.slice(slashIndex + 1)
	};
}

function extractS3Creds(config: Record<string, string>): S3Credentials | null {
	const accessKeyId = config['s3.access-key-id'];
	const secretAccessKey = config['s3.secret-access-key'];
	const endpoint = config['s3.endpoint'];
	if (!accessKeyId || !secretAccessKey || !endpoint) return null;
	return {
		accessKeyId,
		secretAccessKey,
		endpoint,
		region: config['s3.region'] ?? config['region'] ?? 'auto'
	};
}

/** Fields we need from the manifest list Avro file */
const MANIFEST_LIST_FIELDS = new Set([
	'content',
	'added_files_count',
	'existing_files_count',
	'deleted_files_count',
	'added_rows_count',
	'existing_rows_count',
	'deleted_rows_count'
]);

export interface TableStats {
	totalRecords: number;
	totalDataFiles: number;
}

/**
 * Read the manifest list for a snapshot and compute total records and files.
 */
async function fetchManifestStats(
	manifestListUri: string,
	creds: S3Credentials
): Promise<TableStats | null> {
	const { bucket, key } = parseS3Uri(manifestListUri);
	const res = await s3Get(bucket, key, creds);
	if (!res.ok) return null;

	const data = new Uint8Array(await res.arrayBuffer());
	const manifests = await parseAvro(data, MANIFEST_LIST_FIELDS);

	let totalRecords = 0;
	let totalDataFiles = 0;

	for (const m of manifests) {
		// content: 0 = data, 1 = deletes — only count data manifests
		const content = (m.content as number) ?? 0;
		if (content !== 0) continue;

		totalRecords +=
			((m.added_rows_count as number) ?? 0) +
			((m.existing_rows_count as number) ?? 0) -
			((m.deleted_rows_count as number) ?? 0);

		totalDataFiles +=
			((m.added_files_count as number) ?? 0) +
			((m.existing_files_count as number) ?? 0) -
			((m.deleted_files_count as number) ?? 0);
	}

	return { totalRecords, totalDataFiles };
}

/**
 * Load table via REST API, then enrich snapshot summaries with stats
 * computed from the manifest list if the catalog didn't provide them.
 */
export async function loadTable(ns: string, table: string): Promise<LoadTableResponse> {
	const result = await get<LoadTableResponse>(
		`/namespaces/${encodeURIComponent(ns)}/tables/${encodeURIComponent(table)}`
	);

	// If snapshots already have stats, no need to fetch manifests
	const hasStats = result.metadata.snapshots?.some((s) => s.summary['total-records']);
	if (hasStats) return result;

	// Need credentials for R2 access
	const creds = result.config ? extractS3Creds(result.config) : null;
	if (!creds) return result;

	// Find the current snapshot and enrich its summary
	const currentSnapshotId = result.metadata['current-snapshot-id'];
	const currentSnapshot = result.metadata.snapshots?.find(
		(s) => s['snapshot-id'] === currentSnapshotId
	);
	if (!currentSnapshot?.['manifest-list']) return result;

	try {
		const stats = await fetchManifestStats(currentSnapshot['manifest-list'], creds);
		if (stats) {
			currentSnapshot.summary['total-records'] = String(stats.totalRecords);
			currentSnapshot.summary['total-data-files'] = String(stats.totalDataFiles);
		}
	} catch (e) {
		console.log('manifest fetch error:', e);
	}

	return result;
}
