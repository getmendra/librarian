import type { PageServerLoad } from './$types';
import { listNamespaces } from '$lib/server/iceberg';

export const load: PageServerLoad = async () => {
	const { namespaces } = await listNamespaces();
	return { namespaces };
};
