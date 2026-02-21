import { CATALOG_URI, CATALOG_WAREHOUSE } from '$env/static/private';
import { env } from '$env/dynamic/private';
import type {
	ListNamespacesResponse,
	GetNamespaceResponse,
	ListTablesResponse,
	LoadTableResponse
} from './types';

function headers(): HeadersInit {
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
				{ headers: headers() }
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
	const res = await fetch(fullUrl, { headers: headers() });
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

export function loadTable(ns: string, table: string): Promise<LoadTableResponse> {
	return get(`/namespaces/${encodeURIComponent(ns)}/tables/${encodeURIComponent(table)}`);
}
