<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	let { data } = $props();
</script>

<div class="space-y-4">
	<h1 class="text-lg font-medium">Namespaces</h1>

	{#if data.namespaces.length > 0}
		<div class="divide-y divide-border rounded-lg border">
			{#each data.namespaces as ns}
				{@const name = ns.join('.')}
				<a
					href="/ns/{encodeURIComponent(name)}"
					class="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50"
				>
					<span class="font-medium">{name}</span>
					<ChevronRight class="size-4 text-muted-foreground" />
				</a>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-muted-foreground">No namespaces found.</p>
	{/if}
</div>
