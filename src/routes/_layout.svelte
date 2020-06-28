<script>
  import Nav from '../components/Nav.svelte';
  import GitHubCorner from '../components/GitHubCorner.svelte';

  export let segment;
  const a = 'testes';
</script>

<GitHubCorner />

<Nav {segment} />

<main>
  <slot />
</main>

<style>
  main {
    height: 100%;
  }
</style>
