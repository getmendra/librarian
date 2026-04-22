<script lang="ts">
	import type { NamespaceTableRow } from "./columns";
	import { getColumns } from "./columns";
	import DataTable from "./data-table.svelte";

	let { data } = $props();
	let tableStats = $state<NamespaceTableRow[]>([]);
	let tableStatsLoaded = $state(false);
	let tableStatsPromise = $derived(data.tableStats);

	$effect(() => {
		let cancelled = false;
		tableStatsLoaded = false;

		tableStatsPromise.then((rows) => {
			if (cancelled) return;
			tableStats = rows;
			tableStatsLoaded = true;
		});

		return () => {
			cancelled = true;
		};
	});
</script>

<div class="space-y-4">
	<div>
		<h1 class="text-lg font-medium">{data.namespace}</h1>
		<p class="text-sm text-muted-foreground">
			{data.tables.length} table{data.tables.length !== 1 ? "s" : ""}
		</p>
	</div>

	{#if data.tables.length > 0}
		<DataTable
			data={tableStats}
			columns={getColumns(data.namespace)}
			filterColumn="name"
			filterPlaceholder="Filter tables..."
			initialFilter={data.filter}
			initialSort={data.sort}
			initialDir={data.dir}
			loading={!tableStatsLoaded}
			loadingRows={data.tables}
		/>
	{:else}
		<p class="text-sm text-muted-foreground">No tables in this namespace.</p>
	{/if}
</div>
