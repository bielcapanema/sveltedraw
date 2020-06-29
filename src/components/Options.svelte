<script>
  import {
    getElementAbsoluteX1,
    getElementAbsoluteX2,
    getElementAbsoluteY1,
    getElementAbsoluteY2,
  } from '../canvas/utils.js';

  export let elements;
  export let clearSelection;
  export let drawScene;
  export let itemBackgroundColor;
  export let itemStrokeColor;
  export let viewBgColor;

  let exportBackground = false;
  let exportVisibleOnly = true;
  let exportPadding = 10;

  const exportAsPNG = ({
    exportBackground,
    exportVisibleOnly,
    exportPadding = 10,
    viewBgColor,
  }) => {
    if (!elements.length) return window.alert('Cannot export empty canvas.');

    clearSelection();
    drawScene();

    let subCanvasX1 = Infinity;
    let subCanvasX2 = 0;
    let subCanvasY1 = Infinity;
    let subCanvasY2 = 0;

    elements.forEach(element => {
      subCanvasX1 = Math.min(subCanvasX1, getElementAbsoluteX1(element));
      subCanvasX2 = Math.max(subCanvasX2, getElementAbsoluteX2(element));
      subCanvasY1 = Math.min(subCanvasY1, getElementAbsoluteY1(element));
      subCanvasY2 = Math.max(subCanvasY2, getElementAbsoluteY2(element));
    });

    // create temporary canvas from which we'll export
    const tempCanvas = document.createElement('canvas');
    const tempCanvasCtx = tempCanvas.getContext('2d');
    tempCanvas.style.display = 'none';
    document.body.appendChild(tempCanvas);
    tempCanvas.width = exportVisibleOnly
      ? subCanvasX2 - subCanvasX1 + exportPadding * 2
      : canvas.width;
    tempCanvas.height = exportVisibleOnly
      ? subCanvasY2 - subCanvasY1 + exportPadding * 2
      : canvas.height;

    if (exportBackground) {
      tempCanvasCtx.fillStyle = viewBgColor;
      tempCanvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // copy our original canvas onto the temp canvas
    tempCanvasCtx.drawImage(
      canvas, // source
      exportVisibleOnly // sx
        ? subCanvasX1 - exportPadding
        : 0,
      exportVisibleOnly // sy
        ? subCanvasY1 - exportPadding
        : 0,
      exportVisibleOnly // sWidth
        ? subCanvasX2 - subCanvasX1 + exportPadding * 2
        : canvas.width,
      exportVisibleOnly // sHeight
        ? subCanvasY2 - subCanvasY1 + exportPadding * 2
        : canvas.height,
      0, // dx
      0, // dy
      exportVisibleOnly ? tempCanvas.width : canvas.width, // dWidth
      exportVisibleOnly ? tempCanvas.height : canvas.height // dHeight
    );

    // create a temporary <a> elem which we'll use to download the image
    const link = document.createElement('a');
    link.setAttribute('download', 'excalibur.png');
    link.setAttribute('href', tempCanvas.toDataURL('image/png'));
    link.click();
    link.remove();
    if (tempCanvas !== canvas) tempCanvas.remove();
  };
</script>

<div class="exportWrapper">
  <button
    on:click="{() => {
      exportAsPNG({
        exportBackground,
        exportVisibleOnly,
        exportPadding,
        viewBgColor,
      });
    }}"
  >
    Export to png
  </button>
  <label>
    <input
      type="checkbox"
      checked="{exportBackground}"
      on:change="{e => {
        exportBackground = e.target.checked;
      }}"
    />
    background
  </label>
  <label>
    <input type="color" bind:value="{viewBgColor}" />
    {' '} view background color
  </label>
  <label>
    <input type="color" bind:value="{itemStrokeColor}" />
    {' '} item stroke color
  </label>
  <label>
    <input type="color" bind:value="{itemBackgroundColor}" />
    {' '} item background color
  </label>
  <label>
    <input
      type="checkbox"
      checked="{exportVisibleOnly}"
      onChange="{e => {
        exportVisibleOnly = e.target.checked;
      }}"
    />
    visible area only
  </label>
  (padding:
  <input
    type="number"
    bind:value="{exportPadding}"
    disabled="{!exportVisibleOnly}"
  />
  px)
</div>

<style>
  .exportWrapper {
    margin-bottom: 10px;
    display: flex;
    justify-content: center;
  }
  .exportWrapper label {
    display: flex;
    align-items: center;
    margin: 0 5px;
  }

  .exportWrapper button {
    margin-right: 10px;
  }

  .exportWrapper input[type='number'] {
    width: 40px;
    padding: 2px;
    margin-left: 10px;
  }
</style>
