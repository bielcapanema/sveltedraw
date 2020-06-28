<script>
  export let elementType;

  const menuItems = [
    { value: 'rectangle', children: 'Rectangle' },
    { value: 'ellipse', children: 'Ellipse' },
    { value: 'arrow', children: 'Arrow' },
    { value: 'text', children: 'Text' },
    { value: 'selection', children: 'Selection' },
  ];
</script>

<div class="menu">
  {#each menuItems as menuItem (menuItem.value)}
    <label>
      <input type="radio" value="{menuItem.value}" bind:group="{elementType}" />
      {menuItem.children}
    </label>
  {/each}
  <slot />
</div>

<style>
  .menu {
    margin: 0 auto;
    text-align: center;
  }
</style>
