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
  onElementResize: (elementId: string, updates: Partial<Pick<LogoElement, 'position' | 'dimensions'>>) => void;
}

interface ResizeStartState {
  initialPosition: Position;
  initialDimensions: Dimensions;
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
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<Position>({ x: 0, y: 0 });
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStartState, setResizeStartState] = useState<ResizeStartState | null>(null);

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
    if (!element || !element.dimensions) return;

    const initialCanvasMousePos = getCanvasCoordinates(event);

    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStartState({
      initialPosition: { ...element.position },
      initialDimensions: { ...element.dimensions },
      initialMousePos: initialCanvasMousePos,
    });
    // Prevent dragging during resize
    setIsDragging(false);
  };

  // Handle mouse move (for dragging and resizing)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!activeElementId || !canvasRef.current) return;
    
    const currentMousePos = getCanvasCoordinates(e);
    
    if (isResizing && resizeHandle && resizeStartState) {
      const { initialPosition, initialDimensions, initialMousePos } = resizeStartState;
      // Calculate delta based on canvas coordinates
      const dx = currentMousePos.x - initialMousePos.x;
      const dy = currentMousePos.y - initialMousePos.y;

      let newX = initialPosition.x;
      let newY = initialPosition.y;
      let newWidth = initialDimensions.width;
      let newHeight = initialDimensions.height;

      // Apply delta to initial state
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

      onElementResize(activeElementId, {
        position: { x: newX, y: newY },
        dimensions: { width: newWidth, height: newHeight }
      });

    } else if (isDragging) {
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

  // Handle mouse up (end of drag/resize)
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setResizeStartState(null); // Clear resize start state
  };

  // Handle mouse leave (end of drag/resize)
  const handleMouseLeave = () => {
    if (isResizing) {
       // Optional: Decide if resize should cancel or complete on mouse leave
       // For now, let's complete it
       setIsResizing(false);
       setResizeHandle(null);
       setResizeStartState(null);
    }
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // Handle mouse down on canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent initiating drag/select if clicking on a resize handle (event bubbles up)
    if ((e.target as SVGElement).classList?.contains('resize-handle')) {
       return;
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
          />
        ))}
      </svg>
    </div>
  );
};

export default Canvas; 