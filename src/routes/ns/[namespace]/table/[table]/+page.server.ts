import type { PageServerLoad } from './$types';
import { loadTable, loadTableStats } from '$lib/server/iceberg';

export const load: PageServerLoad = async ({ params }) => {
	const result = await loadTable(params.namespace, params.table);
	return {
		namespace: params.namespace,
		table: params.table,
		metadata: result.metadata,
		stats: loadTableStats(result)
	};
};
