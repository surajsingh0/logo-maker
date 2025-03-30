import React, { useRef, useState, useEffect } from 'react';
import { LogoElement, Position } from '../../types';
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
  onElementDrag: (elementId: string, newPosition: Position) => void;
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
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<Position>({ x: 0, y: 0 });
  const [activeElementId, setActiveElementId] = useState<string | null>(null);

  useEffect(() => {
    const selectedElement = elements.find(el => el.selected);
    setActiveElementId(selectedElement?.id || null);
  }, [elements]);

  // Get canvas-relative coordinates from mouse event
  const getCanvasCoordinates = (e: React.MouseEvent): Position => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoomLevel,
      y: (e.clientY - rect.top) / zoomLevel,
    };
  };

  // Handle mouse down on canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    const position = getCanvasCoordinates(e);
    
    // Try to select an element at this position
    const selectedId = onSelectElementAtPosition(position);
    
    if (selectedId) {
      setIsDragging(true);
      setDragStartPos(position);
      setActiveElementId(selectedId);
    } else {
      // Clicked on empty space
      onSelectElement(null);
    }
  };

  // Handle mouse move (for dragging)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !activeElementId) return;
    
    const position = getCanvasCoordinates(e);
    const selectedElement = elements.find(el => el.id === activeElementId);
    
    if (selectedElement) {
      // Calculate new position based on drag delta
      const newPosition = {
        x: selectedElement.position.x + (position.x - dragStartPos.x),
        y: selectedElement.position.y + (position.y - dragStartPos.y),
      };
      
      onElementDrag(activeElementId, newPosition);
      setDragStartPos(position);
    }
  };

  // Handle mouse up (end of drag)
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle mouse leave (end of drag)
  const handleMouseLeave = () => {
    setIsDragging(false);
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
          />
        ))}
      </svg>
    </div>
  );
};

export default Canvas; 