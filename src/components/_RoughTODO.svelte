<script>
  import { onMount } from 'svelte';
  import rough from "roughjs/bin/rough";

  onMount(() => {
		const rc = rough.canvas(document.getElementById('canvas'));

    rc.rectangle(10, 10, 100, 100, {
      fill: 'red',
      stroke: 'blue',
      hachureAngle: 60,
      hachureGap: 10,
      fillWeight: 5,
      strokeWidth: 5
    });
	});
</script>
<style>
  canvas {
    width: 100%;
    height: 100%;
  }
</style>

<canvas id="canvas"></canvas>