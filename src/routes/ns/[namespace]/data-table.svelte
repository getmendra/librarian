<script lang="ts" generics="TData, TValue">
	import { browser } from "$app/environment";
	import {
		type ColumnDef,
		type ColumnFiltersState,
		type PaginationState,
		type SortingState,
		type VisibilityState,
		getCoreRowModel,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel,
	} from "@tanstack/table-core";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import { useSearchParams } from "runed/kit";
	import { Button } from "$lib/components/ui/button";
	import {
		createSvelteTable,
		FlexRender,
	} from "$lib/components/ui/data-table";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import { Input } from "$lib/components/ui/input";
	import { Skeleton } from "$lib/components/ui/skeleton";
	import * as Table from "$lib/components/ui/table";
	import {
		namespaceTableSearchParamsSchema,
		type SortKey,
	} from "./search-params";

	type ColumnMeta = {
		headClass?: string;
		cellClass?: string;
	};

	type DataTableProps<TData, TValue> = {
		columns: ColumnDef<TData, TValue>[];
		data: TData[];
		filterColumn: string;
		filterPlaceholder: string;
		initialFilter: string;
		initialSort: "" | SortKey;
		initialDir: "asc" | "desc";
		loading?: boolean;
		loadingRows?: string[];
	};

	let {
		data,
		columns,
		filterColumn,
		filterPlaceholder,
		initialFilter,
		initialSort,
		initialDir,
		loading = false,
		loadingRows = [],
	}: DataTableProps<TData, TValue> = $props();

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 100 });
	let columnVisibility = $state<VisibilityState>({});
	const searchParams = useSearchParams(namespaceTableSearchParamsSchema, {
		pushHistory: false,
		noScroll: true,
		debounce: 200,
	});

	let currentFilter = $derived(browser ? searchParams.q : initialFilter);
	let currentSort = $derived(browser ? searchParams.sort : initialSort);
	let currentDir = $derived(browser ? searchParams.dir : initialDir);
	let sorting = $derived(getSortingState(currentSort, currentDir));
	let columnFilters = $derived(getFilterState(filterColumn, currentFilter));

	const table = createSvelteTable({
		get data() {
			return data;
		},
		get columns() {
			return columns;
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: (updater) => {
			if (typeof updater === "function") {
				pagination = updater(pagination);
			} else {
				pagination = updater;
			}
		},
		onSortingChange: (updater) => {
			const nextSorting = typeof updater === "function" ? updater(sorting) : updater;
			if (!sameSortingState(sorting, nextSorting)) {
				pagination = { ...pagination, pageIndex: 0 };
				updateSortParams(nextSorting);
			}
		},
		onColumnFiltersChange: (updater) => {
			const nextFilters = typeof updater === "function" ? updater(columnFilters) : updater;
			if (!sameFilterState(columnFilters, nextFilters)) {
				pagination = { ...pagination, pageIndex: 0 };
				const value = nextFilters.find((filter) => filter.id === filterColumn)?.value;
				updateFilterParams(typeof value === "string" ? value : "");
			}
		},
		onColumnVisibilityChange: (updater) => {
			if (typeof updater === "function") {
				columnVisibility = updater(columnVisibility);
			} else {
				columnVisibility = updater;
			}
		},
		state: {
			get pagination() {
				return pagination;
			},
			get sorting() {
				return sorting;
			},
			get columnFilters() {
				return columnFilters;
			},
			get columnVisibility() {
				return columnVisibility;
			},
		},
	});

	function columnLabel(columnId: string): string {
		return columnId
			.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
			.replace(/[-_]+/g, " ")
			.replace(/\s+/g, " ")
			.trim();
	}

	function updateFilterParams(value: string) {
		if (!browser || searchParams.q === value) return;
		searchParams.q = value;
	}

	function updateSortParams(nextSorting: SortingState) {
		if (!browser) return;
		const activeSort = nextSorting[0];
		searchParams.update({
			sort: isSortKey(activeSort?.id) ? activeSort.id : "",
			dir: activeSort?.desc ? "desc" : "asc",
		});
	}

	function getFilterState(columnId: string, value: string): ColumnFiltersState {
		return value ? [{ id: columnId, value }] : [];
	}

	function getSortingState(sort: "" | SortKey, dir: "asc" | "desc"): SortingState {
		return sort ? [{ id: sort, desc: dir === "desc" }] : [];
	}

	function sameFilterState(a: ColumnFiltersState, b: ColumnFiltersState): boolean {
		if (a.length !== b.length) return false;
		return a.every((filter, index) => filter.id === b[index]?.id && filter.value === b[index]?.value);
	}

	function sameSortingState(a: SortingState, b: SortingState): boolean {
		if (a.length !== b.length) return false;
		return a.every((sort, index) => sort.id === b[index]?.id && sort.desc === b[index]?.desc);
	}

	function isSortKey(value: string | undefined): value is SortKey {
		return value === "name"
			|| value === "columns"
			|| value === "totalRecords"
			|| value === "totalDataFiles"
			|| value === "lastUpdated";
	}
</script>

<div class="space-y-4">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
		<Input
			placeholder={filterPlaceholder}
			value={currentFilter}
			oninput={(e) => {
				table.getColumn(filterColumn)?.setFilterValue(e.currentTarget.value);
			}}
			class="w-full sm:max-w-sm"
		/>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="outline" class="sm:ml-auto">
						Columns
						<ChevronDownIcon class="ml-2" />
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-56">
				{#each table.getAllColumns().filter((column) => column.getCanHide()) as column (column.id)}
					<DropdownMenu.CheckboxItem
						class="pr-10"
						bind:checked={() => column.getIsVisible(), (value) => column.toggleVisibility(!!value)}
					>
						<span class="block max-w-full truncate">
							{columnLabel(column.id)}
						</span>
					</DropdownMenu.CheckboxItem>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
							<Table.Head
								colspan={header.colSpan}
								class={(header.column.columnDef.meta as ColumnMeta | undefined)?.headClass}
							>
								{#if !header.isPlaceholder}
									<FlexRender content={header.column.columnDef.header} context={header.getContext()} />
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#if loading}
					{#each loadingRows as name, index (`loading-${name}-${index}`)}
						<Table.Row>
							<Table.Cell class="font-medium">{name}</Table.Cell>
							<Table.Cell><Skeleton class="h-5 w-8" /></Table.Cell>
							<Table.Cell class="text-right">
								<Skeleton class="ml-auto h-5 w-6" />
							</Table.Cell>
							<Table.Cell class="text-right">
								<Skeleton class="ml-auto h-5 w-12" />
							</Table.Cell>
							<Table.Cell class="text-right">
								<Skeleton class="ml-auto h-5 w-6" />
							</Table.Cell>
							<Table.Cell class="text-right">
								<Skeleton class="ml-auto h-5 w-16" />
							</Table.Cell>
						</Table.Row>
					{/each}
				{:else}
					{#each table.getRowModel().rows as row (row.id)}
						<Table.Row>
							{#each row.getVisibleCells() as cell (cell.id)}
								<Table.Cell class={(cell.column.columnDef.meta as ColumnMeta | undefined)?.cellClass}>
									<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
								</Table.Cell>
							{/each}
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={table.getVisibleLeafColumns().length} class="h-24 text-center">
								No results.
							</Table.Cell>
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>

	<div class="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
		<p class="text-muted-foreground">
			Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} filtered
			table{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
		</p>

		<div class="flex items-center gap-2 sm:ml-auto">
			<Button
				variant="outline"
				size="sm"
				onclick={() => table.previousPage()}
				disabled={!table.getCanPreviousPage()}
			>
				Previous
			</Button>
			<Button
				variant="outline"
				size="sm"
				onclick={() => table.nextPage()}
				disabled={!table.getCanNextPage()}
			>
				Next
			</Button>
		</div>
	</div>
</div>
