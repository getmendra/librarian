<script lang="ts">
	let { namespace, name }: { namespace: string; name: string } = $props();
</script>

<a
	href={`/ns/${encodeURIComponent(namespace)}/table/${encodeURIComponent(name)}`}
	class="font-medium hover:underline"
>
	{name}
</a>
