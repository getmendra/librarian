<script lang="ts">
	import { Badge } from "$lib/components/ui/badge";

	let { formatVersion }: { formatVersion: number | null } = $props();
</script>

{#if formatVersion}
	<Badge variant="secondary">v{formatVersion}</Badge>
{:else}
	<span class="text-muted-foreground">-</span>
{/if}
