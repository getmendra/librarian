import type { PageServerLoad } from './$types';
import { NAMESPACE_SUFFIX_ORDER } from '$env/static/private';
import { listNamespaces } from '$lib/server/iceberg';

const namespaceCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function parseNamespaceSuffixOrder(value: string): Map<string, number> {
	if (!value) return new Map();

	return new Map(
		value
			.split(',')
			.map((part) => part.trim().toLowerCase())
			.filter(Boolean)
			.map((part, index) => [part, index] as const)
	);
}

function getOrderedSuffixPart(
	segment: string,
	namespaceSuffixOrder: Map<string, number>
): { base: string; order: number } | null {
	if (namespaceSuffixOrder.size === 0) return null;

	const separatorIndex = segment.lastIndexOf('_');
	if (separatorIndex <= 0) return null;

	const suffix = segment.slice(separatorIndex + 1).toLowerCase();
	const order = namespaceSuffixOrder.get(suffix);
	if (order === undefined) return null;

	return {
		base: segment.slice(0, separatorIndex),
		order
	};
}

function compareNamespaceSegment(a: string, b: string, namespaceSuffixOrder: Map<string, number>): number {
	const orderedA = getOrderedSuffixPart(a, namespaceSuffixOrder);
	const orderedB = getOrderedSuffixPart(b, namespaceSuffixOrder);

	if (orderedA && orderedB) {
		const baseResult = namespaceCollator.compare(orderedA.base, orderedB.base);
		if (baseResult !== 0) return baseResult;
		return orderedA.order - orderedB.order;
	}

	return namespaceCollator.compare(a, b);
}

function compareNamespaces(
	a: string[],
	b: string[],
	namespaceSuffixOrder: Map<string, number>
): number {
	const length = Math.min(a.length, b.length);

	for (let i = 0; i < length; i += 1) {
		const isFinalSegment = i === a.length - 1 && i === b.length - 1;
		const result = isFinalSegment
			? compareNamespaceSegment(a[i], b[i], namespaceSuffixOrder)
			: namespaceCollator.compare(a[i], b[i]);
		if (result !== 0) return result;
	}

	return a.length - b.length;
}

export const load: PageServerLoad = async () => {
	const { namespaces } = await listNamespaces();
	const namespaceSuffixOrder = parseNamespaceSuffixOrder(NAMESPACE_SUFFIX_ORDER);
	return {
		namespaces: [...namespaces].sort((a, b) => compareNamespaces(a, b, namespaceSuffixOrder))
	};
};
