<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import type { StructField, IcebergType, TableMetadata } from '$lib/server/types';

	let { data } = $props();
	let meta: TableMetadata = $derived(data.metadata);

	let currentSchema = $derived(
		meta.schemas.find((s) => s['schema-id'] === meta['current-schema-id']) ?? meta.schemas[0]
	);

	let currentPartitionSpec = $derived(
		meta['partition-specs']?.find((s) => s['spec-id'] === meta['default-spec-id']) ??
			meta['partition-specs']?.[0]
	);

	let snapshots = $derived(
		[...(meta.snapshots ?? [])].sort((a, b) => b['timestamp-ms'] - a['timestamp-ms'])
	);

	let latestSnapshot = $derived(snapshots[0]);

	function formatTimestamp(ms: number): string {
		return new Date(ms).toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
	}

	function formatType(t: IcebergType): string {
		if (typeof t === 'string') return t;
		if (t.type === 'struct') return 'struct';
		if (t.type === 'list') return `list<${formatType(t.element)}>`;
		if (t.type === 'map') return `map<${formatType(t.key)}, ${formatType(t.value)}>`;
		return 'unknown';
	}

	function flattenFields(
		fields: StructField[],
		prefix = ''
	): { id: number; name: string; type: string; required: boolean; depth: number }[] {
		const result: { id: number; name: string; type: string; required: boolean; depth: number }[] =
			[];
		const depth = prefix ? prefix.split('.').length : 0;
		for (const f of fields) {
			const fullName = prefix ? `${prefix}.${f.name}` : f.name;
			result.push({
				id: f.id,
				name: fullName,
				type: formatType(f.type),
				required: f.required,
				depth
			});
			if (typeof f.type !== 'string' && f.type.type === 'struct') {
				result.push(...flattenFields(f.type.fields, fullName));
			}
		}
		return result;
	}

	let flatFields = $derived(currentSchema ? flattenFields(currentSchema.fields) : []);

	function fieldNameById(id: number): string {
		return flatFields.find((f) => f.id === id)?.name ?? `field-${id}`;
	}

	let properties = $derived(
		meta.properties ? Object.entries(meta.properties).sort(([a], [b]) => a.localeCompare(b)) : []
	);
</script>

<div class="space-y-6">
	<div class="space-y-3">
		<div>
			<h1 class="text-lg font-medium">{data.table}</h1>
			<p class="text-sm text-muted-foreground">{data.namespace}</p>
		</div>

		<div class="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
			<span>
				<span class="text-muted-foreground">Format</span>
				<Badge variant="secondary" class="ml-1.5">v{meta['format-version']}</Badge>
			</span>
			{#await data.stats}
				<span>
					<span class="text-muted-foreground">Records</span>
					<Skeleton class="ml-1.5 inline-block h-5 w-16 align-middle" />
				</span>
				<span>
					<span class="text-muted-foreground">Files</span>
					<Skeleton class="ml-1.5 inline-block h-5 w-8 align-middle" />
				</span>
			{:then stats}
				{#if stats}
					<span>
						<span class="text-muted-foreground">Records</span>
						<span class="ml-1.5 font-medium">{stats.totalRecords.toLocaleString()}</span>
					</span>
					<span>
						<span class="text-muted-foreground">Files</span>
						<span class="ml-1.5 font-medium">{stats.totalDataFiles.toLocaleString()}</span>
					</span>
				{/if}
			{/await}
			{#if snapshots.length > 0}
				<span>
					<span class="text-muted-foreground">Snapshots</span>
					<span class="ml-1.5 font-medium">{snapshots.length}</span>
				</span>
			{/if}
			{#if meta['last-updated-ms']}
				<span>
					<span class="text-muted-foreground">Updated</span>
					<span class="ml-1.5 font-medium">{new Date(meta['last-updated-ms']).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
				</span>
			{/if}
			<span class="text-muted-foreground font-mono text-xs">{meta['table-uuid']}</span>
		</div>
	</div>

	<Tabs.Root value="schema">
		<Tabs.List>
			<Tabs.Trigger value="schema">Schema</Tabs.Trigger>
			<Tabs.Trigger value="partitions">Partitions</Tabs.Trigger>
			<Tabs.Trigger value="snapshots">Snapshots</Tabs.Trigger>
			<Tabs.Trigger value="properties">Properties</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="schema" class="pt-4">
			{#if currentSchema}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-16">ID</Table.Head>
							<Table.Head>Name</Table.Head>
							<Table.Head>Type</Table.Head>
							<Table.Head class="w-24">Required</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each flatFields as field}
							<Table.Row>
								<Table.Cell class="font-mono text-xs text-muted-foreground"
									>{field.id}</Table.Cell
								>
								<Table.Cell>
									<span style="padding-left: {field.depth * 1.5}rem" class="font-medium"
										>{field.name}</span
									>
								</Table.Cell>
								<Table.Cell>
									<code class="text-xs">{field.type}</code>
								</Table.Cell>
								<Table.Cell>
									{#if field.required}
										<Badge variant="outline" class="text-xs">required</Badge>
									{:else}
										<span class="text-xs text-muted-foreground">optional</span>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Tabs.Content>

		<Tabs.Content value="partitions" class="pt-4">
			{#if currentPartitionSpec && currentPartitionSpec.fields.length > 0}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Name</Table.Head>
							<Table.Head>Source Column</Table.Head>
							<Table.Head>Transform</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each currentPartitionSpec.fields as field}
							<Table.Row>
								<Table.Cell class="font-medium">{field.name}</Table.Cell>
								<Table.Cell>{fieldNameById(field['source-id'])}</Table.Cell>
								<Table.Cell>
									<Badge variant="secondary">{field.transform}</Badge>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{:else}
				<p class="text-sm text-muted-foreground">This table is not partitioned.</p>
			{/if}
		</Tabs.Content>

		<Tabs.Content value="snapshots" class="pt-4">
			{#if snapshots.length > 0}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Snapshot ID</Table.Head>
							<Table.Head>Timestamp</Table.Head>
							<Table.Head>Operation</Table.Head>
							<Table.Head class="text-right">Added</Table.Head>
							<Table.Head class="text-right">Deleted</Table.Head>
							<Table.Head class="text-right">Total Records</Table.Head>
							<Table.Head class="text-right">Total Files</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each snapshots as snap}
							<Table.Row>
								<Table.Cell class="font-mono text-xs">{snap['snapshot-id']}</Table.Cell>
								<Table.Cell class="text-sm"
									>{formatTimestamp(snap['timestamp-ms'])}</Table.Cell
								>
								<Table.Cell>
									{#if snap.summary.operation}
										<Badge variant="outline">{snap.summary.operation}</Badge>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-right font-mono text-xs">
									{snap.summary['added-records'] ?? '-'}
								</Table.Cell>
								<Table.Cell class="text-right font-mono text-xs">
									{snap.summary['deleted-records'] ?? '-'}
								</Table.Cell>
								<Table.Cell class="text-right font-mono text-xs">
									{snap.summary['total-records'] ?? '-'}
								</Table.Cell>
								<Table.Cell class="text-right font-mono text-xs">
									{snap.summary['total-data-files'] ?? '-'}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{:else}
				<p class="text-sm text-muted-foreground">No snapshots available.</p>
			{/if}
		</Tabs.Content>

		<Tabs.Content value="properties" class="pt-4">
			{#if properties.length > 0}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Key</Table.Head>
							<Table.Head>Value</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each properties as [key, value]}
							<Table.Row>
								<Table.Cell class="font-mono text-sm">{key}</Table.Cell>
								<Table.Cell class="font-mono text-sm text-muted-foreground">{value}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{:else}
				<p class="text-sm text-muted-foreground">No properties set.</p>
			{/if}
		</Tabs.Content>
	</Tabs.Root>
</div>
