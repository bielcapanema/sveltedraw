<script>
  import { menuItems } from '../canvas/utils';
  export let elementType;
</script>

<div class="menu">
  <fieldset>
    {#each menuItems as menuItem (menuItem.value)}
      <label>
        <input
          type="radio"
          value="{menuItem.value}"
          bind:group="{elementType}"
        />
        {menuItem.children}
      </label>
    {/each}
  </fieldset>
  <fieldset>
    <slot />
  </fieldset>
</div>

<style>
  .menu {
    margin: 0 auto;
    text-align: center;
  }
</style>
