import React, { useRef, useState, useEffect } from 'react';
import { LogoElement, Position, Dimensions } from '../../types';
import SVGElement from './SVGElement';
import Grid from './Grid';
import './Canvas.css';

interface CanvasProps {
  elements: LogoElement[];
  canvasWidth: number;
  canvasHeight: number;
  background: string;
  showGrid: boolean;
  gridSize: number;
  zoomLevel: number;
  onSelectElement: (elementId: string | null) => void;
  onSelectElementAtPosition: (position: Position) => string | null;
  onElementDrag: (elementId: string, updates: Partial<Pick<LogoElement, 'position' | 'points'>>) => void;
  onElementResize: (elementId: string, updates: Partial<LogoElement>) => void;
  onElementPointUpdate: (elementId: string, pointIndex: number, newPosition: Position) => void;
}

interface ResizeStartState {
  initialElementState: LogoElement;
  initialMousePos: Position;
}

interface MovingPointInfo {
  elementId: string;
  pointIndex: number;
  initialMousePos: Position;
}

const Canvas: React.FC<CanvasProps> = ({
  elements,
  canvasWidth,
  canvasHeight,
  background,
  showGrid,
  gridSize,
  zoomLevel,
  onSelectElement,
  onSelectElementAtPosition,
  onElementDrag,
  onElementResize,
  onElementPointUpdate,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<Position>({ x: 0, y: 0 });
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStartState, setResizeStartState] = useState<ResizeStartState | null>(null);
  const [isMovingEndpoint, setIsMovingEndpoint] = useState<boolean>(false);
  const [movingPointInfo, setMovingPointInfo] = useState<MovingPointInfo | null>(null);

  useEffect(() => {
    const selectedElement = elements.find(el => el.selected);
    setActiveElementId(selectedElement?.id || null);
  }, [elements]);

  const getCanvasCoordinates = (e: React.MouseEvent): Position => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoomLevel,
      y: (e.clientY - rect.top) / zoomLevel,
    };
  };

  // Handle resize start
  const handleResizeStart = (handle: string, event: React.MouseEvent) => {
    const element = elements.find(el => el.id === activeElementId);
    if (!element) return;
    
    // Only exclude lines now
    if (element.type === 'line') return;

    const initialCanvasMousePos = getCanvasCoordinates(event);

    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStartState({
      initialElementState: { ...element },
      initialMousePos: initialCanvasMousePos,
    });
    setIsDragging(false);
  };

  // Handle endpoint move start (for lines)
  const handleEndpointDown = (elementId: string, pointIndex: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent canvas drag
    const initialMousePos = getCanvasCoordinates(event);
    setIsMovingEndpoint(true);
    setMovingPointInfo({ elementId, pointIndex, initialMousePos });
    // Ensure other states are off
    setIsDragging(false);
    setIsResizing(false);
  };

  // Handle mouse move (for dragging, resizing shapes, and moving points)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const currentMousePos = getCanvasCoordinates(e);
    
    // Handle Endpoint Moving (Lines)
    if (isMovingEndpoint && movingPointInfo) {
      const { elementId, pointIndex, initialMousePos } = movingPointInfo;
      // We don't need delta here, just pass the new absolute position
      onElementPointUpdate(elementId, pointIndex, currentMousePos);
    }
    // Handle Resizing (Shapes)
    else if (isResizing && resizeHandle && resizeStartState && activeElementId) {
      const { initialElementState, initialMousePos } = resizeStartState;
      const dx = currentMousePos.x - initialMousePos.x;
      const dy = currentMousePos.y - initialMousePos.y;

      let update: Partial<LogoElement> = {};

      // Helper to calculate distance for radial scaling
      const calculateDistanceChange = (handle: string, dx: number, dy: number): number => {
         // Average distance change, adjusted for handle direction
         // More robust might involve actual distance from center, but this is simpler
         if (handle.includes('left') || handle.includes('top')) {
           // Use the larger change magnitude for shrinking from top/left
           return -Math.max(Math.abs(dx), Math.abs(dy));
         }
         // Use the larger change magnitude for growing from bottom/right
         return Math.max(Math.abs(dx), Math.abs(dy));
      };

      // Type-specific resize logic
      switch (initialElementState.type) {
        case 'rectangle': { 
          const { position: initialPosition, dimensions: initialDimensions } = initialElementState;
          if (!initialDimensions) break;
          let newX = initialPosition.x;
          let newY = initialPosition.y;
          let newWidth = initialDimensions.width;
          let newHeight = initialDimensions.height;

          if (resizeHandle.includes('right')) {
            newWidth = Math.max(10, initialDimensions.width + dx);
          } else if (resizeHandle.includes('left')) {
            const calculatedWidth = Math.max(10, initialDimensions.width - dx);
            newX = initialPosition.x + (initialDimensions.width - calculatedWidth);
            newWidth = calculatedWidth;
          }
          if (resizeHandle.includes('bottom')) {
            newHeight = Math.max(10, initialDimensions.height + dy);
          } else if (resizeHandle.includes('top')) {
            const calculatedHeight = Math.max(10, initialDimensions.height - dy);
            newY = initialPosition.y + (initialDimensions.height - calculatedHeight);
            newHeight = calculatedHeight;
          }
          update = { position: { x: newX, y: newY }, dimensions: { width: newWidth, height: newHeight } };
          break;
        }
        case 'circle': { 
           const { radius: initialRadius = 0 } = initialElementState;
           const delta = calculateDistanceChange(resizeHandle, dx, dy);
           const newRadius = Math.max(5, initialRadius + delta); // Min radius 5
           update = { radius: newRadius };
           break;
        }
        case 'ellipse': { 
           const { rx: initialRx = 0, ry: initialRy = 0, position: initialPosition } = initialElementState;
           let newRx = initialRx;
           let newRy = initialRy;
           let newX = initialPosition.x;
           let newY = initialPosition.y;

           // Adjust radii based on handle
           if (resizeHandle.includes('right')) {
              newRx = Math.max(5, initialRx + dx);
           } else if (resizeHandle.includes('left')) {
              newRx = Math.max(5, initialRx - dx);
              newX = initialPosition.x + dx; // Adjust position when resizing left
           }
           if (resizeHandle.includes('bottom')) {
              newRy = Math.max(5, initialRy + dy);
           } else if (resizeHandle.includes('top')) {
              newRy = Math.max(5, initialRy - dy);
              newY = initialPosition.y + dy; // Adjust position when resizing top
           }
           update = { position: { x: newX, y: newY }, rx: newRx, ry: newRy };
           break;
        }
         case 'polygon': { // Scales uniformly like circle for simplicity
           const { radius: initialRadius = 0 } = initialElementState;
           const delta = calculateDistanceChange(resizeHandle, dx, dy);
           const newRadius = Math.max(5, initialRadius + delta);
           update = { radius: newRadius };
           break;
         }
         case 'star': { // Scales outer radius, keeps inner ratio for simplicity
           const { outerRadius: initialOuterRadius = 0, innerRadius: initialInnerRadius = 0 } = initialElementState;
           if (initialOuterRadius === 0) break; // Avoid division by zero
           const delta = calculateDistanceChange(resizeHandle, dx, dy);
           const newOuterRadius = Math.max(5, initialOuterRadius + delta);
           const ratio = initialInnerRadius / initialOuterRadius;
           const newInnerRadius = Math.max(2, newOuterRadius * ratio); // Ensure inner radius is also reasonable
           update = { outerRadius: newOuterRadius, innerRadius: newInnerRadius };
           break;
         }
         case 'text': {
           const { fontSize: initialFontSize = 16 } = initialElementState;
           // Use vertical drag distance primarily to control font size
           // Use the larger delta (dx or dy) for more intuitive scaling from corners
           const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
           let scaleFactor = 0;

           // Determine scale direction based on handle
           if (resizeHandle.includes('bottom') || resizeHandle.includes('right')) {
              scaleFactor = delta; // Increase size
           } else if (resizeHandle.includes('top') || resizeHandle.includes('left')) {
              scaleFactor = -delta; // Decrease size
           }
           
           // Adjust sensitivity - a smaller multiplier makes resizing less drastic
           const sensitivity = 0.5; 
           let newFontSize = initialFontSize + (scaleFactor * sensitivity);

           // Apply minimum font size
           newFontSize = Math.max(8, newFontSize); // Minimum font size of 8
           update = { fontSize: newFontSize };
           break;
         }
        default: 
          break; // Ignore non-resizable types like line
      }

      if (Object.keys(update).length > 0) {
         onElementResize(activeElementId, update);
      }

    } else if (isDragging && activeElementId) {
      const selectedElement = elements.find(el => el.id === activeElementId);
      if (!selectedElement) return;
      const dx = currentMousePos.x - dragStartPos.x;
      const dy = currentMousePos.y - dragStartPos.y;

      if (selectedElement.type === 'line' && selectedElement.points) {
        const newPoints = selectedElement.points.map(point => ({
          x: point.x + dx,
          y: point.y + dy
        }));
        onElementDrag(activeElementId, {
          position: { x: selectedElement.position.x + dx, y: selectedElement.position.y + dy },
          points: newPoints
        });
      } else {
        onElementDrag(activeElementId, {
          position: { x: selectedElement.position.x + dx, y: selectedElement.position.y + dy }
        });
      }
      setDragStartPos(currentMousePos);
    }
  };

  // Handle mouse up (end of drag/resize/endpoint move)
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setResizeStartState(null); 
    setIsMovingEndpoint(false); // Clear endpoint move state
    setMovingPointInfo(null);
  };

  // Handle mouse leave (similar to mouse up)
  const handleMouseLeave = () => {
    if (isResizing || isDragging || isMovingEndpoint) {
       // Reset all states on mouse leave
       setIsDragging(false);
       setIsResizing(false);
       setResizeHandle(null);
       setResizeStartState(null);
       setIsMovingEndpoint(false);
       setMovingPointInfo(null);
    }
  };

  // Handle mouse down on canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).classList?.contains('resize-handle') || 
        (e.target as SVGElement).classList?.contains('line-endpoint-handle')) {
       return; // Ignore clicks on any handle
    }
    
    const position = getCanvasCoordinates(e);
    const selectedId = onSelectElementAtPosition(position);
    
    if (selectedId) {
      setIsDragging(true);
      setDragStartPos(position);
      setActiveElementId(selectedId);
      // Ensure resizing state is cleared if clicking on an element directly
      setIsResizing(false); 
      setResizeStartState(null);
    } else {
      onSelectElement(null);
      setIsDragging(false); // Stop dragging if clicking empty space
    }
  };

  return (
    <div 
      ref={canvasRef}
      className="canvas-container"
      style={{ 
        width: canvasWidth, 
        height: canvasHeight,
        transform: `scale(${zoomLevel})`,
        background,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {showGrid && (
        <Grid width={canvasWidth} height={canvasHeight} gridSize={gridSize} />
      )}
      
      <svg 
        width={canvasWidth} 
        height={canvasHeight} 
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      >
        {elements.map(element => (
          <SVGElement 
            key={element.id} 
            element={element}
            onResizeStart={handleResizeStart}
            onEndpointDown={handleEndpointDown}
          />
        ))}
      </svg>
    </div>
  );
};

export default Canvas; 