import app from "./.svelte-kit/cloudflare/_worker.js";

export default {
	fetch(request, env, ctx) {
		const access = ctx.access;

		console.error("cloudflare-access-entry-context", {
			accessDefined: access !== undefined,
			accessIsNull: access === null,
			accessType: typeof access,
			contextConstructor: ctx.constructor.name,
		});

		return app.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
