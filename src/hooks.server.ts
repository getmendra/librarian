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
				jwtAudiencePrefix: getJwtAudiencePrefix(
					event.request.headers.get("cf-access-jwt-assertion"),
				),
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

function getJwtAudiencePrefix(token: string | null): string | undefined {
	if (!token) return undefined;

	try {
		const encodedPayload = token.split(".")[1];
		if (!encodedPayload) return "invalid";

		const base64 = encodedPayload.replaceAll("-", "+").replaceAll("_", "/");
		const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
		const claims = JSON.parse(atob(padded)) as { aud?: unknown };
		const audience = Array.isArray(claims.aud) ? claims.aud[0] : claims.aud;

		return typeof audience === "string" ? audience.slice(0, 24) : "missing";
	} catch {
		return "invalid";
	}
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
