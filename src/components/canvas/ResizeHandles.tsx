import React from 'react';
import { LogoElement, Position } from '../../types';
import './ResizeHandles.css';

type HandlePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface ResizeHandlesProps {
  element: LogoElement;
  onResizeStart: (handle: HandlePosition, event: React.MouseEvent) => void;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ element, onResizeStart }) => {
  const { position, dimensions, type } = element;
  
  // Only show resize handles for elements that support resizing
  if (!dimensions || type === 'line') return null;
  
  const { width, height } = dimensions;
  const handleSize = 8; // Size of the resize handle squares
  
  const handles: { position: HandlePosition; x: number; y: number }[] = [
    { position: 'top-left', x: position.x, y: position.y },
    { position: 'top-right', x: position.x + width, y: position.y },
    { position: 'bottom-left', x: position.x, y: position.y + height },
    { position: 'bottom-right', x: position.x + width, y: position.y + height },
  ];

  const handleMouseDown = (e: React.MouseEvent, handle: HandlePosition) => {
    e.stopPropagation(); // Prevent canvas drag from triggering
    // Pass the handle and the original event up
    onResizeStart(handle, e);
  };

  return (
    <g className="resize-handles">
      {handles.map(({ position: handlePosition, x, y }) => {
        // Determine correct cursor based on handle position
        const cursor = 
          (handlePosition === 'top-left' || handlePosition === 'bottom-right') 
            ? 'nwse-resize' // Correct cursor for diagonal
            : 'nesw-resize'; // Correct cursor for diagonal

        return (
          <rect
            key={handlePosition}
            className={`resize-handle ${handlePosition}`}
            x={x - handleSize / 2}
            y={y - handleSize / 2}
            width={handleSize}
            height={handleSize}
            fill="white"
            stroke="#2196f3"
            strokeWidth={1}
            style={{ cursor }}
            onMouseDown={(e) => handleMouseDown(e, handlePosition)}
          />
        );
      })}
    </g>
  );
};

export default ResizeHandles; 