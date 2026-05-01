import type { PageServerLoad } from "./$types";
import { loadTable, loadTableStats } from "$lib/server/iceberg";
import { validateSearchParams } from "runed/kit";
import { tabSchema } from "./search-params";

function preferredLocale(request: Request): string {
	const preferred = request.headers.get("accept-language")?.split(",")[0]?.split(";")[0]?.trim();
	if (!preferred) return "en-US";

	try {
		return Intl.getCanonicalLocales(preferred)[0] ?? "en-US";
	} catch {
		return "en-US";
	}
}

export const load: PageServerLoad = async ({ params, url, request, untrack }) => {
	const result = await loadTable(params.namespace, params.table);
	const { data: searchParams } = untrack(() => validateSearchParams(url, tabSchema));
	const currentSnapshot = result.metadata.snapshots?.find(
		(s) => s["snapshot-id"] === result.metadata["current-snapshot-id"],
	);
	if (currentSnapshot?.summary["total-records"] == null) {
		console.warn(
			"[iceberg stats] missing total-records; using avro",
			`${params.namespace}.${params.table}`,
		);
	}

	return {
		namespace: params.namespace,
		table: params.table,
		tab: searchParams.tab,
		locale: preferredLocale(request),
		timeZone: request.cf?.timezone ?? "UTC",
		metadata: result.metadata,
		stats: loadTableStats(result),
	};
};
