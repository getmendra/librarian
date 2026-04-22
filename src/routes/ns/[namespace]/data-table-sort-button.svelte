<script lang="ts">
	import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
	import { Button } from "$lib/components/ui/button";

	let {
		label,
		sort = false,
		class: className,
		...restProps
	}: {
		label: string;
		sort?: false | "asc" | "desc";
		class?: string;
		onclick?: (event: MouseEvent) => void;
	} = $props();
</script>

<Button
	variant="ghost"
	class={sort ? `text-foreground ${className ?? ""}` : className}
	{...restProps}
>
	{label}
	{#if sort === "asc"}
		<ArrowUpIcon class="ml-2" />
	{:else if sort === "desc"}
		<ArrowDownIcon class="ml-2" />
	{:else}
		<ArrowUpDownIcon class="ml-2 opacity-50" />
	{/if}
</Button>
