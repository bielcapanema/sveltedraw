<script>
	import Nav from '../components/Nav.svelte';
	import GitHubCorner from '../components/GitHubCorner.svelte';

	export let segment;
</script>

<style>
	main {
		height: 100%;
	}
</style>

<GitHubCorner />

<Nav {segment}/>

<main>
	<slot></slot>
</main>