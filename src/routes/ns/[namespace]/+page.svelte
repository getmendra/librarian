<script lang="ts">
	import * as Card from '$lib/components/ui/card';

	let { data } = $props();
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">{data.namespace}</h1>
		<p class="text-sm text-muted-foreground">
			{data.tables.length} table{data.tables.length !== 1 ? 's' : ''}
		</p>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.tables as table}
			<a href="/ns/{encodeURIComponent(data.namespace)}/table/{encodeURIComponent(table.name)}">
				<Card.Root class="transition-colors hover:bg-accent">
					<Card.Header>
						<Card.Title>{table.name}</Card.Title>
					</Card.Header>
				</Card.Root>
			</a>
		{/each}
	</div>

	{#if data.tables.length === 0}
		<p class="text-muted-foreground">No tables in this namespace.</p>
	{/if}
</div>
