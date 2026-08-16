import type { Handle } from "@sveltejs/kit";
import { dev } from "$app/environment";

export const handle: Handle = async ({ event, resolve }) => {
	if (!dev && !event.platform?.ctx.access) {
		return new Response("Forbidden", { status: 403 });
	}

	return resolve(event);
};
