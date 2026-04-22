import { z } from "zod";

export const tabSchema = z.object({
	tab: z.enum(["schema", "partitions", "snapshots", "properties"]).default("schema"),
});
