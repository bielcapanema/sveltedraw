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
    menuItems,
    getArrowPoints,
    hitTest,
  } from '../canvas/utils.js';
  import Menu from './Menu.svelte';
  import Export from './Export.svelte';

  let handleDrawing, screenWidth, screenHeight, context, canvas, generator, rc;

  let itemStrokeColor = '#000000';
  let itemBackgroundColor = '#ffffff';
  let viewBgColor = '#ffffff';
  let draggingElement = null;
  let elementType = 'selection';
  let elements = [];

  function clearSelection() {
    elements.forEach(element => {
      element.isSelected = false;
    });
  }

  function handleShortchuts(event) {
    const index = parseInt(event.key, 10) - 1;

    if (menuItems[index]) {
      elementType = menuItems[index].value;
    }
  }

  function deleteSelectedElements() {
    for (var i = elements.length - 1; i >= 0; --i) {
      if (elements[i].isSelected) {
        elements.splice(i, 1);
      }
    }
  }

  function generateDraw(element, itemStrokeColor, itemBackgroundColorColor) {
    const options = { stroke: itemStrokeColor, fill: itemBackgroundColorColor };
    if (element.type === 'selection') {
      element.draw = (rc, context) => {
        const fillStyle = context.fillStyle;
        context.fillStyle = 'rgba(0, 0, 255, 0.10)';
        context.fillRect(element.x, element.y, element.width, element.height);
        context.fillStyle = fillStyle;
      };
    } else if (element.type === 'rectangle') {
      const shape = generator.rectangle(
        0,
        0,
        element.width,
        element.height,
        options
      );
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
        element.height,
        options
      );
      element.draw = (rc, context) => {
        context.translate(element.x, element.y);
        rc.draw(shape);
        context.translate(-element.x, -element.y);
      };
    } else if (element.type === 'arrow') {
      const [x1, y1, x2, y2, x3, y3, x4, y4] = getArrowPoints(element);
      const shapes = [
        //    \
        generator.line(x3, y3, x2, y2, options),
        // -----
        generator.line(x1, y1, x2, y2, options),
        //    /
        generator.line(x4, y4, x2, y2, options),
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
          element.y + element.actualBoundingBoxAscent
        );
        context.font = font;
      };
    } else {
      throw new Error('Unimplemented type ' + element.type);
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

    handleDrawing = e => {
      const x = e.clientX - e.target.offsetLeft;
      const y = e.clientY - e.target.offsetTop;
      const element = newElement(elementType, x, y);
      let isDraggingElements = false;
      const cursorStyle = document.documentElement.style.cursor;
      if (elementType === 'selection') {
        const hitElement = elements.find(element => {
          return hitTest(element, x, y);
        });

        // If we click on something
        if (hitElement) {
          if (hitElement.isSelected) {
            // If that element is not already selected, do nothing,
            // we're likely going to drag it
          } else {
            // We unselect every other elements unless shift is pressed
            if (!e.shiftKey) {
              clearSelection();
            }
            // No matter what, we select it
            hitElement.isSelected = true;
          }
        } else {
          // If we don't click on anything, let's remove all the selected elements
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
          const {
            actualBoundingBoxAscent,
            actualBoundingBoxDescent,
            width,
          } = context.measureText(element.text);
          element.actualBoundingBoxAscent = actualBoundingBoxAscent;
          context.font = font;
          const height = actualBoundingBoxAscent + actualBoundingBoxDescent;
          // Center the text
          element.x -= width / 2;
          element.y -= actualBoundingBoxAscent;
          element.width = width;
          element.height = height;
        }

        generateDraw(element, itemStrokeColor, itemBackgroundColor);
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

        // It is very important to read within each move event,
        // otherwise we would read a stale one!
        const draggingElementTemp = draggingElement;
        if (!draggingElementTemp) return;
        let width = e.clientX - e.target.offsetLeft - draggingElementTemp.x;
        let height = e.clientY - e.target.offsetTop - draggingElementTemp.y;
        draggingElementTemp.width = width;
        // Make a perfect square or circle when shift is enabled
        draggingElementTemp.height = e.shiftKey ? width : height;

        generateDraw(draggingElementTemp, itemStrokeColor, itemBackgroundColor);

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
      if (event.target.nodeName === 'INPUT') {
        return;
      }

      if (event.key === 'Escape') {
        clearSelection();
        drawScene();
        event.preventDefault();
      } else if (event.key === 'Backspace') {
        deleteSelectedElements();
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
      } else if (event.key === 'a' && event.metaKey) {
        elements.forEach(element => {
          element.isSelected = true;
        });
        drawScene();
        event.preventDefault();
      } else {
        handleShortchuts(event);
      }
    }

    canvas.addEventListener('mousedown', handleDrawing);
    document.addEventListener('keydown', onKeyDown, false);
  });

  function cutHandler(e) {
    e.clipboardData.setData(
      'text/plain',
      JSON.stringify(elements.filter(element => element.isSelected))
    );
    deleteSelectedElements();
    drawScene();
    e.preventDefault();
  }

  function copyHandler(e) {
    e.clipboardData.setData(
      'text/plain',
      JSON.stringify(elements.filter(element => element.isSelected))
    );
    e.preventDefault();
  }

  function pasteHandler(e) {
    const paste = e.clipboardData.getData('text');
    let parsedElements;
    try {
      parsedElements = JSON.parse(paste);
    } catch (e) {}
    if (
      Array.isArray(parsedElements) &&
      parsedElements.length > 0 &&
      parsedElements[0].type
    ) {
      clearSelection();
      parsedElements.forEach(parsedElement => {
        parsedElement.x += 10;
        parsedElement.y += 10;
        generateDraw(parsedElement, itemStrokeColor, itemBackgroundColor);
        elements.push(parsedElement);
      });
      drawScene();
    }
    e.preventDefault();
  }
</script>

<div
  style="{{ backgroundColor: viewBgColor }}"
  on:cut="{cutHandler}"
  on:copy="{copyHandler}"
  on:paste="{pasteHandler}"
>
  <Menu bind:elementType>
    <Export
      bind:itemStrokeColor
      bind:itemBackgroundColor
      bind:viewBgColor
      {elements}
      {clearSelection}
      {drawScene}
    />
  </Menu>

  <canvas
    id="canvas"
    width="{screenWidth}"
    height="{screenHeight - 200}"
  ></canvas>
</div>
