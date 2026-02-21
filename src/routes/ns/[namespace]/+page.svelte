<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	let { data } = $props();
</script>

<div class="space-y-4">
	<div>
		<h1 class="text-lg font-medium">{data.namespace}</h1>
		<p class="text-sm text-muted-foreground">
			{data.tables.length} table{data.tables.length !== 1 ? 's' : ''}
		</p>
	</div>

	{#if data.tables.length > 0}
		<div class="divide-y divide-border rounded-lg border">
			{#each data.tables as table}
				<a
					href="/ns/{encodeURIComponent(data.namespace)}/table/{encodeURIComponent(table.name)}"
					class="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50"
				>
					<span class="font-medium">{table.name}</span>
					<ChevronRight class="size-4 text-muted-foreground" />
				</a>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-muted-foreground">No tables in this namespace.</p>
	{/if}
</div>
