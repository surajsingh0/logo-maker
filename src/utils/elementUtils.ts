import { LogoElement, Position } from '../types';
import { v4 as uuidv4 } from 'uuid';

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

// Calculate element bounds (useful for selection and transformations)
export const getElementBounds = (element: LogoElement): { top: number; left: number; right: number; bottom: number } => {
  const { position, type } = element;
  
  switch (type) {
    case 'rectangle':
      const { width = 0, height = 0 } = element.dimensions || {};
      return {
        top: position.y,
        left: position.x,
        right: position.x + width,
        bottom: position.y + height,
      };
    
    case 'circle':
      const radius = element.radius || 0;
      return {
        top: position.y - radius,
        left: position.x - radius,
        right: position.x + radius,
        bottom: position.y + radius,
      };
    
    case 'text':
      // Approximating text bounds
      const fontSize = element.fontSize || 24;
      const content = element.content || '';
      const approximateWidth = content.length * (fontSize * 0.6);
      return {
        top: position.y - fontSize,
        left: position.x,
        right: position.x + approximateWidth,
        bottom: position.y + 5,
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
    
    default:
      return { top: position.y, left: position.x, right: position.x, bottom: position.y };
  }
};

// Check if a point is inside an element (for selection), considering rotation
export const isPointInElement = (element: LogoElement, point: Position): boolean => {
  const { position, rotation = 0, type } = element;
  const cx = position.x;
  const cy = position.y;

  // Calculate the inverse rotation
  const angleRad = -rotation * (Math.PI / 180); // Use negative angle for inverse
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  // Translate point relative to the rotation center (element.position)
  const dx = point.x - cx;
  const dy = point.y - cy;

  // Apply inverse rotation
  const rotatedX = dx * cos - dy * sin;
  const rotatedY = dx * sin + dy * cos;

  // Now check if the 'rotated' point lies within the element's un-rotated boundaries,
  // relative to the rotation center (which is now the origin for rotatedX, rotatedY)

  switch (type) {
    case 'rectangle': {
      const { width = 0, height = 0 } = element.dimensions || {};
      // Check against the rectangle defined from (0,0) to (width, height)
      return 0 <= rotatedX && rotatedX <= width && 0 <= rotatedY && rotatedY <= height;
    }

    case 'circle': {
      const radius = element.radius || 0;
      // Distance check from the center (which is the origin for rotatedX, rotatedY)
      return (rotatedX * rotatedX + rotatedY * rotatedY) <= (radius * radius);
    }

    case 'text': {
      const fontSize = element.fontSize || 24;
      const content = element.content || '';
      const approximateWidth = content.length * (fontSize * 0.6);
      // Check relative to text anchor (0,0 in rotated frame)
      // Using approximate bounds: [0, width] horizontally, [-fontSize, 5] vertically
      return 0 <= rotatedX && rotatedX <= approximateWidth && -fontSize <= rotatedY && rotatedY <= 5;
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

    default:
      return false;
  }
}; 