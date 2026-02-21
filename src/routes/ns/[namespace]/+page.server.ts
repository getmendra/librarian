import type { PageServerLoad } from './$types';
import { listTables, loadTable, loadTableStats } from '$lib/server/iceberg';

export const load: PageServerLoad = async ({ params }) => {
	const ns = params.namespace;
	const { identifiers } = await listTables(ns);

	const tableStats = Promise.all(
		identifiers.map(async (id) => {
			try {
				const result = await loadTable(ns, id.name);
				const { metadata } = result;
				const currentSchema = metadata.schemas.find(
					(s) => s['schema-id'] === metadata['current-schema-id']
				);
				const stats = await loadTableStats(result);
				return {
					name: id.name,
					formatVersion: metadata['format-version'],
					lastUpdated: metadata['last-updated-ms'],
					columns: currentSchema?.fields.length ?? 0,
					totalRecords: stats?.totalRecords ?? null,
					totalDataFiles: stats?.totalDataFiles ?? null
				};
			} catch {
				return {
					name: id.name,
					formatVersion: null,
					lastUpdated: null,
					columns: 0,
					totalRecords: null,
					totalDataFiles: null
				};
			}
		})
	);

	return {
		namespace: ns,
		tables: identifiers.map((id) => id.name),
		tableStats
	};
};
