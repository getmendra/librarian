import { readFileSync, writeFileSync } from "node:fs";
import type { Plugin } from "vite";

const workerPath = ".svelte-kit/cloudflare/_worker.js";

export function cloudflareAccessProbe(): Plugin {
	let serverBuild = false;

	return {
		name: "cloudflare-access-probe",
		apply: "build",
		configResolved(config) {
			serverBuild = Boolean(config.build.ssr);
		},
		closeBundle: {
			order: "post",
			handler() {
				if (!serverBuild) return;

				const worker = readFileSync(workerPath, "utf8");
				const fetchStart = /(\n\s*async fetch\(req, env\d*, ctx\) \{\n)/;

				if (!fetchStart.test(worker)) {
					throw new Error(`Could not find the fetch entrypoint in ${workerPath}`);
				}

				const instrumented = worker.replace(
					fetchStart,
					`$1    const access = ctx.access;
    console.error("cloudflare-access-entry-context", {
      accessDefined: access !== undefined,
      accessIsNull: access === null,
      accessType: typeof access,
      contextConstructor: ctx.constructor.name
    });
`,
				);

				writeFileSync(workerPath, instrumented);
			},
		},
	};
}
