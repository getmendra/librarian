import { z } from "zod";

export const sortKeys = [
	"name",
	"columns",
	"totalRecords",
	"totalDataFiles",
	"lastUpdated",
] as const;

export type SortKey = (typeof sortKeys)[number];

export const namespaceTableSearchParamsSchema = z.object({
	q: z.string().default(""),
	sort: z.enum(["", ...sortKeys]).default(""),
	dir: z.enum(["asc", "desc"]).default("asc"),
});
