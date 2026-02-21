import type { PageServerLoad } from './$types';
import { listTables, loadTable } from '$lib/server/iceberg';

export const load: PageServerLoad = async ({ params }) => {
	const ns = params.namespace;
	const { identifiers } = await listTables(ns);

	const tables = await Promise.all(
		identifiers.map(async (id) => {
			try {
				const { metadata } = await loadTable(ns, id.name);
				const currentSchema = metadata.schemas.find(
					(s) => s['schema-id'] === metadata['current-schema-id']
				);
				const snapshot = metadata.snapshots?.find(
					(s) => s['snapshot-id'] === metadata['current-snapshot-id']
				);
				return {
					name: id.name,
					formatVersion: metadata['format-version'],
					lastUpdated: metadata['last-updated-ms'],
					columns: currentSchema?.fields.length ?? 0,
					totalRecords: snapshot?.summary['total-records'] ?? null,
					totalFiles: snapshot?.summary['total-data-files'] ?? null
				};
			} catch {
				return { name: id.name, formatVersion: null, lastUpdated: null, columns: 0, totalRecords: null, totalFiles: null };
			}
		})
	);

	return { namespace: ns, tables };
};
