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

function url(path: string): string {
	return `${CATALOG_URI}/v1/${CATALOG_WAREHOUSE}${path}`;
}

async function get<T>(path: string): Promise<T> {
	const res = await fetch(url(path), { headers: headers() });
	if (!res.ok) {
		throw new Error(`Iceberg API error: ${res.status} ${res.statusText} for ${path}`);
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
