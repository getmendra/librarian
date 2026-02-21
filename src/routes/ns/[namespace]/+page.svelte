<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';

	let { data } = $props();

	function timeAgo(ms: number | null): string {
		if (!ms) return '-';
		const seconds = Math.floor((Date.now() - ms) / 1000);
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days}d ago`;
		const months = Math.floor(days / 30);
		return `${months}mo ago`;
	}
</script>

<div class="space-y-4">
	<div>
		<h1 class="text-lg font-medium">{data.namespace}</h1>
		<p class="text-sm text-muted-foreground">
			{data.tables.length} table{data.tables.length !== 1 ? 's' : ''}
		</p>
	</div>

	{#if data.tables.length > 0}
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Name</Table.Head>
					<Table.Head class="w-20">Format</Table.Head>
					<Table.Head class="w-24 text-right">Columns</Table.Head>
					<Table.Head class="w-28 text-right">Records</Table.Head>
					<Table.Head class="w-24 text-right">Files</Table.Head>
					<Table.Head class="w-32 text-right">Updated</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#await data.tableStats}
					{#each data.tables as name}
						<Table.Row
							class="cursor-pointer"
							onclick={() =>
								(window.location.href = `/ns/${encodeURIComponent(data.namespace)}/table/${encodeURIComponent(name)}`)}
						>
							<Table.Cell>
								<a
									href="/ns/{encodeURIComponent(data.namespace)}/table/{encodeURIComponent(name)}"
									class="font-medium hover:underline"
								>
									{name}
								</a>
							</Table.Cell>
							<Table.Cell><Skeleton class="h-5 w-8" /></Table.Cell>
							<Table.Cell class="text-right"><Skeleton class="ml-auto h-5 w-6" /></Table.Cell>
							<Table.Cell class="text-right"><Skeleton class="ml-auto h-5 w-12" /></Table.Cell>
							<Table.Cell class="text-right"><Skeleton class="ml-auto h-5 w-6" /></Table.Cell>
							<Table.Cell class="text-right"><Skeleton class="ml-auto h-5 w-16" /></Table.Cell>
						</Table.Row>
					{/each}
				{:then tableStats}
					{#each tableStats as table}
						<Table.Row
							class="cursor-pointer"
							onclick={() =>
								(window.location.href = `/ns/${encodeURIComponent(data.namespace)}/table/${encodeURIComponent(table.name)}`)}
						>
							<Table.Cell>
								<a
									href="/ns/{encodeURIComponent(data.namespace)}/table/{encodeURIComponent(table.name)}"
									class="font-medium hover:underline"
								>
									{table.name}
								</a>
							</Table.Cell>
							<Table.Cell>
								{#if table.formatVersion}
									<Badge variant="secondary">v{table.formatVersion}</Badge>
								{/if}
							</Table.Cell>
							<Table.Cell class="text-right text-muted-foreground">
								{table.columns}
							</Table.Cell>
							<Table.Cell class="text-right font-mono text-sm text-muted-foreground">
								{table.totalRecords != null ? Number(table.totalRecords).toLocaleString() : '-'}
							</Table.Cell>
							<Table.Cell class="text-right font-mono text-sm text-muted-foreground">
								{table.totalDataFiles != null
									? Number(table.totalDataFiles).toLocaleString()
									: '-'}
							</Table.Cell>
							<Table.Cell class="text-right text-sm text-muted-foreground">
								{timeAgo(table.lastUpdated)}
							</Table.Cell>
						</Table.Row>
					{/each}
				{/await}
			</Table.Body>
		</Table.Root>
	{:else}
		<p class="text-sm text-muted-foreground">No tables in this namespace.</p>
	{/if}
</div>
