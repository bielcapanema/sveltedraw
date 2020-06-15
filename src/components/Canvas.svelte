<script>
  import rough from "roughjs/bin/rough";
  import { onMount } from 'svelte';
  import {
    getElementAbsoluteX1,
    getElementAbsoluteX2,
    getElementAbsoluteY1,
    getElementAbsoluteY2,
    newElement,
    rotate,
  } from '../canvas/utils.js'

  let handleDrawing,
    screenWidth,
    screenHeight,
    context,
    canvas,
    generator,
    rc;

  let draggingElement = null;
  let elementType = "selection";

  onMount(() => {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;

    let elements = [];
    
    canvas = document.getElementById("canvas");
    rc = rough.canvas(canvas);
    context = canvas.getContext("2d");
    generator = rough.generator();

    function clearSelection() {
      elements.forEach(element => {
        element.isSelected = false;
      });
    }

    function setSelection(selection) {
      const selectionX1 = getElementAbsoluteX1(selection);
      const selectionX2 = getElementAbsoluteX2(selection);
      const selectionY1 = getElementAbsoluteY1(selection);
      const selectionY2 = getElementAbsoluteY2(selection);
      elements.forEach(element => {
        const elementX1 = getElementAbsoluteX1(element);
        const elementX2 = getElementAbsoluteX2(element);
        const elementY1 = getElementAbsoluteY1(element);
        const elementY2 = getElementAbsoluteY2(element);
        element.isSelected =
          element.type !== "selection" &&
          selectionX1 <= elementX1 &&
          selectionY1 <= elementY1 &&
          selectionX2 >= elementX2 &&
          selectionY2 >= elementY2;
      });
    }

    function generateDraw(element) {
      if (element.type === "selection") {
        element.draw = (rc, context) => {
          const fillStyle = context.fillStyle;
          context.fillStyle = "rgba(0, 0, 255, 0.10)";
          context.fillRect(element.x, element.y, element.width, element.height);
          context.fillStyle = fillStyle;
        };
      } else if (element.type === "rectangle") {
        const shape = generator.rectangle(0, 0, element.width, element.height);
        element.draw = (rc, context) => {
          context.translate(element.x, element.y);
          rc.draw(shape);
          context.translate(-element.x, -element.y);
        };
      } else if (element.type === "ellipse") {
        const shape = generator.ellipse(
          element.width / 2,
          element.height / 2,
          element.width,
          element.height
        );
        element.draw = (rc, context) => {
          context.translate(element.x, element.y);
          rc.draw(shape);
          context.translate(-element.x, -element.y);
        };
      } else if (element.type === "arrow") {
        const x1 = 0;
        const y1 = 0;
        const x2 = element.width;
        const y2 = element.height;

        const size = 30; // pixels
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        // Scale down the arrow until we hit a certain size so that it doesn't look weird
        const minSize = Math.min(size, distance / 2);
        const xs = x2 - ((x2 - x1) / distance) * minSize;
        const ys = y2 - ((y2 - y1) / distance) * minSize;

        const angle = 20; // degrees
        const [x3, y3] = rotate(xs, ys, x2, y2, (-angle * Math.PI) / 180);
        const [x4, y4] = rotate(xs, ys, x2, y2, (angle * Math.PI) / 180);

        const shapes = [
          //    \
          generator.line(x3, y3, x2, y2),
          // -----
          generator.line(x1, y1, x2, y2),
          //    /
          generator.line(x4, y4, x2, y2)
        ];

        element.draw = (rc, context) => {
          context.translate(element.x, element.y);
          shapes.forEach(shape => rc.draw(shape));
          context.translate(-element.x, -element.y);
        };
        return;
      } else if (element.type === "text") {
        element.draw = (rc, context) => {
          const font = context.font;
          context.font = element.font;
          context.fillText(
            element.text,
            element.x,
            element.y + element.measure.actualBoundingBoxAscent
          );
          context.font = font;
        };
      } else {
        throw new Error("Unimplemented type " + element.type);
      }
    }
    
    function drawScene() {
      context.clearRect(-0.5, -0.5, canvas.width, canvas.height);

      elements.forEach(element => {
        element.draw(rc, context);
        if (element.isSelected) {
          const margin = 4;

          const elementX1 = getElementAbsoluteX1(element);
          const elementX2 = getElementAbsoluteX2(element);
          const elementY1 = getElementAbsoluteY1(element);
          const elementY2 = getElementAbsoluteY2(element);
          const lineDash = context.getLineDash();
          context.setLineDash([8, 4]);
          context.strokeRect(
            elementX1 - margin,
            elementY1 - margin,
            elementX2 - elementX1 + margin * 2,
            elementY2 - elementY1 + margin * 2
          );
          context.setLineDash(lineDash);
        }
      });
    }

    handleDrawing = (e) => {
      const x = e.clientX - e.target.offsetLeft;
      const y = e.clientY - e.target.offsetTop;
      const element = newElement(elementType, x, y);

      if (elementType === "text") {
        const text = prompt("What text do you want?");
        if (text === null) {
          return;
        }
        element.text = text;
        element.font = "20px Virgil";
        const font = context.font;
        context.font = element.font;
        element.measure = context.measureText(element.text);
        context.font = font;
        const height =
          element.measure.actualBoundingBoxAscent +
          element.measure.actualBoundingBoxDescent;
        // Center the text
        element.x -= element.measure.width / 2;
        element.y -= element.measure.actualBoundingBoxAscent;
        element.width = element.measure.width;
        element.height = height;
      }

      generateDraw(element);
      elements.push(element);
      if (elementType === "text") {
        draggingElement = null;
        elementType = "selection";
        element.isSelected = true;
      } else {
        draggingElement = element;
        // elementType = undefined;
      }

      const onMouseMove = (e) => {
        // It is very important to read this.state within each move event,
        // otherwise we would read a stale one!
        const draggingElementTemp = draggingElement;
        if (!draggingElementTemp) return;
        let width = e.clientX - e.target.offsetLeft - draggingElementTemp.x;
        let height = e.clientY - e.target.offsetTop - draggingElementTemp.y;
        draggingElementTemp.width = width;
        // Make a perfect square or circle when shift is enabled
        draggingElementTemp.height = e.shiftKey ? width : height;

        generateDraw(draggingElementTemp);

        if (elementType === "selection") {
          setSelection(draggingElementTemp);
        }
        drawScene();
      };

      const onMouseUp = e => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);

        const draggingElementTemp = draggingElement;
        if (draggingElementTemp === null) {
          return;
        }
        if (elementType === "selection") {
          // Remove actual selection element
          elements.pop();
          setSelection(draggingElementTemp);
        } else {
          draggingElementTemp.isSelected = true;
        }

        draggingElement = null;
        elementType = "selection";

        drawScene();
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);

      drawScene();
    }

    canvas.addEventListener('mousedown', handleDrawing)
  });

  const menuItems = [
    { value: "rectangle", children: "Rectangle" },
    { value: "ellipse", children: "Ellipse" },
    { value: "arrow", children: "Arrow" },
    { value: "text", children: "Text" },
    { value: "selection", children: "Selection" },
  ];
</script>

<div class="menu">
  {#each menuItems as menuItem (menuItem.value)}
    <label>
      <input
        type="radio"
        value={menuItem.value}
        bind:group={elementType}
      />
      {menuItem.children}
    </label>
  {/each}
</div>

<canvas
  id="canvas"
  width={screenWidth}
  height={screenHeight}
/>

<style>
  .menu {
    margin: 0 auto;
    text-align: center;
  }
</style>