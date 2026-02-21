import type { PageServerLoad } from './$types';
import { listTables } from '$lib/server/iceberg';

export const load: PageServerLoad = async ({ params }) => {
	const ns = params.namespace;
	const { identifiers } = await listTables(ns);
	return { namespace: ns, tables: identifiers };
};
