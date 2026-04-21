import type { PageServerLoad } from './$types';
import { listNamespaces } from '$lib/server/iceberg';

const LAYER_ORDER: Record<string, number> = { bronze: 0, silver: 1, gold: 2 };

function splitTenantLayer(name: string): { tenant: string; layer: string | null } {
	const idx = name.lastIndexOf('_');
	if (idx === -1) return { tenant: name, layer: null };
	const layer = name.slice(idx + 1).toLowerCase();
	if (!(layer in LAYER_ORDER)) return { tenant: name, layer: null };
	return { tenant: name.slice(0, idx), layer };
}

export const load: PageServerLoad = async () => {
	const { namespaces } = await listNamespaces();
	const sorted = [...namespaces].sort((a, b) => {
		const ak = splitTenantLayer(a.join('.'));
		const bk = splitTenantLayer(b.join('.'));
		if (ak.tenant !== bk.tenant) return ak.tenant.localeCompare(bk.tenant);
		const ao = ak.layer ? LAYER_ORDER[ak.layer] : 99;
		const bo = bk.layer ? LAYER_ORDER[bk.layer] : 99;
		return ao - bo;
	});
	return { namespaces: sorted };
};
