import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { validateAccess } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	if (!dev) {
		try {
			await validateAccess(event.request);
		} catch {
			return new Response('Forbidden', { status: 403 });
		}
	}

	return resolve(event);
};
