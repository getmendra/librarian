import { CF_ACCESS_TEAM, POLICY_AUD } from '$env/static/private';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const teamDomain = `https://${CF_ACCESS_TEAM}.cloudflareaccess.com`;
const jwks = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));

export async function validateAccess(request: Request): Promise<void> {
	const token =
		request.headers.get('Cf-Access-Jwt-Assertion') ??
		parseCookie(request.headers.get('cookie'), 'CF_Authorization');

	if (!token) {
		throw new Error('Missing CF Access token');
	}

	await jwtVerify(token, jwks, {
		audience: POLICY_AUD,
		issuer: teamDomain
	});
}

function parseCookie(header: string | null, name: string): string | null {
	if (!header) return null;
	const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
	return match ? match[1] : null;
}
