<script>
  import rough from 'roughjs/bin/rough';
  import { onMount } from 'svelte';
  import {
    getElementAbsoluteX1,
    getElementAbsoluteX2,
    getElementAbsoluteY1,
    getElementAbsoluteY2,
    newElement,
    rotate,
    isInsideAnElement,
  } from '../canvas/utils.js';
  import Menu from './Menu.svelte';
  import Export from './Export.svelte';

  let handleDrawing,
    screenWidth,
    screenHeight,
    context,
    canvas,
    generator,
    exportAsPNG,
    rc;

  let draggingElement = null;
  let elementType = 'selection';
  let elements = [];

  function clearSelection() {
    elements.forEach(element => {
      element.isSelected = false;
    });
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

  onMount(() => {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;

    canvas = document.getElementById('canvas');
    rc = rough.canvas(canvas);
    context = canvas.getContext('2d');
    generator = rough.generator();

    context.translate(0.5, 0.5);

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
          element.type !== 'selection' &&
          selectionX1 <= elementX1 &&
          selectionY1 <= elementY1 &&
          selectionX2 >= elementX2 &&
          selectionY2 >= elementY2;
      });
    }

    function generateDraw(element) {
      if (element.type === 'selection') {
        element.draw = (rc, context) => {
          const fillStyle = context.fillStyle;
          context.fillStyle = 'rgba(0, 0, 255, 0.10)';
          context.fillRect(element.x, element.y, element.width, element.height);
          context.fillStyle = fillStyle;
        };
      } else if (element.type === 'rectangle') {
        const shape = generator.rectangle(0, 0, element.width, element.height);
        element.draw = (rc, context) => {
          context.translate(element.x, element.y);
          rc.draw(shape);
          context.translate(-element.x, -element.y);
        };
      } else if (element.type === 'ellipse') {
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
      } else if (element.type === 'arrow') {
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
          generator.line(x4, y4, x2, y2),
        ];

        element.draw = (rc, context) => {
          context.translate(element.x, element.y);
          shapes.forEach(shape => rc.draw(shape));
          context.translate(-element.x, -element.y);
        };
        return;
      } else if (element.type === 'text') {
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
        throw new Error('Unimplemented type ' + element.type);
      }
    }

    handleDrawing = e => {
      const x = e.clientX - e.target.offsetLeft;
      const y = e.clientY - e.target.offsetTop;
      const element = newElement(elementType, x, y);
      let isDraggingElements = false;
      const cursorStyle = document.documentElement.style.cursor;
      if (elementType === 'selection') {
        const selectedElement = elements.find(element => {
          const isSelected = isInsideAnElement(x, y)(element);
          if (isSelected) {
            element.isSelected = true;
          }
          return isSelected;
        });

        if (selectedElement) {
          draggingElement = selectedElement;
        } else {
          clearSelection();
        }

        isDraggingElements = elements.some(element => element.isSelected);

        if (isDraggingElements) {
          document.documentElement.style.cursor = 'move';
        }
      } else {
        if (elementType === 'text') {
          const text = prompt('What text do you want?');
          if (text === null) {
            return;
          }
          element.text = text;
          element.font = '20px Virgil';
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
        if (elementType === 'text') {
          draggingElement = null;
          elementType = 'selection';
          element.isSelected = true;
        } else {
          draggingElement = element;
        }
      }

      let lastX = x;
      let lastY = y;

      const onMouseMove = e => {
        if (isDraggingElements) {
          const selectedElements = elements.filter(el => el.isSelected);
          if (selectedElements.length) {
            const x = e.clientX - e.target.offsetLeft;
            const y = e.clientY - e.target.offsetTop;
            selectedElements.forEach(element => {
              element.x += x - lastX;
              element.y += y - lastY;
            });
            lastX = x;
            lastY = y;
            drawScene();
            return;
          }
        }

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

        if (elementType === 'selection') {
          setSelection(draggingElementTemp);
        }
        drawScene();
      };

      const onMouseUp = e => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        document.documentElement.style.cursor = cursorStyle;

        if (draggingElement === null) {
          clearSelection();
          drawScene();
          return;
        }

        if (elementType === 'selection') {
          if (isDraggingElements) {
            isDraggingElements = false;
          }
          // elements.pop();
        } else {
          draggingElement.isSelected = true;
        }

        draggingElement = null;
        elementType = 'selection';

        drawScene();
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      drawScene();
    };

    function onKeyDown(event) {
      if (event.key === 'Backspace' && event.target.nodeName !== 'INPUT') {
        for (var i = elements.length - 1; i >= 0; --i) {
          if (elements[i].isSelected) {
            elements.splice(i, 1);
          }
        }
        drawScene();
        event.preventDefault();
      } else if (
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight' ||
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown'
      ) {
        const step = event.shiftKey ? 5 : 1;
        elements.forEach(element => {
          if (element.isSelected) {
            if (event.key === 'ArrowLeft') element.x -= step;
            else if (event.key === 'ArrowRight') element.x += step;
            else if (event.key === 'ArrowUp') element.y -= step;
            else if (event.key === 'ArrowDown') element.y += step;
          }
        });
        drawScene();
        event.preventDefault();
      }
    }

    canvas.addEventListener('mousedown', handleDrawing);
    document.addEventListener('keydown', onKeyDown, false);
  });
</script>

<Menu bind:elementType>
  <Export {elements} {clearSelection} {drawScene} />
</Menu>

<canvas id="canvas" width="{screenWidth}" height="{screenHeight}"></canvas>
