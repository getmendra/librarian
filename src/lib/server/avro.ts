/**
 * Minimal Avro container file reader using only Web APIs.
 * Supports codecs: null, deflate. Handles the subset of Avro types
 * found in Iceberg manifest list files.
 */

export interface AvroRecord {
	[key: string]: unknown;
}

interface AvroField {
	name: string;
	type: AvroType;
}

type AvroType =
	| string
	| { type: 'array'; items: AvroType }
	| { type: 'map'; values: AvroType }
	| { type: 'record'; fields: AvroField[] }
	| { type: 'fixed'; size: number }
	| AvroType[]; // union

class AvroReader {
	private buf: Uint8Array;
	private pos = 0;

	constructor(buf: Uint8Array) {
		this.buf = buf;
	}

	readByte(): number {
		return this.buf[this.pos++];
	}

	readBytes(n: number): Uint8Array {
		const slice = this.buf.slice(this.pos, this.pos + n);
		this.pos += n;
		return slice;
	}

	/** Zigzag-decoded variable-length long */
	readLong(): number {
		let n = 0;
		let shift = 0;
		let b: number;
		do {
			b = this.buf[this.pos++];
			n |= (b & 0x7f) << shift;
			shift += 7;
		} while (b & 0x80);
		// Zigzag decode
		return (n >>> 1) ^ -(n & 1);
	}

	readInt(): number {
		return this.readLong();
	}

	readFloat(): number {
		const view = new DataView(this.buf.buffer, this.buf.byteOffset + this.pos, 4);
		this.pos += 4;
		return view.getFloat32(0, true);
	}

	readDouble(): number {
		const view = new DataView(this.buf.buffer, this.buf.byteOffset + this.pos, 8);
		this.pos += 8;
		return view.getFloat64(0, true);
	}

	readBoolean(): boolean {
		return this.readByte() !== 0;
	}

	readString(): string {
		const len = this.readLong();
		const bytes = this.readBytes(len);
		return new TextDecoder().decode(bytes);
	}

	readBytesValue(): Uint8Array {
		const len = this.readLong();
		return this.readBytes(len);
	}

	readFixed(size: number): Uint8Array {
		return this.readBytes(size);
	}

	skip(type: AvroType): void {
		if (typeof type === 'string') {
			switch (type) {
				case 'null':
					break;
				case 'boolean':
					this.pos++;
					break;
				case 'int':
				case 'long':
					this.readLong();
					break;
				case 'float':
					this.pos += 4;
					break;
				case 'double':
					this.pos += 8;
					break;
				case 'string':
				case 'bytes':
					this.pos += this.readLong();
					break;
			}
		} else if (Array.isArray(type)) {
			const idx = this.readLong();
			if (idx >= 0 && idx < type.length && type[idx] !== 'null') {
				this.skip(type[idx]);
			} else if (idx < 0 || idx >= type.length) {
				throw new Error(`Union index ${idx} out of range for type ${JSON.stringify(type)} at pos ${this.pos}`);
			}
		} else if (type.type === 'array') {
			let count = this.readLong();
			while (count !== 0) {
				if (count < 0) {
					count = -count;
					this.readLong(); // block byte size
				}
				for (let i = 0; i < count; i++) {
					this.skip(type.items);
				}
				count = this.readLong();
			}
		} else if (type.type === 'map') {
			let count = this.readLong();
			while (count !== 0) {
				if (count < 0) {
					count = -count;
					this.readLong();
				}
				for (let i = 0; i < count; i++) {
					this.readString(); // key
					this.skip(type.values);
				}
				count = this.readLong();
			}
		} else if (type.type === 'record') {
			for (const field of type.fields) {
				this.skip(field.type);
			}
		} else if (type.type === 'fixed') {
			this.pos += type.size;
		}
	}

	readValue(type: AvroType): unknown {
		if (typeof type === 'string') {
			switch (type) {
				case 'null':
					return null;
				case 'boolean':
					return this.readBoolean();
				case 'int':
					return this.readInt();
				case 'long':
					return this.readLong();
				case 'float':
					return this.readFloat();
				case 'double':
					return this.readDouble();
				case 'string':
					return this.readString();
				case 'bytes':
					return this.readBytesValue();
			}
		} else if (Array.isArray(type)) {
			// Union
			const idx = this.readLong();
			return this.readValue(type[idx]);
		} else if (type.type === 'array') {
			const result: unknown[] = [];
			let count = this.readLong();
			while (count !== 0) {
				if (count < 0) {
					count = -count;
					this.readLong();
				}
				for (let i = 0; i < count; i++) {
					result.push(this.readValue(type.items));
				}
				count = this.readLong();
			}
			return result;
		} else if (type.type === 'map') {
			const result: Record<string, unknown> = {};
			let count = this.readLong();
			while (count !== 0) {
				if (count < 0) {
					count = -count;
					this.readLong();
				}
				for (let i = 0; i < count; i++) {
					const key = this.readString();
					result[key] = this.readValue(type.values);
				}
				count = this.readLong();
			}
			return result;
		} else if (type.type === 'record') {
			const result: AvroRecord = {};
			for (const field of type.fields) {
				result[field.name] = this.readValue(field.type);
			}
			return result;
		} else if (type.type === 'fixed') {
			return this.readFixed(type.size);
		}
		return null;
	}

	get remaining(): number {
		return this.buf.length - this.pos;
	}
}

/** Normalize a JSON schema type into our AvroType representation */
function normalizeType(schema: unknown): AvroType {
	if (typeof schema === 'string') return schema;
	if (Array.isArray(schema)) return schema.map(normalizeType);
	const s = schema as Record<string, unknown>;
	const primitives = new Set([
		'null', 'boolean', 'int', 'long', 'float', 'double', 'string', 'bytes'
	]);
	if (primitives.has(s.type as string) && Object.keys(s).length <= 2) {
		// {"type": "string"} or {"type": "long", "logicalType": "..."} → bare primitive
		return s.type as string;
	}
	switch (s.type) {
		case 'array':
			return { type: 'array', items: normalizeType(s.items) };
		case 'map':
			return { type: 'map', values: normalizeType(s.values) };
		case 'fixed':
			return { type: 'fixed', size: s.size as number };
		case 'record':
			return {
				type: 'record',
				fields: (s.fields as Array<{ name: string; type: unknown }>).map((f) => ({
					name: f.name,
					type: normalizeType(f.type)
				}))
			};
		case 'enum':
			return 'int';
		default:
			return 'null';
	}
}

/**
 * Parse an Avro container file, reading only the specified fields.
 * Fields not in `wantFields` are skipped efficiently.
 */
export async function parseAvro(
	data: Uint8Array,
	wantFields?: Set<string>
): Promise<AvroRecord[]> {
	const reader = new AvroReader(data);

	// Magic: "Obj\x01"
	const magic = reader.readBytes(4);
	if (magic[0] !== 0x4f || magic[1] !== 0x62 || magic[2] !== 0x6a || magic[3] !== 1) {
		throw new Error('Not an Avro container file');
	}

	// File metadata (map of string -> bytes)
	const meta: Record<string, Uint8Array> = {};
	let count = reader.readLong();
	while (count !== 0) {
		if (count < 0) {
			count = -count;
			reader.readLong();
		}
		for (let i = 0; i < count; i++) {
			const key = reader.readString();
			meta[key] = reader.readBytesValue();
		}
		count = reader.readLong();
	}

	reader.readBytes(16); // sync marker
	const codec = meta['avro.codec'] ? new TextDecoder().decode(meta['avro.codec']) : 'null';
	const schemaJson = JSON.parse(new TextDecoder().decode(meta['avro.schema']));
	// Build field list from schema
	const fields: AvroField[] = (
		schemaJson.fields as Array<{ name: string; type: unknown }>
	).map((f) => ({
		name: f.name,
		type: normalizeType(f.type)
	}));

	const records: AvroRecord[] = [];

	// Read data blocks
	while (reader.remaining > 0) {
		const objectCount = reader.readLong();
		const blockSize = reader.readLong();
		let blockData = reader.readBytes(blockSize);

		// Decompress if needed
		if (codec === 'deflate') {
			const ds = new DecompressionStream('deflate-raw');
			const writer = ds.writable.getWriter();
			writer.write(blockData as ArrayBufferView<ArrayBuffer>);
			writer.close();
			blockData = new Uint8Array(await new Response(ds.readable).arrayBuffer());
		}

		const blockReader = new AvroReader(blockData);

		for (let i = 0; i < objectCount; i++) {
			const record: AvroRecord = {};
			for (const field of fields) {
				if (!wantFields || wantFields.has(field.name)) {
					record[field.name] = blockReader.readValue(field.type);
				} else {
					blockReader.readValue(field.type); // skip by reading and discarding
				}
			}
			records.push(record);
		}

		// Sync marker
		reader.readBytes(16);
	}

	return records;
}
