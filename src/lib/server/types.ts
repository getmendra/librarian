/** Iceberg REST API response types (read-only subset) */

export interface StructField {
	id: number;
	name: string;
	required: boolean;
	type: IcebergType;
	doc?: string;
}

export type IcebergType =
	| string // primitive: "boolean", "int", "long", "float", "double", "date", "time", "timestamp", "timestamptz", "string", "uuid", "binary", "decimal(p,s)", "fixed[l]"
	| { type: 'struct'; fields: StructField[] }
	| { type: 'list'; 'element-id': number; element: IcebergType; 'element-required': boolean }
	| { type: 'map'; 'key-id': number; key: IcebergType; 'value-id': number; value: IcebergType; 'value-required': boolean };

export interface Schema {
	type: 'struct';
	'schema-id': number;
	fields: StructField[];
	'identifier-field-ids'?: number[];
}

export interface PartitionField {
	'field-id': number;
	'source-id': number;
	transform: string;
	name: string;
}

export interface PartitionSpec {
	'spec-id': number;
	fields: PartitionField[];
}

export interface SortField {
	transform: string;
	'source-id': number;
	direction: string;
	'null-order': string;
}

export interface SortOrder {
	'order-id': number;
	fields: SortField[];
}

export interface Snapshot {
	'snapshot-id': number;
	'parent-snapshot-id'?: number;
	'sequence-number': number;
	'timestamp-ms': number;
	'manifest-list': string;
	summary: Record<string, string>;
	'schema-id': number;
	operation?: string;
}

export interface SnapshotRef {
	'snapshot-id': number;
	type: 'branch' | 'tag';
	'max-ref-age-ms'?: number;
	'max-snapshot-age-ms'?: number;
	'min-snapshots-to-keep'?: number;
}

export interface TableMetadata {
	'format-version': number;
	'table-uuid': string;
	location: string;
	'last-sequence-number'?: number;
	'last-updated-ms': number;
	'last-column-id': number;
	'current-schema-id': number;
	schemas: Schema[];
	'default-spec-id': number;
	'partition-specs': PartitionSpec[];
	'last-partition-id': number;
	'default-sort-order-id': number;
	'sort-orders': SortOrder[];
	properties: Record<string, string>;
	snapshots?: Snapshot[];
	refs?: Record<string, SnapshotRef>;
	'current-snapshot-id'?: number;
	'snapshot-log'?: { 'timestamp-ms': number; 'snapshot-id': number }[];
	'metadata-log'?: { 'timestamp-ms': number; 'metadata-file': string }[];
}

export interface LoadTableResponse {
	'metadata-location': string;
	metadata: TableMetadata;
	config?: Record<string, string>;
}

export interface ListNamespacesResponse {
	namespaces: string[][];
}

export interface GetNamespaceResponse {
	namespace: string[];
	properties: Record<string, string>;
}

export interface ListTablesResponse {
	identifiers: { namespace: string[]; name: string }[];
}
