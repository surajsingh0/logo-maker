import React from 'react';
import './ResizeHandles.css';

type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

// Define minimum sizes for different element types
export const MIN_SIZES = {
  DEFAULT: { width: 10, height: 10 },
  TEXT: { width: 20, height: 20 },
  LINE: { length: 10 },
  CIRCLE: { radius: 5 },
  ELLIPSE: { rx: 5, ry: 5 },
};

// Define the expected bounds structure
export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ResizeHandlesProps {
  bbox: DOMRect;
  transform: string;
  elementType: string;
  onResizeStart: (handle: HandlePosition, event: React.MouseEvent) => void;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ bbox, transform, elementType, onResizeStart }) => {
  if (!bbox) return null;

  const { x, y, width, height } = bbox;
  
  // Calculate handle positions based on bbox
  const handles: { position: HandlePosition; x: number; y: number; isCorner: boolean }[] = [
    { position: 'nw', x: x, y: y, isCorner: true },
    { position: 'ne', x: x + width, y: y, isCorner: true },
    { position: 'se', x: x + width, y: y + height, isCorner: true },
    { position: 'sw', x: x, y: y + height, isCorner: true },
    { position: 'n', x: x + width/2, y: y, isCorner: false },
    { position: 'e', x: x + width, y: y + height/2, isCorner: false },
    { position: 's', x: x + width/2, y: y + height, isCorner: false },
    { position: 'w', x: x, y: y + height/2, isCorner: false },
  ];

  const handleMouseDown = (e: React.MouseEvent, handle: HandlePosition) => {
    e.stopPropagation();
    onResizeStart(handle, e);
  };

  // Get visible handles based on element type
  const getVisibleHandles = () => {
    switch (elementType) {
      case 'circle':
        return handles.filter(h => h.isCorner);
      case 'ellipse':
        return handles;
      case 'text':
        return handles;
      case 'blockArrow':
      case 'cloud':
        // Show all handles for block arrows and clouds
        return handles;
      case 'line':
      case 'arrow':
      case 'curvedLine':
        return [];
      default:
        return handles;
    }
  };

  const visibleHandles = getVisibleHandles();

  return (
    <g className="resize-handles" transform={transform}>
      {visibleHandles.map(({ position, x, y, isCorner }) => (
        <circle
          key={position}
          className={`resize-handle ${position} ${isCorner ? 'corner' : ''}`}
          cx={x}
          cy={y}
          r={isCorner ? 6 : 5}
          fill="white"
          stroke="#2196f3"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          onMouseDown={(e) => handleMouseDown(e, position)}
        />
      ))}
    </g>
  );
};

export default ResizeHandles; 