// If the element is created from right to left, the width is going to be negative
// This set of functions retrieves the absolute position of the 4 points.
// We can't just always normalize it since we need to remember the fact that an arrow
// is pointing left or right.
export function getElementAbsoluteX1(element) {
  return element.width >= 0 ? element.x : element.x + element.width;
}
export function getElementAbsoluteX2(element) {
  return element.width >= 0 ? element.x + element.width : element.x;
}
export function getElementAbsoluteY1(element) {
  return element.height >= 0 ? element.y : element.y + element.height;
}
export function getElementAbsoluteY2(element) {
  return element.height >= 0 ? element.y + element.height : element.y;
}

export function newElement(type, x, y, width = 0, height = 0) {
  const element = {
    type: type,
    x: x,
    y: y,
    width,
    height,
    isSelected: false
  };
  return element;
}

export function rotate(x1, y1, x2, y2, angle) {
  // 𝑎′𝑥=(𝑎𝑥−𝑐𝑥)cos𝜃−(𝑎𝑦−𝑐𝑦)sin𝜃+𝑐𝑥
  // 𝑎′𝑦=(𝑎𝑥−𝑐𝑥)sin𝜃+(𝑎𝑦−𝑐𝑦)cos𝜃+𝑐𝑦.
  // https://math.stackexchange.com/questions/2204520/how-do-i-rotate-a-line-segment-in-a-specific-point-on-the-line
  return [
    (x1 - x2) * Math.cos(angle) - (y1 - y2) * Math.sin(angle) + x2,
    (x1 - x2) * Math.sin(angle) + (y1 - y2) * Math.cos(angle) + y2
  ];
}
