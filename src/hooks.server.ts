import type { Handle } from "@sveltejs/kit";
import { dev } from "$app/environment";

export const handle: Handle = async ({ event, resolve }) => {
	const ctx = event.platform?.ctx;

	if (!dev && !ctx?.access) {
		console.error("cloudflare-access-context-missing", {
			request: {
				host: event.url.host,
				method: event.request.method,
				pathname: event.url.pathname,
			},
			accessHeaders: {
				authenticatedUserEmail: event.request.headers.has("cf-access-authenticated-user-email"),
				authorizationCookie: hasCookie(event.request.headers.get("cookie"), "CF_Authorization"),
				jwtAssertion: event.request.headers.has("cf-access-jwt-assertion"),
			},
			context: inspectContext(ctx),
		});

		return new Response("Forbidden", { status: 403 });
	}

	return resolve(event);
};

function hasCookie(header: string | null, name: string): boolean {
	return header?.split(";").some((cookie) => cookie.trimStart().startsWith(`${name}=`)) ?? false;
}

function inspectContext(ctx: ExecutionContext | undefined) {
	if (!ctx) return { present: false };

	try {
		const prototype = Object.getPrototypeOf(ctx) as object | null;

		return {
			present: true,
			accessInContext: "access" in ctx,
			constructorName: ctx.constructor?.name,
			ownKeys: Reflect.ownKeys(ctx).map(String),
			prototypeKeys: prototype ? Reflect.ownKeys(prototype).map(String) : [],
		};
	} catch (error) {
		return {
			present: true,
			inspectionError: error instanceof Error ? error.message : String(error),
		};
	}
}
