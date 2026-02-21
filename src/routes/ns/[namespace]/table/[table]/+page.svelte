<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
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

	let snapshots = $derived([...(meta.snapshots ?? [])].sort((a, b) => b['timestamp-ms'] - a['timestamp-ms']));

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
			result.push({ id: f.id, name: fullName, type: formatType(f.type), required: f.required, depth });
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
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">{data.table}</h1>
		<p class="text-sm text-muted-foreground">{data.namespace}</p>
	</div>

	<Tabs.Root value="overview">
		<Tabs.List>
			<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
			<Tabs.Trigger value="schema">Schema</Tabs.Trigger>
			<Tabs.Trigger value="partitions">Partitions</Tabs.Trigger>
			<Tabs.Trigger value="snapshots">Snapshots</Tabs.Trigger>
			<Tabs.Trigger value="properties">Properties</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="overview" class="space-y-4 pt-4">
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Card.Root>
					<Card.Header>
						<Card.Description>Format Version</Card.Description>
						<Card.Title>
							<Badge variant="secondary">v{meta['format-version']}</Badge>
						</Card.Title>
					</Card.Header>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Description>Table UUID</Card.Description>
						<Card.Title class="text-sm font-mono">{meta['table-uuid']}</Card.Title>
					</Card.Header>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Description>Location</Card.Description>
						<Card.Title class="truncate text-sm font-mono" title={meta.location}>
							{meta.location}
						</Card.Title>
					</Card.Header>
				</Card.Root>

				{#if latestSnapshot}
					<Card.Root>
						<Card.Header>
							<Card.Description>Current Snapshot</Card.Description>
							<Card.Title class="text-sm font-mono">
								{latestSnapshot['snapshot-id']}
							</Card.Title>
						</Card.Header>
					</Card.Root>

					<Card.Root>
						<Card.Header>
							<Card.Description>Total Records</Card.Description>
							<Card.Title>
								{Number(latestSnapshot.summary['total-records'] ?? 0).toLocaleString()}
							</Card.Title>
						</Card.Header>
					</Card.Root>

					<Card.Root>
						<Card.Header>
							<Card.Description>Total Data Files</Card.Description>
							<Card.Title>
								{Number(latestSnapshot.summary['total-data-files'] ?? 0).toLocaleString()}
							</Card.Title>
						</Card.Header>
					</Card.Root>
				{/if}
			</div>
		</Tabs.Content>

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
								<Table.Cell class="font-mono text-xs">{field.id}</Table.Cell>
								<Table.Cell>
									<span style="padding-left: {field.depth * 1.5}rem">{field.name}</span>
								</Table.Cell>
								<Table.Cell>
									<Badge variant="outline">{field.type}</Badge>
								</Table.Cell>
								<Table.Cell>
									{#if field.required}
										<Badge>required</Badge>
									{:else}
										<span class="text-muted-foreground">optional</span>
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
							<Table.Head class="w-24">Field ID</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each currentPartitionSpec.fields as field}
							<Table.Row>
								<Table.Cell>{field.name}</Table.Cell>
								<Table.Cell>{fieldNameById(field['source-id'])}</Table.Cell>
								<Table.Cell>
									<Badge variant="secondary">{field.transform}</Badge>
								</Table.Cell>
								<Table.Cell class="font-mono text-xs">{field['field-id']}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{:else}
				<p class="text-muted-foreground">This table is not partitioned.</p>
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
							<Table.Head class="text-right">Added Records</Table.Head>
							<Table.Head class="text-right">Deleted Records</Table.Head>
							<Table.Head class="text-right">Added Files</Table.Head>
							<Table.Head class="text-right">Total Records</Table.Head>
							<Table.Head class="text-right">Total Files</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each snapshots as snap}
							<Table.Row>
								<Table.Cell class="font-mono text-xs">{snap['snapshot-id']}</Table.Cell>
								<Table.Cell class="text-xs">{formatTimestamp(snap['timestamp-ms'])}</Table.Cell>
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
									{snap.summary['added-data-files'] ?? '-'}
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
				<p class="text-muted-foreground">No snapshots available.</p>
			{/if}
		</Tabs.Content>

		<Tabs.Content value="properties" class="pt-4">
			{#if meta.properties && Object.keys(meta.properties).length > 0}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Key</Table.Head>
							<Table.Head>Value</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each Object.entries(meta.properties).sort(([a], [b]) => a.localeCompare(b)) as [key, value]}
							<Table.Row>
								<Table.Cell class="font-mono text-sm">{key}</Table.Cell>
								<Table.Cell class="font-mono text-sm">{value}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{:else}
				<p class="text-muted-foreground">No properties set.</p>
			{/if}
		</Tabs.Content>
	</Tabs.Root>
</div>
