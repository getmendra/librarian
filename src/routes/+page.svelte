<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	let { data } = $props();
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Namespaces</h1>
		<p class="text-sm text-muted-foreground">Browse namespaces in the catalog</p>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.namespaces as ns}
			{@const name = ns.join('.')}
			<a href="/ns/{encodeURIComponent(name)}">
				<Card.Root class="transition-colors hover:bg-accent">
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							{name}
							{#if ns.length > 1}
								<Badge variant="secondary">nested</Badge>
							{/if}
						</Card.Title>
					</Card.Header>
				</Card.Root>
			</a>
		{/each}
	</div>

	{#if data.namespaces.length === 0}
		<p class="text-muted-foreground">No namespaces found.</p>
	{/if}
</div>
