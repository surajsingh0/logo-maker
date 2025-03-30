import React from 'react';
import { Position } from '../../types'; // LogoElement no longer needed directly
import './ResizeHandles.css';

type HandlePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

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

  // Use local bbox coordinates
  const { x, y, width, height } = bbox; 
  const handleSize = 8;
  
  // Position handles relative to the local bbox origin (x, y)
  const handles: { position: HandlePosition; x: number; y: number }[] = [
    { position: 'top-left', x: x, y: y },
    { position: 'top-right', x: x + width, y: y },
    { position: 'bottom-left', x: x, y: y + height },
    { position: 'bottom-right', x: x + width, y: y + height },
  ];

  const handleMouseDown = (e: React.MouseEvent, handle: HandlePosition) => {
    e.stopPropagation(); 
    onResizeStart(handle, e);
  };

  // Apply the element's transform to the group containing the handles
  return (
    <g className="resize-handles" transform={transform}>
      {handles.map(({ position: handlePosition, x, y }) => {
        const cursor = 
          (handlePosition === 'top-left' || handlePosition === 'bottom-right') 
            ? 'nwse-resize' 
            : 'nesw-resize';

        return (
          <rect
            key={handlePosition}
            className={`resize-handle ${handlePosition}`}
            // Position handle centers at the bbox corners
            x={x - handleSize / 2}
            y={y - handleSize / 2}
            width={handleSize}
            height={handleSize}
            fill="white"
            stroke="#2196f3"
            strokeWidth={1}
            style={{ cursor }}
            // Prevent element transform from affecting handle stroke width
            vectorEffect="non-scaling-stroke" 
            onMouseDown={(e) => handleMouseDown(e, handlePosition)}
          />
        );
      })}
    </g>
  );
};

export default ResizeHandles; 