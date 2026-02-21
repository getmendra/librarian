/** Minimal S3 GET using AWS Signature V4 with Web Crypto API. No dependencies. */

export interface S3Credentials {
	accessKeyId: string;
	secretAccessKey: string;
	endpoint: string;
	region: string;
}

export async function s3Get(
	bucket: string,
	key: string,
	creds: S3Credentials
): Promise<Response> {
	const url = new URL(`/${bucket}/${key}`, creds.endpoint);
	const date = new Date();
	const dateStamp = date.toISOString().replace(/[-:]/g, '').slice(0, 8);
	const amzDate = dateStamp + 'T' + date.toISOString().replace(/[-:]/g, '').slice(9, 15) + 'Z';
	const service = 's3';

	const headers: Record<string, string> = {
		host: url.host,
		'x-amz-date': amzDate,
		'x-amz-content-sha256': 'UNSIGNED-PAYLOAD'
	};

	// Canonical request
	const signedHeaderKeys = Object.keys(headers).sort();
	const signedHeaders = signedHeaderKeys.join(';');
	const canonicalHeaders = signedHeaderKeys.map((k) => `${k}:${headers[k]}\n`).join('');
	const canonicalRequest = [
		'GET',
		url.pathname,
		url.search.slice(1), // query string without ?
		canonicalHeaders,
		signedHeaders,
		'UNSIGNED-PAYLOAD'
	].join('\n');

	// String to sign
	const scope = `${dateStamp}/${creds.region}/${service}/aws4_request`;
	const stringToSign = [
		'AWS4-HMAC-SHA256',
		amzDate,
		scope,
		await sha256Hex(canonicalRequest)
	].join('\n');

	// Signing key
	const kDate = await hmac(`AWS4${creds.secretAccessKey}`, dateStamp);
	const kRegion = await hmac(kDate, creds.region);
	const kService = await hmac(kRegion, service);
	const kSigning = await hmac(kService, 'aws4_request');
	const signature = await hmacHex(kSigning, stringToSign);

	headers['authorization'] =
		`AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

	return fetch(url.toString(), { headers });
}

async function hmac(
	key: string | ArrayBuffer,
	data: string
): Promise<ArrayBuffer> {
	const keyBuf = typeof key === 'string' ? new TextEncoder().encode(key) : key;
	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		keyBuf,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
}

async function hmacHex(key: ArrayBuffer, data: string): Promise<string> {
	const buf = await hmac(key, data);
	return hex(buf);
}

async function sha256Hex(data: string): Promise<string> {
	const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
	return hex(buf);
}

function hex(buf: ArrayBuffer): string {
	return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
