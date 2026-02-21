<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { Separator } from '$lib/components/ui/separator';

	let { children } = $props();

	type Crumb = { label: string; href: string };

	let crumbs: Crumb[] = $derived.by(() => {
		const segments = page.url.pathname.split('/').filter(Boolean);
		const result: Crumb[] = [{ label: 'Namespaces', href: '/' }];
		if (segments[0] === 'ns' && segments[1]) {
			const ns = decodeURIComponent(segments[1]);
			result.push({ label: ns, href: `/ns/${segments[1]}` });
			if (segments[2] === 'table' && segments[3]) {
				const table = decodeURIComponent(segments[3]);
				result.push({ label: table, href: `/ns/${segments[1]}/table/${segments[3]}` });
			}
		}
		return result;
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-background">
	<header class="border-b border-border">
		<div class="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
			<a href="/" class="text-xl font-semibold tracking-tight">Librarian</a>
			<Separator orientation="vertical" class="!h-6" />
			<Breadcrumb.Root>
				<Breadcrumb.List>
					{#each crumbs as crumb, i}
						{#if i > 0}
							<Breadcrumb.Separator />
						{/if}
						<Breadcrumb.Item>
							{#if i === crumbs.length - 1}
								<Breadcrumb.Page>{crumb.label}</Breadcrumb.Page>
							{:else}
								<Breadcrumb.Link href={crumb.href}>{crumb.label}</Breadcrumb.Link>
							{/if}
						</Breadcrumb.Item>
					{/each}
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-6 py-8">
		{@render children()}
	</main>
</div>
