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
  onSelectMultipleElements: (elementIds: string[]) => void;
  onDragMultipleElements: (dx: number, dy: number) => void;
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
  onSelectMultipleElements,
  onDragMultipleElements,
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
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState<boolean>(false);
  const [marqueeStartPos, setMarqueeStartPos] = useState<Position | null>(null);
  const [marqueeEndPos, setMarqueeEndPos] = useState<Position | null>(null);
  const [isDraggingMultiple, setIsDraggingMultiple] = useState<boolean>(false);

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

  // Handle mouse move (for dragging, resizing shapes, moving points, and marquee selection)
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

    }
    // Handle dragging multiple elements
    else if (isDraggingMultiple) {
      const dx = currentMousePos.x - dragStartPos.x;
      const dy = currentMousePos.y - dragStartPos.y;
      
      // Only perform the drag if there's actual movement
      if (dx !== 0 || dy !== 0) {
        onDragMultipleElements(dx, dy);
        setDragStartPos(currentMousePos);
      }
    }
    // Handle dragging a single element
    else if (isDragging && activeElementId) {
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
    // Handle Marquee Selection
    else if (isMarqueeSelecting && marqueeStartPos) {
       setMarqueeEndPos(currentMousePos);
    }
  };

  // Handle mouse up (end of drag/resize/endpoint move/marquee)
  const handleMouseUp = () => {
    if (isDraggingMultiple) {
      // Apply final state to history after batch drag is complete
      // This ensures the drag operation is one atomic undo step
      const selectedIds = elements.filter(el => el.selected).map(el => el.id);
      
      // Re-apply selection to ensure it's maintained after the drag completes
      if (selectedIds.length > 0) {
        onSelectMultipleElements(selectedIds);
      }
    }
    
    if (isMarqueeSelecting && marqueeStartPos && marqueeEndPos) {
       // Determine elements within the marquee
       const minX = Math.min(marqueeStartPos.x, marqueeEndPos.x);
       const maxX = Math.max(marqueeStartPos.x, marqueeEndPos.x);
       const minY = Math.min(marqueeStartPos.y, marqueeEndPos.y);
       const maxY = Math.max(marqueeStartPos.y, marqueeEndPos.y);
       
       const selectedIds = elements.filter(el => {
          // Simple center point check for now (can be improved to check bounds)
          return el.position.x >= minX && el.position.x <= maxX &&
                 el.position.y >= minY && el.position.y <= maxY;
       }).map(el => el.id);
       
       onSelectMultipleElements(selectedIds);
    }
    
    // Reset all states
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setResizeStartState(null); 
    setIsMovingEndpoint(false); 
    setMovingPointInfo(null);
    setIsMarqueeSelecting(false);
    setMarqueeStartPos(null);
    setMarqueeEndPos(null);
    setIsDraggingMultiple(false);
  };

  // Handle mouse leave (reset marquee as well)
  const handleMouseLeave = () => {
    if (isResizing || isDragging || isMovingEndpoint || isMarqueeSelecting || isDraggingMultiple) {
       // Reset all states
       setIsDragging(false);
       setIsResizing(false);
       setResizeHandle(null);
       setResizeStartState(null);
       setIsMovingEndpoint(false);
       setMovingPointInfo(null);
       setIsMarqueeSelecting(false);
       setMarqueeStartPos(null);
       setMarqueeEndPos(null);
       setIsDraggingMultiple(false);
    }
  };

  // Handle mouse down on canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignore clicks on handles first
    if ((e.target as SVGElement).classList?.contains('resize-handle') || 
        (e.target as SVGElement).classList?.contains('line-endpoint-handle')) {
       return; 
    }
    
    const position = getCanvasCoordinates(e);
    const clickedElementId = onSelectElementAtPosition(position);
    const clickedElement = clickedElementId ? elements.find(el => el.id === clickedElementId) : null;
    const shiftKeyPressed = e.shiftKey;
    const selectedElementsCount = elements.filter(el => el.selected).length;
    const isClickOnSelectedElement = clickedElement?.selected ?? false;
    const selectedElementIds = elements.filter(el => el.selected).map(el => el.id);

    // Case 1: Click on an element that's part of a multi-selection? Start multi-drag.
    if (isClickOnSelectedElement && selectedElementsCount > 1 && !shiftKeyPressed) {
        // Important: Keep the current selection intact, don't call onSelectElement
        // We specifically want to preserve the multi-selection
        
        setIsDraggingMultiple(true);
        setDragStartPos(position); // Use current canvas coordinates
        setActiveElementId(clickedElementId);
        
        // Re-apply multi-selection to ensure state is fresh
        onSelectMultipleElements(selectedElementIds);
        
        // Reset other modes
        setIsDragging(false);
        setIsResizing(false); 
        setIsMarqueeSelecting(false);
        setMovingPointInfo(null);
        setResizeStartState(null);
    }
    // Case 2: Click on any element (selected or not)
    else if (clickedElementId && clickedElement) {
        if (shiftKeyPressed) {
            // Toggle selection: Add if unselected, remove if selected
            const currentSelection = elements.filter(el => el.selected).map(el => el.id);
            let newSelectionIds;
            if (isClickOnSelectedElement) { 
                newSelectionIds = currentSelection.filter(id => id !== clickedElementId);
            } else { 
                newSelectionIds = [...currentSelection, clickedElementId];
            }
            onSelectMultipleElements(newSelectionIds); 
            // Reset interaction modes, important not to start drag on shift-click
            setIsDragging(false); 
            setIsDraggingMultiple(false);
            setIsResizing(false); 
            setIsMarqueeSelecting(false);
            setMovingPointInfo(null);
            setResizeStartState(null);
        } else {
            // Normal single element select/drag start
            // Select *only* this one if it wasn't already the sole selected item
            if (!isClickOnSelectedElement || selectedElementsCount !== 1) {
              onSelectElement(clickedElementId); 
            }
            setIsDragging(true); 
            setDragStartPos(position); // Use current canvas coordinates
            setActiveElementId(clickedElementId);
             // Reset other modes
            setIsResizing(false); 
            setIsMarqueeSelecting(false);
            setIsDraggingMultiple(false);
            setMovingPointInfo(null);
            setResizeStartState(null);
        }
    }
    // Case 3: Click on empty space - Start marquee selection
    else {
      onSelectElement(null); // Deselect all
      setIsMarqueeSelecting(true);
      setMarqueeStartPos(position);
      setMarqueeEndPos(position); 
      // Reset other modes
      setIsDragging(false);
      setIsResizing(false);
      setIsDraggingMultiple(false);
      setMovingPointInfo(null);
      setResizeStartState(null);
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
        style={{ overflow: 'visible' }} // Allow marquee rect to potentially go outside
      >
        {/* Render elements in their proper z-index order */}
        {elements.map(element => (
          <SVGElement 
            key={element.id} 
            element={element}
            onResizeStart={handleResizeStart}
            onEndpointDown={handleEndpointDown}
          />
        ))}

        {/* Render Marquee Selection Rectangle */}
        {isMarqueeSelecting && marqueeStartPos && marqueeEndPos && (
           <rect
              x={Math.min(marqueeStartPos.x, marqueeEndPos.x)}
              y={Math.min(marqueeStartPos.y, marqueeEndPos.y)}
              width={Math.abs(marqueeStartPos.x - marqueeEndPos.x)}
              height={Math.abs(marqueeStartPos.y - marqueeEndPos.y)}
              fill="rgba(0, 100, 255, 0.1)" // Semi-transparent blue fill
              stroke="rgba(0, 100, 255, 0.5)" // Blue stroke
              strokeWidth={1 / zoomLevel} // Adjust stroke width based on zoom
              vectorEffect="non-scaling-stroke" // Keep stroke consistent
              pointerEvents="none" // Don't let it interfere with mouse events
           />
        )}
      </svg>
    </div>
  );
};

export default Canvas; 