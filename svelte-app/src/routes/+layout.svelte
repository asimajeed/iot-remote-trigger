<script lang="ts">
  import './layout.css';
  let { children } = $props();
</script>

<svelte:head>
  <title>House Control</title>
</svelte:head>

{@render children()}
