import React, { useRef, useState, useLayoutEffect } from 'react';
import { LogoElement, Position } from '../../types';
import ResizeHandles from './ResizeHandles';

interface SVGElementProps {
  element: LogoElement;
  onResizeStart?: (handle: string, event: React.MouseEvent) => void;
  onEndpointDown?: (elementId: string, pointIndex: number, event: React.MouseEvent) => void;
}

// Helper function to generate polygon points relative to center (0,0)
const getPolygonPoints = (type: LogoElement['type'], element: LogoElement): string => {
    let points: Position[] = [];
    const radius = element.radius || 0;
    const outerRadius = element.outerRadius || 0;
    const innerRadius = element.innerRadius || 0;

    if (type === 'polygon') { const s = element.sides || 3; if(radius<=0) return ''; for (let i = 0; i < s; i++) { const a = (i / s) * 2 * Math.PI - Math.PI / 2; points.push({ x: radius * Math.cos(a), y: radius * Math.sin(a) }); } }
    else if (type === 'star') { const nP = element.numPoints || 5; if(outerRadius<=0) return ''; for (let i = 0; i < nP * 2; i++) { const r = i % 2 === 0 ? outerRadius : innerRadius; const a = (i / (nP * 2)) * 2 * Math.PI - Math.PI / 2; points.push({ x: r * Math.cos(a), y: r * Math.sin(a) }); } }
    else if (type === 'hexagon') { if(radius<=0) return ''; for (let i = 0; i < 6; i++) { const a = (i / 6) * 2 * Math.PI - Math.PI / 2; points.push({ x: radius * Math.cos(a), y: radius * Math.sin(a) }); } }
    else if (type === 'pentagon') { if(radius<=0) return ''; for (let i = 0; i < 5; i++) { const a = (i * 2 * Math.PI) / 5 - Math.PI / 2; points.push({ x: radius * Math.cos(a), y: radius * Math.sin(a) }); } }
    else if (type === 'octagonStar') { if(radius<=0) return ''; for (let i = 0; i < 16; i++) { const cR = i % 2 === 0 ? radius : radius * 0.4; const a = (i * Math.PI) / 8; points.push({ x: cR * Math.cos(a), y: cR * Math.sin(a) }); } }

    return points.map(p => `${p.x},${p.y}`).join(' ');
}

const SVGElement: React.FC<SVGElementProps> = ({ element, onResizeStart, onEndpointDown }) => {
  const { id, type, position, styles, rotation = 0 } = element;
  const { strokeWidth } = styles;

  const elementRef = useRef<SVGGraphicsElement>(null);
  const [localBbox, setLocalBbox] = useState<DOMRect | null>(null);

  // --- Transforms based on positioning model ---
  const centerGroupTransform = `translate(${position.x} ${position.y}) rotate(${rotation})`;
  const getTopLeftTransform = (w = 0, h = 0) => 
    `translate(${position.x} ${position.y}) rotate(${rotation} ${w / 2} ${h / 2})`; // Rotate around center of dimensions
  const relativeCoords = { x: 0, y: 0 }; 

  // --- Style Merging --- 
  const selectedStyle = element.selected 
    ? element.locked 
      ? { stroke: '#e74c3c', strokeWidth: (strokeWidth || 0) + 1.5, strokeDasharray: '5 3', vectorEffect: 'non-scaling-stroke' } 
      : { stroke: '#2196f3', strokeWidth: (strokeWidth || 0) + 1.5, strokeDasharray: '5 3', vectorEffect: 'non-scaling-stroke' } 
    : {}; 

  const finalStyles = { ...styles, ...selectedStyle };
  // Ensure lines/curves/arrows have fill='none'
  const finalLineStyles = { ...styles, fill: 'none', ...selectedStyle }; 

  // --- BBox Calculation --- 
  useLayoutEffect(() => {
    const canHaveResizeHandles = !['line', 'arrow', 'curvedLine'].includes(type);
    const needsResizeHandles = element.selected && !element.locked && onResizeStart && canHaveResizeHandles;
    
    // Only calculate BBox if needed for resize handles and ref is attached
    if (needsResizeHandles && elementRef.current) { 
        try {
            const bbox = elementRef.current.getBBox();
            setLocalBbox(bbox);
        } catch (e) { 
            console.error("Error getting BBox:", e);
            setLocalBbox(null);
        }
    } else {
      setLocalBbox(null);
    }
  }, [element, onResizeStart, type]); // Added type dependency

  // --- Render Functions --- 
  const renderEndpointHandles = (points: Position[], isRelative = false) => {
      if (!element.selected || element.locked || !onEndpointDown) return null;
      
      const getRotatedPoint = (p: Position) => {
        if (isRelative || rotation === 0) return p;
        
        // Convert angle to radians
        const angleRad = -rotation * Math.PI / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        
        // Translate point to origin, rotate, then translate back
        const dx = p.x - position.x;
        const dy = p.y - position.y;
        
        return {
          x: position.x + (dx * cos - dy * sin),
          y: position.y + (dx * sin + dy * cos)
        };
      };

      return (
          <>
              {points.map((p, index) => {
                  const rotatedPoint = getRotatedPoint(p);
                  return (
                      <circle 
                          key={index}
                          className={`line-endpoint-handle ${index === 1 && type === 'curvedLine' ? 'control' : ''}`}
                          cx={rotatedPoint.x}
                          cy={rotatedPoint.y}
                          r={index === 1 && type === 'curvedLine' ? 4 : 5}
                          onMouseDown={(e) => onEndpointDown(element.id, index, e)} 
                      />
                  );
              })}
          </>
      );
  }

  const renderElementContent = () => {
    switch (type) {
      // --- Top-Left Positioned --- 
      case 'rectangle': { 
        const { width = 0, height = 0 } = element.dimensions || {};
        return (
          // Use type assertion `as any` for the ref
          <rect 
            ref={elementRef as any} 
            x={position.x} y={position.y}
            width={width} height={height}
            {...finalStyles}
            transform={`rotate(${rotation} ${position.x + width / 2} ${position.y + height / 2})`} 
          />
        );
      }
      case 'blockArrow': { 
        const { points = [], dimensions } = element;
        if (points.length === 0) return null;
        const { width = 0, height = 0 } = dimensions || {};
        const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
        return (
          // Use type assertion `as any` for the ref
          <g ref={elementRef as any} transform={getTopLeftTransform(width, height)}>
              <polygon points={pointsStr} {...finalStyles} />
          </g>
        );
      }
      case 'cloud': {
        const { pathData = '', dimensions } = element;
        if (!pathData) return null;
        const { width = 0, height = 0 } = dimensions || {};
        return (
            // Use type assertion `as any` for the ref
            <g ref={elementRef as any} transform={getTopLeftTransform(width, height)}>
                 <path d={pathData} {...finalStyles} />
            </g>
        );
      }

      // --- Center Positioned --- 
      case 'circle':
      case 'ellipse':
      case 'text':
      case 'polygon':
      case 'star':
      case 'hexagon':
      case 'pentagon':
      case 'octagonStar': {
        return (
          // Use type assertion `as any` for the ref
          <g ref={elementRef as any} transform={centerGroupTransform}>
            {(() => { 
               if (type === 'circle') {
                    const r = element.radius || 0;
                    return <circle cx={relativeCoords.x} cy={relativeCoords.y} r={r} {...finalStyles} />;
               } else if (type === 'ellipse') {
                    const { rx = 0, ry = 0 } = element;
                    return <ellipse cx={relativeCoords.x} cy={relativeCoords.y} rx={rx} ry={ry} {...finalStyles} />;
               } else if (type === 'text') {
                    const { content = '', fontFamily = 'Arial', fontSize = 24 } = element;
                    // NOTE: Attaching ref directly to <text> might be needed if bbox issues arise
                    return <text x={relativeCoords.x} y={relativeCoords.y} fontFamily={fontFamily} fontSize={fontSize} dominantBaseline="middle" textAnchor="middle" {...finalStyles}>{content}</text>;
               } else { // Polygons/Stars
                    const pointsStr = getPolygonPoints(type, element);
                    if (!pointsStr) return null;
                    return <polygon points={pointsStr} {...finalStyles} />;
               }
            })()}
          </g>
        );
      }
      
      // --- Lines / Curves (NO REF NEEDED) --- 
      case 'line': {
        const { points = [] } = element;
        if (points.length < 2) return null;
        const [start, end] = points;
        // Convert to relative coordinates
        const startRel = { x: start.x - position.x, y: start.y - position.y };
        const endRel = { x: end.x - position.x, y: end.y - position.y };
        return (
          <g transform={centerGroupTransform}>
            <line x1={startRel.x} y1={startRel.y} x2={endRel.x} y2={endRel.y} {...finalLineStyles} />
            {renderEndpointHandles([startRel, endRel], true)}
          </g>
        );
      }
      case 'arrow': {
        const { points = [], arrowHeadSize = 15 } = element;
        if (points.length < 2) return null;
        const [start, end] = points;
        // Convert to relative coordinates
        const startRel = { x: start.x - position.x, y: start.y - position.y };
        const endRel = { x: end.x - position.x, y: end.y - position.y };
        
        // Calculate arrow points in relative space
        const angle = Math.atan2(endRel.y - startRel.y, endRel.x - startRel.x);
        const arrowPoint1 = { 
          x: endRel.x - arrowHeadSize * Math.cos(angle - Math.PI / 6), 
          y: endRel.y - arrowHeadSize * Math.sin(angle - Math.PI / 6) 
        };
        const arrowPoint2 = { 
          x: endRel.x - arrowHeadSize * Math.cos(angle + Math.PI / 6), 
          y: endRel.y - arrowHeadSize * Math.sin(angle + Math.PI / 6) 
        };
        
        return (
          <g transform={centerGroupTransform}>
            <line x1={startRel.x} y1={startRel.y} x2={endRel.x} y2={endRel.y} {...finalLineStyles} />
            <line x1={endRel.x} y1={endRel.y} x2={arrowPoint1.x} y2={arrowPoint1.y} {...finalLineStyles} />
            <line x1={endRel.x} y1={endRel.y} x2={arrowPoint2.x} y2={arrowPoint2.y} {...finalLineStyles} />
            {renderEndpointHandles([startRel, endRel], true)}
          </g>
        );
      }
       case 'curvedLine': {
        const { points = [] } = element;
        if (points.length < 3) return null;
        const [startRel, controlRel, endRel] = points; // Relative points
        const d = `M ${startRel.x} ${startRel.y} Q ${controlRel.x} ${controlRel.y} ${endRel.x} ${endRel.y}`;
        return (
          <g transform={centerGroupTransform}> {/* No ref */} 
             <path d={d} {...finalLineStyles} />
             {renderEndpointHandles(points, true)}
          </g>
        );
      }

      default: return null;
    }
  };

  // --- Final Render ---
  const showResizeHandles = element.selected && !element.locked && onResizeStart && localBbox && 
                            !['line', 'arrow', 'curvedLine'].includes(type); 
  
  // Determine correct transform for resize handles based on element positioning model
  const resizeHandleTransform = ['rectangle', 'blockArrow', 'cloud'].includes(type)
      ? getTopLeftTransform(element.dimensions?.width, element.dimensions?.height)
      : centerGroupTransform; 

  return (
    <>
      {renderElementContent()} 
      {showResizeHandles && localBbox && (
        <ResizeHandles 
          bbox={localBbox} 
          transform={resizeHandleTransform}
          onResizeStart={onResizeStart} 
        />
      )}
      {/* Optional: Locked indicator */}
      {element.selected && element.locked && (
          <g transform={centerGroupTransform}> {/* Assuming centered lock icon is fine */}
              <text x={relativeCoords.x} y={relativeCoords.y - 10} fontSize="10" textAnchor="middle" fill="red">🔒</text>
          </g>
      )}
    </>
  );
};

export default SVGElement; 