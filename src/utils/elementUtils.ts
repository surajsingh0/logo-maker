import { LogoElement, Position } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { MIN_SIZES } from '../components/canvas/ResizeHandles';

// Helper function to calculate distance from point to line segment
const distanceToLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;

  return Math.sqrt(dx * dx + dy * dy);
};

// Generate a unique ID for new elements
export const generateId = (): string => {
  return uuidv4();
};

// Create a new rectangle element
export const createRectangle = (position: Position): LogoElement => {
  return {
    id: generateId(),
    type: 'rectangle',
    position,
    dimensions: {
      width: 100,
      height: 80,
    },
    styles: {
      fill: '#3498db',
      stroke: '#2980b9',
      strokeWidth: 2,
      opacity: 1,
    },
    rotation: 0,
    selected: false,
  };
};

// Create a new circle element
export const createCircle = (position: Position): LogoElement => {
  return {
    id: generateId(),
    type: 'circle',
    position,
    radius: 50,
    styles: {
      fill: '#e74c3c',
      stroke: '#c0392b',
      strokeWidth: 2,
      opacity: 1,
    },
    rotation: 0,
    selected: false,
  };
};

// Create a new text element
export const createText = (position: Position, content: string = 'Text'): LogoElement => {
  return {
    id: generateId(),
    type: 'text',
    position,
    content,
    fontFamily: 'Arial',
    fontSize: 24,
    styles: {
      fill: '#2c3e50',
      stroke: 'transparent',
      strokeWidth: 0,
      opacity: 1,
    },
    rotation: 0,
    selected: false,
  };
};

// Create a path element
export const createPath = (points: Position[]): LogoElement => {
  const minX = Math.min(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  
  return {
    id: generateId(),
    type: 'path',
    position: { x: minX, y: minY },
    points,
    styles: {
      fill: 'transparent',
      stroke: '#8e44ad',
      strokeWidth: 3,
      opacity: 1,
    },
    rotation: 0,
    selected: false,
  };
};

// Create a new ellipse element
export const createEllipse = (position: Position): LogoElement => {
  return {
    id: generateId(),
    type: 'ellipse',
    position,
    rx: 60, // Default horizontal radius
    ry: 40, // Default vertical radius
    styles: {
      fill: '#f1c40f',
      stroke: '#f39c12',
      strokeWidth: 2,
      opacity: 1,
    },
    rotation: 0,
    selected: false,
  };
};

// Create a new line element
export const createLine = (start: Position, end: Position): LogoElement => {
  return {
    id: generateId(),
    type: 'line',
    // Position might represent the midpoint or start, store actual points
    position: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    points: [start, end],
    styles: {
      fill: 'none',
      stroke: '#95a5a6',
      strokeWidth: 4,
      opacity: 1,
    },
    rotation: 0,
    selected: false,
  };
};

// Create a new curved line element
export const createCurvedLine = (start: Position, end: Position): LogoElement => {
  // Calculate the center point as the position
  const position = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  };

  // Convert points to be relative to the position
  const relativeStart = {
    x: start.x - position.x,
    y: start.y - position.y
  };
  const relativeEnd = {
    x: end.x - position.x,
    y: end.y - position.y
  };

  // Calculate control point relative to position
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const offset = Math.min(50, length / 2);

  // Calculate control point position (perpendicular to line)
  const relativeControl = {
    x: -dy * offset / length,
    y: dx * offset / length
  };

  return {
    id: generateId(),
    type: 'curvedLine',
    position,
    points: [
      relativeStart,
      relativeControl,
      relativeEnd
    ],
    styles: {
      fill: 'none',
      stroke: '#3498db',
      strokeWidth: 3,
      opacity: 1,
    },
    rotation: 0,
    selected: false,
  };
};

// Create a regular polygon element (e.g., triangle, pentagon)
export const createPolygon = (position: Position, sides: number = 3, radius: number = 50): LogoElement => {
  return {
    id: generateId(),
    type: 'polygon',
    position,
    sides,
    radius, // Represents distance from center to vertex
    styles: {
      fill: '#2ecc71',
      stroke: '#27ae60',
      strokeWidth: 2,
      opacity: 1,
    },
    rotation: 0,
    selected: false,
  };
};

// Create a star element
export const createStar = (position: Position, numPoints: number = 5, outerRadius: number = 50, innerRadius: number = 25): LogoElement => {
  return {
    id: generateId(),
    type: 'star',
    position,
    numPoints,
    outerRadius,
    innerRadius,
    styles: {
      fill: '#9b59b6',
      stroke: '#8e44ad',
      strokeWidth: 2,
      opacity: 1,
    },
    rotation: 0,
    selected: false,
  };
};

// Create a hexagon element
export const createHexagon = (position: Position, radius: number = 50): LogoElement => {
  return {
    id: generateId(),
    type: 'hexagon',
    position,
    radius, // Distance from center to vertex
    styles: {
      fill: '#e74c3c',
      stroke: '#c0392b',
      strokeWidth: 2,
      opacity: 1,
    },
    rotation: 0,
    selected: false,
  };
};

// Create a new arrow element
export const createArrow = (start: Position, end: Position): LogoElement => {
  return {
    id: generateId(),
    type: 'arrow',
    position: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    points: [start, end],
    arrowHeadSize: 15,
    styles: {
      fill: 'none',
      stroke: '#2196f3',
      strokeWidth: 3,
      opacity: 1,
    },
    rotation: 0,
    selected: false,
  };
};

// Create a pentagon element
export const createPentagon = (position: Position, radius: number = 50): LogoElement => {
  const points = Array.from({ length: 5 }).map((_, i) => {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2; // Start from top
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  });

  return {
    id: generateId(),
    type: 'pentagon',
    position,
    points,
    radius,
    styles: {
      fill: '#9b59b6',
      stroke: '#8e44ad',
      strokeWidth: 2,
      opacity: 1,
    },
    rotation: 0,
    selected: false,
  };
};

// Create a new octagon star element
export const createOctagonStar = (position: Position, radius: number = 50): LogoElement => {
  return {
    id: generateId(),
    type: 'octagonStar',
    position,
    radius,
    rotation: 0,
    styles: {
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 2,
      opacity: 1,
    },
    selected: false,
  };
};

// Helper function to calculate block arrow points
const calculateBlockArrowPoints = (width: number, height: number): Position[] => {
  const headWidth = height; // Arrow head is as wide as the height
  const bodyWidth = width - headWidth;
  const bodyHeight = height * 0.6; // Body is 60% of total height
  
  // Calculate points relative to center (0,0)
  return [
    { x: -width/2, y: -bodyHeight/2 }, // Body start top
    { x: -width/2 + bodyWidth, y: -bodyHeight/2 }, // Body end top
    { x: -width/2 + bodyWidth, y: -height/2 }, // Head start top
    { x: width/2, y: 0 }, // Head point
    { x: -width/2 + bodyWidth, y: height/2 }, // Head start bottom
    { x: -width/2 + bodyWidth, y: bodyHeight/2 }, // Body end bottom
    { x: -width/2, y: bodyHeight/2 }, // Body start bottom
  ];
};

export const createBlockArrow = (position: Position): LogoElement => {
  const width = 120;
  const height = 60;
  
  return {
    id: generateId(),
    type: 'blockArrow',
    position,
    points: calculateBlockArrowPoints(width, height),
    dimensions: { width, height },
    styles: {
      fill: '#3498db',
      stroke: '#2980b9',
      strokeWidth: 2,
      opacity: 1,
    },
    rotation: 0,
    selected: false,
  };
};

// Create a cloud element
export const createCloud = (position: Position): LogoElement => {
  const width = 120;
  const height = 80;

  // Create a more detailed cloud path with multiple bulges
  const pathData = [
    'M', 35, 80,                           // Start from bottom left
    'C', 20, 80, 10, 70, 10, 55,          // Left bulge
    'C', 10, 40, 20, 30, 35, 30,          // Left top curve
    'C', 40, 15, 55, 10, 70, 10,          // Top left bulge
    'C', 85, 10, 100, 15, 105, 30,        // Top right bulge
    'C', 120, 30, 130, 40, 130, 55,       // Right top curve
    'C', 130, 70, 120, 80, 105, 80,       // Right bulge
    'C', 90, 85, 50, 85, 35, 80,          // Bottom curve
  ].join(' ');

  return {
    id: generateId(),
    type: 'cloud',
    position,
    dimensions: { width: 140, height: 90 }, // Slightly larger to accommodate bulges
    pathData,
    styles: {
      fill: '#ffffff',
      stroke: '#cccccc',
      strokeWidth: 2,
      opacity: 1,
    },
    rotation: 0,
    selected: false,
  };
};

// Calculate element bounds (useful for selection and transformations)
export const getElementBounds = (element: LogoElement): { top: number; left: number; right: number; bottom: number } => {
  const { position, type } = element;
  
  switch (type) {
    case 'rectangle': {
      const { width = 0, height = 0 } = element.dimensions || {};
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      return {
        top: position.y - halfHeight,
        left: position.x - halfWidth,
        right: position.x + halfWidth,
        bottom: position.y + halfHeight,
      };
    }
    
    case 'circle':
    case 'hexagon':
    case 'pentagon':
    case 'octagonStar':
      const radius = element.radius || 0;
      return {
        top: position.y - radius,
        left: position.x - radius,
        right: position.x + radius,
        bottom: position.y + radius,
      };
    
    case 'text':
      // Approximating text bounds based on position being the CENTER
      const fontSize = element.fontSize || 24;
      const content = element.content || '';
      // Keep the rough width estimate, but use it relative to the center
      const approximateWidth = content.length * (fontSize * 0.6); 
      // Approximate height based on font size
      const approximateHeight = fontSize; 

      const halfWidth = approximateWidth / 2;
      const halfHeight = approximateHeight / 2;

      return {
        top: position.y - halfHeight,
        left: position.x - halfWidth,
        right: position.x + halfWidth,
        bottom: position.y + halfHeight,
      };
    
    case 'path':
      const points = element.points || [];
      if (points.length === 0) {
        return { top: position.y, left: position.x, right: position.x, bottom: position.y };
      }
      
      const xs = points.map(p => p.x);
      const ys = points.map(p => p.y);
      
      return {
        top: Math.min(...ys),
        left: Math.min(...xs),
        right: Math.max(...xs),
        bottom: Math.max(...ys),
      };
    
    case 'blockArrow':
      const { width = 0, height = 0 } = element.dimensions || {};
      return {
        top: position.y - height/2,
        left: position.x - width/2,
        right: position.x + width/2,
        bottom: position.y + height/2
      };
    
    case 'cloud': {
      const { width = 140, height = 90 } = element.dimensions || {};
      return {
        top: position.y,
        left: position.x,
        right: position.x + width,
        bottom: position.y + height,
      };
    }
    
    default:
      return { top: position.y, left: position.x, right: position.x, bottom: position.y };
  }
};

// Create a static canvas context for text measurement to avoid recreating it constantly
let offscreenCanvas: HTMLCanvasElement | null = null;
let offscreenContext: CanvasRenderingContext2D | null = null;

function getTextMeasurementContext(): CanvasRenderingContext2D | null {
  if (!offscreenContext) {
    offscreenCanvas = document.createElement('canvas');
    offscreenContext = offscreenCanvas.getContext('2d');
  }
  return offscreenContext;
}

// Check if a point is inside an element (for selection), considering rotation
export const isPointInElement = (element: LogoElement, point: Position): boolean => {
  const { position, rotation = 0, type } = element;
  const cx = position.x;
  const cy = position.y;

  // Calculate the inverse rotation
  const angleRad = -rotation * (Math.PI / 180);
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  // Translate point relative to the rotation center
  const dx = point.x - cx;
  const dy = point.y - cy;

  // Apply inverse rotation
  const rotatedX = dx * cos - dy * sin;
  const rotatedY = dx * sin + dy * cos;

  switch (type) {
    case 'rectangle': {
      const { width = 0, height = 0 } = element.dimensions || {};
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      // Check against the centered rectangle coordinates
      return -halfWidth <= rotatedX && rotatedX <= halfWidth && -halfHeight <= rotatedY && rotatedY <= halfHeight;
    }

    case 'circle': {
      const radius = element.radius || 0;
      // Distance check from the center (which is the origin for rotatedX, rotatedY)
      return (rotatedX * rotatedX + rotatedY * rotatedY) <= (radius * radius);
    }

    case 'ellipse': {
      const rx = element.rx || 0;
      const ry = element.ry || 0;
      if (rx <= 0 || ry <= 0) return false;
      // Ellipse equation check relative to center (origin for rotatedX, rotatedY)
      return (rotatedX * rotatedX) / (rx * rx) + (rotatedY * rotatedY) / (ry * ry) <= 1;
    }

    case 'line': {
      const linePoints = element.points || [];
      if (linePoints.length < 2) return false;
      const p1 = linePoints[0];
      const p2 = linePoints[1];
      const tolerance = (element.styles.strokeWidth || 2) / 2 + 2; // Click tolerance

      // Calculate relative points for un-rotated check
      const relP1x = p1.x - cx;
      const relP1y = p1.y - cy;
      const relP2x = p2.x - cx;
      const relP2y = p2.y - cy;

      // Check distance from point (rotatedX, rotatedY) to the line segment (relP1, relP2)
      const lenSq = (relP2x - relP1x)**2 + (relP2y - relP1y)**2;
      if (lenSq === 0) { // Points are the same
        return (rotatedX - relP1x)**2 + (rotatedY - relP1y)**2 <= tolerance**2;
      }
      
      let t = ((rotatedX - relP1x) * (relP2x - relP1x) + (rotatedY - relP1y) * (relP2y - relP1y)) / lenSq;
      t = Math.max(0, Math.min(1, t)); // Clamp t to [0, 1]
      
      const closestX = relP1x + t * (relP2x - relP1x);
      const closestY = relP1y + t * (relP2y - relP1y);
      
      const distSq = (rotatedX - closestX)**2 + (rotatedY - closestY)**2;
      return distSq <= tolerance**2;
    }

    case 'arrow': {
      const points = element.points || [];
      if (points.length < 2) return false;
      const [start, end] = points;
      const tolerance = (element.styles.strokeWidth || 2) / 2 + 2;

      // Calculate relative points for un-rotated check
      const relStartX = start.x - cx;
      const relStartY = start.y - cy;
      const relEndX = end.x - cx;
      const relEndY = end.y - cy;

      // Check main line
      const lenSq = (relEndX - relStartX)**2 + (relEndY - relStartY)**2;
      if (lenSq === 0) return (rotatedX - relStartX)**2 + (rotatedY - relStartY)**2 <= tolerance**2;

      let t = ((rotatedX - relStartX) * (relEndX - relStartX) + (rotatedY - relStartY) * (relEndY - relStartY)) / lenSq;
      t = Math.max(0, Math.min(1, t));

      const closestX = relStartX + t * (relEndX - relStartX);
      const closestY = relStartY + t * (relEndY - relStartY);
      const distSq = (rotatedX - closestX)**2 + (rotatedY - closestY)**2;

      // Check arrow head
      const arrowHeadSize = element.arrowHeadSize || 15;
      const angle = Math.atan2(relEndY - relStartY, relEndX - relStartX);
      const arrowHead1X = relEndX - arrowHeadSize * Math.cos(angle - Math.PI / 6);
      const arrowHead1Y = relEndY - arrowHeadSize * Math.sin(angle - Math.PI / 6);
      const arrowHead2X = relEndX - arrowHeadSize * Math.cos(angle + Math.PI / 6);
      const arrowHead2Y = relEndY - arrowHeadSize * Math.sin(angle + Math.PI / 6);

      // Check distance to arrow head lines
      const distToHead1 = distanceToLine(
        rotatedX, rotatedY,
        relEndX, relEndY,
        arrowHead1X, arrowHead1Y
      );
      const distToHead2 = distanceToLine(
        rotatedX, rotatedY,
        relEndX, relEndY,
        arrowHead2X, arrowHead2Y
      );

      return distSq <= tolerance**2 || distToHead1 <= tolerance || distToHead2 <= tolerance;
    }

    case 'curvedLine': {
      const points = element.points || [];
      if (points.length < 3) return false;

      // Get relative positions of points (since we're already in the rotated coordinate system)
      const start = points[0];
      const control = points[1];
      const end = points[2];

      // Check if point is near any of the control points first
      const handleRadius = (element.styles.strokeWidth || 2) / 2 + 5;
      const handleRadiusSq = handleRadius * handleRadius;

      // Check distance to endpoints and control point in rotated space
      const distToStart = (rotatedX - start.x) ** 2 + (rotatedY - start.y) ** 2;
      const distToControl = (rotatedX - control.x) ** 2 + (rotatedY - control.y) ** 2;
      const distToEnd = (rotatedX - end.x) ** 2 + (rotatedY - end.y) ** 2;

      if (distToStart <= handleRadiusSq || distToControl <= handleRadiusSq || distToEnd <= handleRadiusSq) {
        return true;
      }

      // Approximate curve with line segments for hit testing
      const numSegments = 10;
      const tolerance = (element.styles.strokeWidth || 2) + 4;
      const toleranceSq = tolerance * tolerance;

      for (let i = 0; i < numSegments; i++) {
        const t1 = i / numSegments;
        const t2 = (i + 1) / numSegments;

        // Calculate points on curve using quadratic Bezier formula (in relative coordinates)
        const p1 = {
          x: (1 - t1) * (1 - t1) * start.x + 2 * (1 - t1) * t1 * control.x + t1 * t1 * end.x,
          y: (1 - t1) * (1 - t1) * start.y + 2 * (1 - t1) * t1 * control.y + t1 * t1 * end.y
        };
        const p2 = {
          x: (1 - t2) * (1 - t2) * start.x + 2 * (1 - t2) * t2 * control.x + t2 * t2 * end.x,
          y: (1 - t2) * (1 - t2) * start.y + 2 * (1 - t2) * t2 * control.y + t2 * t2 * end.y
        };

        // Check distance to line segment
        const lenSq = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
        if (lenSq === 0) continue;

        let t = ((rotatedX - p1.x) * (p2.x - p1.x) + (rotatedY - p1.y) * (p2.y - p1.y)) / lenSq;
        t = Math.max(0, Math.min(1, t));

        const projX = p1.x + t * (p2.x - p1.x);
        const projY = p1.y + t * (p2.y - p1.y);
        const distSq = (rotatedX - projX) ** 2 + (rotatedY - projY) ** 2;

        if (distSq <= toleranceSq) {
          return true;
        }
      }

      return false;
    }

    case 'text': {
      const context = getTextMeasurementContext();
      if (!context) {
        // Fallback to rough estimation if context failed (shouldn't normally happen)
        console.error("Failed to get 2D context for text measurement");
        const fontSize = element.fontSize || 24;
        const content = element.content || '';
        const approximateWidth = content.length * (fontSize * 0.6);
        const approximateHeight = fontSize;
        const halfWidth = approximateWidth / 2;
        const halfHeight = approximateHeight / 2;
        return (rotatedX >= -halfWidth && rotatedX <= halfWidth && rotatedY >= -halfHeight && rotatedY <= halfHeight);
      }

      const fontSize = element.fontSize || 24;
      const fontFamily = element.fontFamily || 'Arial';
      const content = element.content || '';
      
      // Set font for measurement
      context.font = `${fontSize}px ${fontFamily}`;
      
      // Measure the actual text width
      const measuredWidth = context.measureText(content).width;
      
      // Use fontSize as approximate height (accurate height measurement is more complex)
      const approximateHeight = fontSize; 

      const halfWidth = measuredWidth / 2;
      const halfHeight = approximateHeight / 2; // Using fontSize for height approximation

      // Check if the rotated point (relative to the center) falls within the measured bounds
      return (
        rotatedX >= -halfWidth && rotatedX <= halfWidth &&
        rotatedY >= -halfHeight && rotatedY <= halfHeight 
      );
    }

    case 'path': {
      // Use the un-rotated bounding box for hit testing against the rotated point
      const bounds = getElementBounds(element);
      if (bounds.left === bounds.right || bounds.top === bounds.bottom) return false; // Empty

      // Check if rotated point (relative to cx, cy) falls within the 
      // bounding box translated relative to cx, cy
      const relativeLeft = bounds.left - cx;
      const relativeTop = bounds.top - cy;
      const relativeRight = bounds.right - cx;
      const relativeBottom = bounds.bottom - cy;

      return (
        relativeLeft <= rotatedX && rotatedX <= relativeRight &&
        relativeTop <= rotatedY && rotatedY <= relativeBottom
      );
    }
    
    case 'polygon':
    case 'star':
    case 'hexagon':
    case 'pentagon':
    case 'octagonStar': { // Polygons, stars, hexagons, pentagons, and octagon stars use the same logic
      let vertices: Position[] = [];
      if (type === 'polygon') {
        const sides = element.sides || 3;
        const polyRadius = element.radius || 0;
        for (let i = 0; i < sides; i++) {
          const angle = (i / sides) * 2 * Math.PI - Math.PI / 2;
          vertices.push({ 
            x: polyRadius * Math.cos(angle),
            y: polyRadius * Math.sin(angle)
          });
        }
      } else if (type === 'star') {
        const numPoints = element.numPoints || 5;
        const outerRadius = element.outerRadius || 0;
        const innerRadius = element.innerRadius || outerRadius / 2;
        for (let i = 0; i < numPoints * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i / (numPoints * 2)) * 2 * Math.PI - Math.PI / 2;
          vertices.push({ 
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
          });
        }
      } else if (type === 'pentagon') {
        const pentagonRadius = element.radius || 0;
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          vertices.push({
            x: pentagonRadius * Math.cos(angle),
            y: pentagonRadius * Math.sin(angle)
          });
        }
      } else if (type === 'octagonStar') {
        const starRadius = element.radius || 0;
        for (let i = 0; i < 16; i++) {
          const radius = i % 2 === 0 ? starRadius : starRadius * 0.4;
          const angle = (i * Math.PI) / 8;
          vertices.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
          });
        }
      } else { // Hexagon
        const hexRadius = element.radius || 0;
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * 2 * Math.PI - Math.PI / 2;
          vertices.push({
            x: hexRadius * Math.cos(angle),
            y: hexRadius * Math.sin(angle)
          });
        }
      }

      // Ray Casting Algorithm (point in polygon test)
      let inside = false;
      for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i].x, yi = vertices[i].y;
        const xj = vertices[j].x, yj = vertices[j].y;

        const intersect = ((yi > rotatedY) !== (yj > rotatedY))
            && (rotatedX < (xj - xi) * (rotatedY - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }

    case 'blockArrow': {
      // For block arrows, we use the points array for hit detection
      const points = element.points || [];
      if (points.length === 0) return false;

      // Points are already in local coordinates relative to center
      // Ray Casting Algorithm (point in polygon test)
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x;
        const yi = points[i].y;
        const xj = points[j].x;
        const yj = points[j].y;

        const intersect = ((yi > rotatedY) !== (yj > rotatedY))
            && (rotatedX < (xj - xi) * (rotatedY - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }

    case 'cloud': {
      const { width = 140, height = 90 } = element.dimensions || {};
      // Check if the rotated point is within the cloud's bounding box
      return 0 <= rotatedX && rotatedX <= width && 0 <= rotatedY && rotatedY <= height;
    }

    default:
      return false;
  }
}; 

// Helper function to enforce minimum sizes
const enforceMinSize = (element: LogoElement, newDimensions: any): any => {
  const minSizes = MIN_SIZES;
  
  switch (element.type) {
    case 'circle':
      return {
        ...newDimensions,
        radius: Math.max(newDimensions.radius, minSizes.CIRCLE.radius)
      };
    case 'ellipse':
      return {
        ...newDimensions,
        rx: Math.max(newDimensions.rx, minSizes.ELLIPSE.rx),
        ry: Math.max(newDimensions.ry, minSizes.ELLIPSE.ry)
      };
    case 'text':
      return {
        ...newDimensions,
        width: Math.max(newDimensions.width, minSizes.TEXT.width),
        height: Math.max(newDimensions.height, minSizes.TEXT.height)
      };
    case 'line':
    case 'arrow':
    case 'curvedLine':
      return {
        ...newDimensions,
        length: Math.max(newDimensions.length, minSizes.LINE.length)
      };
    default:
      return {
        ...newDimensions,
        width: Math.max(newDimensions.width, minSizes.DEFAULT.width),
        height: Math.max(newDimensions.height, minSizes.DEFAULT.height)
      };
  }
};

// Update element dimensions during resize
export const updateElementOnResize = (element: LogoElement, handle: string, dx: number, dy: number, preserveAspect = false): LogoElement => {
  const updatedElement = { ...element };
  
  // Calculate angle in radians for rotated elements
  const angleRad = (element.rotation || 0) * Math.PI / 180;
  const cos = Math.cos(-angleRad);
  const sin = Math.sin(-angleRad);
  
  // Transform delta to account for rotation
  const rotatedDx = dx * cos - dy * sin;
  const rotatedDy = dx * sin + dy * cos;

  switch (element.type) {
    case 'rectangle':
    case 'cloud': {
      const { width = 0, height = 0 } = element.dimensions || {};
      let newWidth = width;
      let newHeight = height;
      
      // Handle resize based on which handle was dragged
      switch (handle) {
        case 'e':
          newWidth = width + rotatedDx * 2;
          break;
        case 'w':
          newWidth = width - rotatedDx * 2;
          break;
        case 'n':
          newHeight = height - rotatedDy * 2;
          break;
        case 's':
          newHeight = height + rotatedDy * 2;
          break;
        case 'ne':
          newWidth = width + rotatedDx * 2;
          newHeight = height - rotatedDy * 2;
          if (preserveAspect) {
            const ratio = width / height;
            newHeight = newWidth / ratio;
          }
          break;
        case 'nw':
          newWidth = width - rotatedDx * 2;
          newHeight = height - rotatedDy * 2;
          if (preserveAspect) {
            const ratio = width / height;
            newHeight = newWidth / ratio;
          }
          break;
        case 'se':
          newWidth = width + rotatedDx * 2;
          newHeight = height + rotatedDy * 2;
          if (preserveAspect) {
            const ratio = width / height;
            newHeight = newWidth / ratio;
          }
          break;
        case 'sw':
          newWidth = width - rotatedDx * 2;
          newHeight = height + rotatedDy * 2;
          if (preserveAspect) {
            const ratio = width / height;
            newHeight = newWidth / ratio;
          }
          break;
      }
      
      // Enforce minimum sizes
      const constrained = enforceMinSize(element, { width: newWidth, height: newHeight });
      updatedElement.dimensions = constrained;
      break;
    }
    
    case 'circle': {
      // For circles, only use the larger of dx or dy for uniform scaling
      const delta = Math.max(Math.abs(rotatedDx), Math.abs(rotatedDy));
      const newRadius = (element.radius || 0) + (handle.includes('w') || handle.includes('n') ? -delta : delta);
      const constrained = enforceMinSize(element, { radius: newRadius });
      updatedElement.radius = constrained.radius;
      break;
    }
    
    case 'ellipse': {
      const { rx = 0, ry = 0 } = element;
      let newRx = rx;
      let newRy = ry;
      
      if (handle.includes('e') || handle.includes('w')) {
        newRx = rx + (handle.includes('w') ? -rotatedDx : rotatedDx);
      }
      if (handle.includes('n') || handle.includes('s')) {
        newRy = ry + (handle.includes('n') ? -rotatedDy : rotatedDy);
      }
      
      if (preserveAspect) {
        const ratio = rx / ry;
        newRy = newRx / ratio;
      }
      
      const constrained = enforceMinSize(element, { rx: newRx, ry: newRy });
      updatedElement.rx = constrained.rx;
      updatedElement.ry = constrained.ry;
      break;
    }
    
    case 'text': {
      // For text, maintain aspect ratio by default
      const { fontSize = 24 } = element;
      const scaleFactor = 1 + (rotatedDx / 100); // Adjust scaling sensitivity
      const newFontSize = Math.max(fontSize * scaleFactor, 8); // Minimum font size of 8
      updatedElement.fontSize = newFontSize;
      break;
    }
  }
  
  return updatedElement;
}; 