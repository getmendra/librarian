<script lang="ts">
	import * as Table from "$lib/components/ui/table";
	import { Skeleton } from "$lib/components/ui/skeleton";
	import { getColumns } from "./columns";
	import DataTable from "./data-table.svelte";

	let { data } = $props();
</script>

<div class="space-y-4">
	<div>
		<h1 class="text-lg font-medium">{data.namespace}</h1>
		<p class="text-sm text-muted-foreground">
			{data.tables.length} table{data.tables.length !== 1 ? "s" : ""}
		</p>
	</div>

	{#if data.tables.length > 0}
		{#await data.tableStats}
			<div class="rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Name</Table.Head>
							<Table.Head class="w-24">Format</Table.Head>
							<Table.Head class="w-24 text-right">Columns</Table.Head>
							<Table.Head class="w-32 text-right">Records</Table.Head>
							<Table.Head class="w-24 text-right">Files</Table.Head>
							<Table.Head class="w-32 text-right">Updated</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.tables as name}
							<Table.Row>
								<Table.Cell class="font-medium">{name}</Table.Cell>
								<Table.Cell><Skeleton class="h-5 w-8" /></Table.Cell>
								<Table.Cell class="text-right"><Skeleton class="ml-auto h-5 w-6" /></Table.Cell>
								<Table.Cell class="text-right"><Skeleton class="ml-auto h-5 w-12" /></Table.Cell>
								<Table.Cell class="text-right"><Skeleton class="ml-auto h-5 w-6" /></Table.Cell>
								<Table.Cell class="text-right"><Skeleton class="ml-auto h-5 w-16" /></Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{:then tableStats}
			<DataTable
				data={tableStats}
				columns={getColumns(data.namespace)}
				filterColumn="name"
				filterPlaceholder="Filter tables..."
			/>
		{/await}
	{:else}
		<p class="text-sm text-muted-foreground">No tables in this namespace.</p>
	{/if}
</div>
