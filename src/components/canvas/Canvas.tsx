import React, { useRef, useState, useEffect } from 'react';
import { LogoElement, Position } from '../../types';
import SVGElement from './SVGElement';
import Grid from './Grid';
import { getElementBounds } from '../../utils/elementUtils';
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
  onZoomChange: (newZoomLevel: number) => void;
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

// Tolerance for snapping to center guides (in canvas units)
const CENTERING_TOLERANCE = 3;

type ElementBounds = { top: number; left: number; right: number; bottom: number } | null;

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
  onZoomChange,
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
  const [controlsStyle, setControlsStyle] = useState({ bottom: '16px', right: '16px' });
  const [showVerticalGuide, setShowVerticalGuide] = useState<number | null>(null);
  const [showHorizontalGuide, setShowHorizontalGuide] = useState<number | null>(null);

  useEffect(() => {
    const selectedElement = elements.find(el => el.selected);
    setActiveElementId(selectedElement?.id || null);
  }, [elements]);

  useEffect(() => {
    const updateControlsPosition = () => {
      if (!canvasRef.current) return;
      const mainContent = canvasRef.current.closest('.main-content');
      if (!mainContent) return;

      const rect = mainContent.getBoundingClientRect();
      setControlsStyle({
        bottom: `${window.innerHeight - rect.bottom + 16}px`,
        right: `${window.innerWidth - rect.right + 16}px`
      });
    };

    updateControlsPosition();
    window.addEventListener('resize', updateControlsPosition);
    return () => window.removeEventListener('resize', updateControlsPosition);
  }, []);

  const getCanvasCoordinates = (e: React.MouseEvent): Position => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoomLevel,
      y: (e.clientY - rect.top) / zoomLevel,
    };
  };

  const handleResizeStart = (handle: string, event: React.MouseEvent) => {
    const element = elements.find(el => el.id === activeElementId);
    if (!element || element.locked || ['line', 'arrow', 'curvedLine'].includes(element.type)) return;

    const initialCanvasMousePos = getCanvasCoordinates(event);
    setIsResizing(true);
    setResizeHandle(handle);
    setIsDragging(false);
    setIsMovingEndpoint(false);

    setResizeStartState({
        initialElementState: { ...element },
        initialMousePos: initialCanvasMousePos
    });
  };

  const handleEndpointDown = (elementId: string, pointIndex: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent canvas interaction
    const element = elements.find(el => el.id === elementId);
    if (element?.locked) return;

    const initialMousePos = getCanvasCoordinates(event);
    setIsMovingEndpoint(true);
    setMovingPointInfo({ elementId, pointIndex, initialMousePos });
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(4, zoomLevel + 0.1);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.1, zoomLevel - 0.1);
    onZoomChange(newZoom);
  };

  const handleZoomReset = () => {
    onZoomChange(1);
  };

  const getCenterFromBounds = (bounds: NonNullable<ElementBounds>): Position => {
    return {
      x: (bounds.left + bounds.right) / 2,
      y: (bounds.top + bounds.bottom) / 2
    };
  };

  const doBoundsIntersect = (bounds1: ElementBounds, bounds2: ElementBounds): boolean => {
    if (!bounds1 || !bounds2) return false;
    return (
      bounds1.left < bounds2.right &&
      bounds1.right > bounds2.left &&
      bounds1.top < bounds2.bottom &&
      bounds1.bottom > bounds2.top
    );
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const currentMousePos = getCanvasCoordinates(e);
    let currentVerticalGuide: number | null = null;
    let currentHorizontalGuide: number | null = null;

    const calculateAndSetGuides = (activeId: string, potentialBounds: ElementBounds) => {
        if (!potentialBounds) {
            return;
        }

        const activeCenter = getCenterFromBounds(potentialBounds);
        let targetX = canvasWidth / 2; 
        let targetY = canvasHeight / 2; 
        let relativeTargetFound = false;

        let closestCenterDistSq = Infinity; 
        let closestTargetCenter: Position | null = null;

        // Check against other elements
        elements.forEach(el => {
            if (el.id === activeId || el.locked) return;
            const elBounds = getElementBounds(el);
            if (elBounds && doBoundsIntersect(potentialBounds, elBounds)) {
                const elCenter = getCenterFromBounds(elBounds);
                const dxCenter = activeCenter.x - elCenter.x;
                const dyCenter = activeCenter.y - elCenter.y;
                const distSq = dxCenter * dxCenter + dyCenter * dyCenter;
                if (distSq < closestCenterDistSq) {
                    closestCenterDistSq = distSq;
                    closestTargetCenter = elCenter;
                    relativeTargetFound = true;
                }
            }
        });

        if (relativeTargetFound && closestTargetCenter) {
            targetX = (closestTargetCenter as Position).x;
            targetY = (closestTargetCenter as Position).y;
        }

        // Check for vertical alignment
        if (Math.abs(activeCenter.x - targetX) < CENTERING_TOLERANCE / zoomLevel) {
            currentVerticalGuide = targetX;
        }
        // Check for horizontal alignment
        if (Math.abs(activeCenter.y - targetY) < CENTERING_TOLERANCE / zoomLevel) {
            currentHorizontalGuide = targetY;
        }
    };

    if (isMovingEndpoint && movingPointInfo) {
      const { elementId } = movingPointInfo;
      
      const element = elements.find(el => el.id === elementId);
      
      if (element) {
        if (element.type === 'curvedLine') {
          const { position, rotation = 0 } = element;
          const dx = currentMousePos.x - position.x;
          const dy = currentMousePos.y - position.y;
          const angleRad = -rotation * (Math.PI / 180);
          const cosAngle = Math.cos(angleRad);
          const sinAngle = Math.sin(angleRad);
          const localX = dx * cosAngle - dy * sinAngle;
          const localY = dx * sinAngle + dy * cosAngle;
          const newLocalPosition: Position = { x: localX, y: localY };
          onElementPointUpdate(elementId, movingPointInfo.pointIndex, newLocalPosition);
        } else {
          onElementPointUpdate(elementId, movingPointInfo.pointIndex, currentMousePos);
        }
      }
    }
    else if (isResizing && resizeHandle && resizeStartState && activeElementId) {
      const { initialElementState, initialMousePos } = resizeStartState;
      const initialCenter = initialElementState.position;
      const rotation = initialElementState.rotation || 0;

      const dx = currentMousePos.x - initialCenter.x;
      const dy = currentMousePos.y - initialCenter.y;

      let update: Partial<LogoElement> = {};
      let potentialElementState: LogoElement | null = null;

      const angleRad = -rotation * (Math.PI / 180);
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      const rotatedX = dx * cos - dy * sin;
      const rotatedY = dx * sin + dy * cos;

      switch (initialElementState.type) {
        case 'rectangle': {
            const initialDimensions = initialElementState.dimensions;
            if (!initialDimensions) break;
            let newWidth = initialDimensions.width;
            let newHeight = initialDimensions.height;
            if (resizeHandle.includes('e') || resizeHandle.includes('w')) {
                newWidth = Math.max(10, 2 * Math.abs(rotatedX));
            }
            if (resizeHandle.includes('n') || resizeHandle.includes('s')) {
                newHeight = Math.max(10, 2 * Math.abs(rotatedY));
            }
            newWidth = Math.max(10, newWidth);
            newHeight = Math.max(10, newHeight);
            update = { dimensions: { width: newWidth, height: newHeight } };
            break;
        }
        case 'ellipse': {
            const newRx = Math.max(5, Math.abs(rotatedX));
            const newRy = Math.max(5, Math.abs(rotatedY));
            update = { rx: newRx, ry: newRy };
            break;
        }
        case 'circle': {
            const newRadius = Math.max(5, Math.max(Math.abs(dx), Math.abs(dy)));
            update = { radius: newRadius };
            break;
        }
        case 'polygon':
        case 'hexagon':
        case 'pentagon':
        case 'octagonStar': {
            const newRadius = Math.max(5, Math.max(Math.abs(dx), Math.abs(dy)));
            update = { radius: newRadius };
            break;
        }
        case 'star': {
            const newOuterRadius = Math.max(5, Math.max(Math.abs(dx), Math.abs(dy)));
            let newInnerRadius = initialElementState.innerRadius || 0;
            const initialOuterRadius = initialElementState.outerRadius || 0;
            if (initialOuterRadius > 0 && newInnerRadius > 0) { 
                const ratio = newInnerRadius / initialOuterRadius;
                newInnerRadius = Math.max(2, newOuterRadius * ratio);
            }
            update = { outerRadius: newOuterRadius, innerRadius: newInnerRadius };
            break;
        }
        case 'text': {
            const dx_delta = currentMousePos.x - initialMousePos.x;
            const dy_delta = currentMousePos.y - initialMousePos.y;
            const { fontSize: initialFontSize = 16 } = initialElementState;
            const delta = (Math.abs(dx_delta) > Math.abs(dy_delta) ? dx_delta : dy_delta);
            let scaleFactor = 0;
            if (resizeHandle.includes('s') || resizeHandle.includes('e')) scaleFactor = delta;
            else if (resizeHandle.includes('n') || resizeHandle.includes('w')) scaleFactor = -delta;
            const sensitivity = 0.5;
            let newFontSize = initialFontSize + (scaleFactor * sensitivity);
            newFontSize = Math.max(8, newFontSize);
            update = { fontSize: newFontSize };
            break;
        }
        case 'arrow': { 
          const { points } = initialElementState;
          if (!points || points.length < 2) break;
          
          const pointIndex = resizeHandle === 'start' ? 0 : 1; 
          
          const newPoints = [...points];
          newPoints[pointIndex] = currentMousePos; 
          
          update = { points: newPoints };
          break;
        }
        case 'cloud': {
          const { position: initialPosition, dimensions: initialDimensions, pathData: initialPathData } = initialElementState;
          if (!initialDimensions || !initialPathData) break;

          const dx_delta = currentMousePos.x - initialMousePos.x;
          const dy_delta = currentMousePos.y - initialMousePos.y;

          let newX = initialPosition.x;
          let newY = initialPosition.y;
          let newWidth = initialDimensions.width;
          let newHeight = initialDimensions.height;

          if (resizeHandle.includes('e')) {
            newWidth = Math.max(10, initialDimensions.width + dx_delta);
          } else if (resizeHandle.includes('w')) {
            const calculatedWidth = Math.max(10, initialDimensions.width - dx_delta);
            newX = initialPosition.x + (initialDimensions.width - calculatedWidth);
            newWidth = calculatedWidth;
          }
          if (resizeHandle.includes('s')) {
            newHeight = Math.max(10, initialDimensions.height + dy_delta);
          } else if (resizeHandle.includes('n')) {
            const calculatedHeight = Math.max(10, initialDimensions.height - dy_delta);
            newY = initialPosition.y + (initialDimensions.height - calculatedHeight);
            newHeight = calculatedHeight;
          }

          const scaleX = initialDimensions.width === 0 ? 1 : newWidth / initialDimensions.width;
          const scaleY = initialDimensions.height === 0 ? 1 : newHeight / initialDimensions.height;
          
          const pathCommands = initialPathData.match(/[A-Z][^A-Za-z]*/g) || [];
          const scaledCommands = pathCommands.map(cmd => {
            const command = cmd[0];
            const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
            
            switch (command) {
              case 'M': case 'L':
                return `${command}${coords[0] * scaleX} ${coords[1] * scaleY}`;
              case 'C':
                return `${command}${coords[0] * scaleX} ${coords[1] * scaleY} ${coords[2] * scaleX} ${coords[3] * scaleY} ${coords[4] * scaleX} ${coords[5] * scaleY}`;
              default: return cmd;
            }
          });

          update = {
            position: { x: newX, y: newY }, 
            dimensions: { width: newWidth, height: newHeight },
            pathData: scaledCommands.join(' ')
          };
          break;
        }
        case 'blockArrow': {
          const { position: initialPosition, dimensions: initialDimensions } = initialElementState;
          if (!initialDimensions) break;

          // Calculate delta from the initial mouse position in rotated space
          const angleRad = -(initialElementState.rotation || 0) * (Math.PI / 180);
          const cos = Math.cos(angleRad);
          const sin = Math.sin(angleRad);
          
          // Transform the mouse movement into the rotated space
          const dx_rotated = (currentMousePos.x - initialMousePos.x) * cos - (currentMousePos.y - initialMousePos.y) * sin;
          const dy_rotated = (currentMousePos.x - initialMousePos.x) * sin + (currentMousePos.y - initialMousePos.y) * cos;

          let newWidth = initialDimensions.width;
          let newHeight = initialDimensions.height;

          // Apply deltas based on handle in rotated space
          if (resizeHandle.includes('e')) {
            newWidth = Math.max(20, initialDimensions.width + dx_rotated * 2);
          } else if (resizeHandle.includes('w')) {
            newWidth = Math.max(20, initialDimensions.width - dx_rotated * 2);
          }
          if (resizeHandle.includes('s')) {
            newHeight = Math.max(10, initialDimensions.height + dy_rotated * 2);
          } else if (resizeHandle.includes('n')) {
            newHeight = Math.max(10, initialDimensions.height - dy_rotated * 2);
          }

          // Calculate points relative to center
          const headWidth = newHeight; // Head width equals height
          const bodyWidth = Math.max(0, newWidth - headWidth);
          const bodyHeight = newHeight * 0.6;
          
          const newPoints = [
            { x: -newWidth/2, y: -bodyHeight/2 }, // Body start top
            { x: -newWidth/2 + bodyWidth, y: -bodyHeight/2 }, // Body end top
            { x: -newWidth/2 + bodyWidth, y: -newHeight/2 }, // Head start top
            { x: newWidth/2, y: 0 }, // Head point
            { x: -newWidth/2 + bodyWidth, y: newHeight/2 }, // Head start bottom
            { x: -newWidth/2 + bodyWidth, y: bodyHeight/2 }, // Body end bottom
            { x: -newWidth/2, y: bodyHeight/2 }, // Body start bottom
          ];

          update = { 
            dimensions: { width: newWidth, height: newHeight },
            points: newPoints
          };
          break;
        }
         default:
            console.warn("Resize logic not fully implemented for type:", initialElementState.type);
            break;
      }

      if (Object.keys(update).length > 0) {
          const currentElement = elements.find(el => el.id === activeElementId);
          if(currentElement){
             potentialElementState = { ...currentElement, ...update };
             const potentialBounds = getElementBounds(potentialElementState);
             calculateAndSetGuides(activeElementId, potentialBounds);
             onElementResize(activeElementId, update);
          }
      }
    }
    else if (isDraggingMultiple) {
      const dx = currentMousePos.x - dragStartPos.x;
      const dy = currentMousePos.y - dragStartPos.y;
      
      if (dx !== 0 || dy !== 0) {
        onDragMultipleElements(dx, dy);
        setDragStartPos(currentMousePos);
      }
    }
    else if (isDragging && activeElementId) {
      const selectedElement = elements.find(el => el.id === activeElementId);
      if (!selectedElement) return;
      const dx = currentMousePos.x - dragStartPos.x;
      const dy = currentMousePos.y - dragStartPos.y;

      if ((selectedElement.type === 'line' || selectedElement.type === 'arrow') && selectedElement.points) {
        const newPoints = selectedElement.points.map(point => ({
          x: point.x + dx,
          y: point.y + dy
        }));
        const newPosition = { x: selectedElement.position.x + dx, y: selectedElement.position.y + dy };
        const potentialElementState = { ...selectedElement, position: newPosition, points: newPoints };
        const potentialBounds = getElementBounds(potentialElementState);
        calculateAndSetGuides(activeElementId, potentialBounds);
        onElementDrag(activeElementId, { position: newPosition, points: newPoints });
        setDragStartPos(currentMousePos);
      } else {
        const newPosition = { x: selectedElement.position.x + dx, y: selectedElement.position.y + dy };
        const potentialElementState = { ...selectedElement, position: newPosition };
        const potentialBounds = getElementBounds(potentialElementState);
        calculateAndSetGuides(activeElementId, potentialBounds);
        onElementDrag(activeElementId, { position: newPosition });
        setDragStartPos(currentMousePos);
      }
    }
    else if (isMarqueeSelecting && marqueeStartPos) {
       setMarqueeEndPos(currentMousePos);
    }

    // Update the actual guide state after calculations
    setShowVerticalGuide(currentVerticalGuide);
    setShowHorizontalGuide(currentHorizontalGuide);
  };

  const handleMouseUp = () => {
    if (isDraggingMultiple) {
      const selectedIds = elements.filter(el => el.selected).map(el => el.id);
      if (selectedIds.length > 0) {
        onSelectMultipleElements(selectedIds);
      }
    }
    
    if (isMarqueeSelecting && marqueeStartPos && marqueeEndPos) {
       const minX = Math.min(marqueeStartPos.x, marqueeEndPos.x);
       const maxX = Math.max(marqueeStartPos.x, marqueeEndPos.x);
       const minY = Math.min(marqueeStartPos.y, marqueeEndPos.y);
       const maxY = Math.max(marqueeStartPos.y, marqueeEndPos.y);
       
       const selectedIds = elements.filter(el => {
          return el.position.x >= minX && el.position.x <= maxX &&
                 el.position.y >= minY && el.position.y <= maxY;
       }).map(el => el.id);
       
       onSelectMultipleElements(selectedIds);
    }
    
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
    setDragStartPos({ x: 0, y: 0 });

    // Reset centering guides
    setShowVerticalGuide(null);
    setShowHorizontalGuide(null);
  };

  const handleMouseLeave = () => {
    if (isResizing || isDragging || isMovingEndpoint || isMarqueeSelecting || isDraggingMultiple) {
       handleMouseUp();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest('.resize-handle') || 
        (e.target as SVGElement).closest('.line-endpoint-handle')) {
       return; 
    }
    
    const position = getCanvasCoordinates(e);
    const clickedElementId = onSelectElementAtPosition(position);
    const clickedElement = clickedElementId ? elements.find(el => el.id === clickedElementId) : null;
    const shiftKeyPressed = e.shiftKey;
    const selectedElementsCount = elements.filter(el => el.selected).length;
    const isClickOnSelectedElement = clickedElement?.selected ?? false;
    const selectedElementIds = elements.filter(el => el.selected).map(el => el.id);

    // Don't allow dragging or resizing of locked elements
    if (clickedElement?.locked) {
      return;
    }

    if (isClickOnSelectedElement && selectedElementsCount > 1 && !shiftKeyPressed) {
        // Don't allow dragging if any selected element is locked
        if (elements.some(el => el.selected && el.locked)) {
          return;
        }
        setIsDraggingMultiple(true);
        setDragStartPos(position);
        setActiveElementId(clickedElementId);
        onSelectMultipleElements(selectedElementIds);
        setIsDragging(false);
        setIsResizing(false); 
        setIsMarqueeSelecting(false);
        setMovingPointInfo(null);
        setResizeStartState(null);
    }
    else if (clickedElementId && clickedElement) {
        if (shiftKeyPressed) {
            const currentSelection = elements.filter(el => el.selected).map(el => el.id);
            let newSelectionIds;
            if (isClickOnSelectedElement) { 
                newSelectionIds = currentSelection.filter(id => id !== clickedElementId);
            } else { 
                newSelectionIds = [...currentSelection, clickedElementId];
            }
            onSelectMultipleElements(newSelectionIds); 
            setIsDragging(false); 
            setIsDraggingMultiple(false);
            setIsResizing(false); 
            setIsMarqueeSelecting(false);
            setMovingPointInfo(null);
            setResizeStartState(null);
        } else {
            if (!isClickOnSelectedElement || selectedElementsCount !== 1) {
              onSelectElement(clickedElementId); 
            }
            setIsDragging(!clickedElement.locked); 
            setDragStartPos(position);
            setActiveElementId(clickedElementId);
            setIsResizing(false); 
            setIsMarqueeSelecting(false);
            setIsDraggingMultiple(false);
            setMovingPointInfo(null);
            setResizeStartState(null);
        }
    }
    else {
      onSelectElement(null);
      setIsMarqueeSelecting(true);
      setMarqueeStartPos(position);
      setMarqueeEndPos(position); 
      setIsDragging(false);
      setIsResizing(false);
      setIsDraggingMultiple(false);
      setMovingPointInfo(null);
      setResizeStartState(null);
    }
  };

  return (
    <>
      <div 
        ref={canvasRef}
        className="canvas-container"
        style={{ 
          width: canvasWidth * zoomLevel,
          height: canvasHeight * zoomLevel,
          cursor: isDragging || isDraggingMultiple ? 'grabbing' : isResizing ? 'crosshair' : 'default',
          background,
          overflow: 'hidden',
          position: 'relative'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {showGrid && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: canvasWidth, height: canvasHeight, transform: `scale(${zoomLevel})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
            <Grid width={canvasWidth} height={canvasHeight} gridSize={gridSize} />
          </div>
        )}
        
        <svg 
          width={canvasWidth} 
          height={canvasHeight} 
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          style={{ 
            display: 'block',
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top left',
            overflow: 'visible'
          }}
        >
          {elements.map(element => (
            <SVGElement 
              key={element.id} 
              element={element}
              onResizeStart={handleResizeStart}
              onEndpointDown={handleEndpointDown}
            />
          ))}

          {isMarqueeSelecting && marqueeStartPos && marqueeEndPos && (
            <rect
              x={Math.min(marqueeStartPos.x, marqueeEndPos.x)}
              y={Math.min(marqueeStartPos.y, marqueeEndPos.y)}
              width={Math.abs(marqueeStartPos.x - marqueeEndPos.x)}
              height={Math.abs(marqueeStartPos.y - marqueeEndPos.y)}
              fill="rgba(33, 150, 243, 0.1)"
              stroke="#2196f3"
              strokeWidth={1 / zoomLevel}
              strokeDasharray={`${4 / zoomLevel} ${2 / zoomLevel}`}
              vectorEffect="non-scaling-stroke"
              rx={2 / zoomLevel}
              ry={2 / zoomLevel}
              style={{ pointerEvents: 'none' }}
            />
          )}

          {showVerticalGuide !== null && (
              <line 
                  x1={showVerticalGuide}
                  y1={0}
                  x2={showVerticalGuide}
                  y2={canvasHeight}
                  stroke="#FF00FF"
                  strokeWidth={1}
                  strokeDasharray="4 2" 
                  vectorEffect="non-scaling-stroke"
                  style={{ pointerEvents: 'none' }}
              />
          )}
          {showHorizontalGuide !== null && (
              <line 
                  x1={0}
                  y1={showHorizontalGuide}
                  x2={canvasWidth}
                  y2={showHorizontalGuide}
                  stroke="#FF00FF"
                  strokeWidth={1}
                  strokeDasharray="4 2" 
                  vectorEffect="non-scaling-stroke"
                  style={{ pointerEvents: 'none' }}
              />
          )}

        </svg>
      </div>

      <div className="canvas-controls" style={controlsStyle}>
        <button onClick={handleZoomOut} title="Zoom Out">−</button>
        <button onClick={handleZoomReset} title="Reset Zoom">{Math.round(zoomLevel * 100)}%</button>
        <button onClick={handleZoomIn} title="Zoom In">+</button>
      </div>
    </>
  );
};

export default Canvas; 