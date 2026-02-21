import type { PageServerLoad } from './$types';
import { loadTable } from '$lib/server/iceberg';

export const load: PageServerLoad = async ({ params }) => {
	const { metadata } = await loadTable(params.namespace, params.table);
	return {
		namespace: params.namespace,
		table: params.table,
		metadata
	};
};
