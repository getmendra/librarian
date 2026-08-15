import { createColumnHelper, renderComponent } from "@tanstack/svelte-table";
import DataTableFormatCell from "./data-table-format-cell.svelte";
import type { DataTableFeatures } from "./data-table-features";
import DataTableNameCell from "./data-table-name-cell.svelte";
import DataTableSortButton from "./data-table-sort-button.svelte";

export type NamespaceTableRow = {
	name: string;
	formatVersion: number | null;
	lastUpdated: number | null;
	columns: number;
	totalRecords: number | null;
	totalDataFiles: number | null;
};

type ColumnMeta = {
	headClass?: string;
	cellClass?: string;
};

const columnHelper = createColumnHelper<DataTableFeatures, NamespaceTableRow>();

export function getColumns(namespace: string) {
	return columnHelper.columns([
		columnHelper.accessor("name", {
			header: ({ column }) =>
				renderComponent(DataTableSortButton, {
					label: "Name",
					onclick: column.getToggleSortingHandler(),
					sort: column.getIsSorted(),
				}),
			cell: ({ row }) =>
				renderComponent(DataTableNameCell, {
					namespace,
					name: row.original.name,
				}),
			enableHiding: false,
		}),
		columnHelper.accessor("formatVersion", {
			header: "Format",
			cell: ({ row }) =>
				renderComponent(DataTableFormatCell, {
					formatVersion: row.original.formatVersion,
				}),
			meta: {
				headClass: "w-24",
			} satisfies ColumnMeta,
		}),
		columnHelper.accessor("columns", {
			header: ({ column }) =>
				renderComponent(DataTableSortButton, {
					label: "Columns",
					onclick: column.getToggleSortingHandler(),
					sort: column.getIsSorted(),
				}),
			meta: {
				headClass: "w-24 text-right",
				cellClass: "text-right text-muted-foreground",
			} satisfies ColumnMeta,
		}),
		columnHelper.accessor("totalRecords", {
			header: ({ column }) =>
				renderComponent(DataTableSortButton, {
					label: "Records",
					onclick: column.getToggleSortingHandler(),
					class: "ml-auto",
					sort: column.getIsSorted(),
				}),
			cell: ({ row }) =>
				row.original.totalRecords != null
					? Number(row.original.totalRecords).toLocaleString()
					: "-",
			meta: {
				headClass: "w-32 text-right",
				cellClass: "text-right font-mono text-sm text-muted-foreground",
			} satisfies ColumnMeta,
		}),
		columnHelper.accessor("totalDataFiles", {
			header: ({ column }) =>
				renderComponent(DataTableSortButton, {
					label: "Files",
					onclick: column.getToggleSortingHandler(),
					class: "ml-auto",
					sort: column.getIsSorted(),
				}),
			cell: ({ row }) =>
				row.original.totalDataFiles != null
					? Number(row.original.totalDataFiles).toLocaleString()
					: "-",
			meta: {
				headClass: "w-24 text-right",
				cellClass: "text-right font-mono text-sm text-muted-foreground",
			} satisfies ColumnMeta,
		}),
		columnHelper.accessor("lastUpdated", {
			header: ({ column }) =>
				renderComponent(DataTableSortButton, {
					label: "Updated",
					onclick: column.getToggleSortingHandler(),
					class: "ml-auto",
					sort: column.getIsSorted(),
				}),
			cell: ({ row }) => timeAgo(row.original.lastUpdated),
			sortFn: "datetime",
			meta: {
				headClass: "w-32 text-right",
				cellClass: "text-right text-sm text-muted-foreground",
			} satisfies ColumnMeta,
		}),
	]);
}

function timeAgo(ms: number | null): string {
	if (!ms) return "-";
	const seconds = Math.floor((Date.now() - ms) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	const months = Math.floor(days / 30);
	return `${months}mo ago`;
}
