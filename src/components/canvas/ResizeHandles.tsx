import React from 'react';
import './ResizeHandles.css';

type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

// Define the expected bounds structure
export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ResizeHandlesProps {
  bbox: DOMRect; // Accept the raw DOMRect from getBBox()
  transform: string; // Accept the transform string applied to the element
  onResizeStart: (handle: HandlePosition, event: React.MouseEvent) => void;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ bbox, transform, onResizeStart }) => {
  
  if (!bbox) return null; 

  const { x, y, width, height } = bbox; 
  
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

  return (
    <g className="resize-handles" transform={transform}>
      {handles.map(({ position, x, y, isCorner }) => (
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