/**
 * Geometry Math Utilities: Anchor math, SVG connector paths, bounds calculation
 */

export function getAnchorCoordinates(node, anchorPosition) {
  const { x, y, width, height } = node;

  switch (anchorPosition) {
    case 'top':
      return { x: x + width / 2, y };
    case 'bottom':
      return { x: x + width / 2, y: y + height };
    case 'left':
      return { x, y: y + height / 2 };
    case 'right':
      return { x: x + width, y: y + height / 2 };
    default:
      return { x: x + width / 2, y: y + height / 2 };
  }
}

/**
 * Generate smooth, curvy SVG Path string between two anchor points
 * @param {Object} from {x, y}
 * @param {Object} to {x, y}
 * @param {String} type 'curved' | 'orthogonal' | 'straight'
 */
export function calculateArrowPath(from, to, type = 'curved') {
  if (type === 'straight') {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }

  // Smooth Curvy Bezier Path (Default)
  const dx = Math.abs(to.x - from.x) * 0.5;
  const dy = Math.abs(to.y - from.y) * 0.5;
  const curvature = Math.max(dx, dy, 40);

  const cx1 = from.x + (to.x > from.x ? curvature : -curvature);
  const cy1 = from.y;
  const cx2 = to.x + (from.x > to.x ? curvature : -curvature);
  const cy2 = to.y;

  return `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
}

export function isPointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height;
}

export function isRectIntersecting(r1, r2) {
  return !(
    r2.x > r1.x + r1.width ||
    r2.x + r2.width < r1.x ||
    r2.y > r1.y + r1.height ||
    r2.y + r2.height < r1.y
  );
}
