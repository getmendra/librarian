import type { PageServerLoad } from './$types';
import { loadTable, loadTableStats } from '$lib/server/iceberg';
import { validateSearchParams } from 'runed/kit';
import { tabSchema } from './search-params';

export const load: PageServerLoad = async ({ params, url }) => {
	const result = await loadTable(params.namespace, params.table);
	const { data: searchParams } = validateSearchParams(url, tabSchema);

	return {
		namespace: params.namespace,
		table: params.table,
		tab: searchParams.tab,
		metadata: result.metadata,
		stats: loadTableStats(result)
	};
};
