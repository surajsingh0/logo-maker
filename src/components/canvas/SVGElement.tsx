import React, { useRef, useState, useLayoutEffect } from 'react';
import { LogoElement } from '../../types';
import ResizeHandles, { ElementBounds } from './ResizeHandles';

interface SVGElementProps {
  element: LogoElement;
  onResizeStart?: (handle: string, event: React.MouseEvent) => void;
  onEndpointDown?: (elementId: string, pointIndex: number, event: React.MouseEvent) => void;
}

const SVGElement: React.FC<SVGElementProps> = ({ element, onResizeStart, onEndpointDown }) => {
  const { type, position, styles, rotation } = element;
  const { fill, stroke, strokeWidth, opacity } = styles;

  const elementRef = useRef<SVGGraphicsElement>(null);
  const [localBbox, setLocalBbox] = useState<DOMRect | null>(null);

  const groupTransform = `translate(${position.x} ${position.y}) rotate(${rotation})`;
  const elementPositionProps = { x: 0, y: 0 };
  
  const selectedStyle = element.selected 
    ? element.locked 
      ? { stroke: '#e74c3c', strokeWidth: strokeWidth + 1, strokeDasharray: '4 2' } // Red outline for locked
      : { stroke: '#2196f3', strokeWidth: strokeWidth + 1, strokeDasharray: '4 2' }  // Blue outline for selected
    : {};

  useLayoutEffect(() => {
    if (elementRef.current && element.selected && !element.locked) {
      const bbox = elementRef.current.getBBox();
      setLocalBbox(bbox);
    } else {
      setLocalBbox(null);
    }
  }, [element, element.selected, element.locked, position.x, position.y, rotation, element.dimensions, element.radius, element.rx, element.ry, element.fontSize, element.content, element.outerRadius, element.innerRadius]);

  const renderElement = () => {
    switch (type) {
      case 'rectangle':
        const { width = 0, height = 0 } = element.dimensions || {};
        return (
          <rect 
            ref={elementRef as React.RefObject<SVGRectElement>}
            {...elementPositionProps}
            width={width}
            height={height}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
          />
        );
      case 'circle':
        const radius = element.radius || 0;
        return (
          <circle
            ref={elementRef as React.RefObject<SVGCircleElement>}
            cx={elementPositionProps.x}
            cy={elementPositionProps.y}
            r={radius}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
          />
        );
      case 'text':
        const textContent = element.content || '';
        const fontFamily = element.fontFamily || 'Arial';
        const fontSize = element.fontSize || 24;
        return (
          <text
            ref={elementRef as React.RefObject<SVGTextElement>}
            {...elementPositionProps}
            fontFamily={fontFamily}
            fontSize={`${fontSize}px`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
            dominantBaseline="middle"
            textAnchor="middle"
          >
            {textContent}
          </text>
        );
      case 'ellipse':
        const rx = element.rx || 0;
        const ry = element.ry || 0;
        return (
           <ellipse
              ref={elementRef as React.RefObject<SVGEllipseElement>}
              cx={elementPositionProps.x}
              cy={elementPositionProps.y}
              rx={rx}
              ry={ry}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              opacity={opacity}
           />
        );
      case 'line': {
        if (!element.points || element.points.length < 2) return null;
        const [start, end] = element.points;
        return <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} {...selectedStyle} />;
      }
      case 'polygon': {
        const sides = element.sides || 3;
        const polyRadius = element.radius || 0;
        if (polyRadius === 0) return null;
        const polyPoints: string[] = [];
        for (let i = 0; i < sides; i++) {
          const angle = (i / sides) * 2 * Math.PI - Math.PI / 2;
          const px = elementPositionProps.x + polyRadius * Math.cos(angle);
          const py = elementPositionProps.y + polyRadius * Math.sin(angle);
          polyPoints.push(`${px},${py}`);
        }
        const pointsStr = polyPoints.join(' ');
        return (
          <polygon
            ref={elementRef as React.RefObject<SVGPolygonElement>}
            points={pointsStr}
            fill={styles.fill}
            stroke={styles.stroke}
            strokeWidth={styles.strokeWidth}
            opacity={styles.opacity}
          />
        );
      }
      case 'star': {
        const numPoints = element.numPoints || 5;
        const outerRadius = element.outerRadius || 0;
        const innerRadius = element.innerRadius || outerRadius / 2;
        if (outerRadius === 0) return null;
        const starPoints: string[] = [];
        for (let i = 0; i < numPoints * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i / (numPoints * 2)) * 2 * Math.PI - Math.PI / 2;
          const px = elementPositionProps.x + radius * Math.cos(angle);
          const py = elementPositionProps.y + radius * Math.sin(angle);
          starPoints.push(`${px},${py}`);
        }
        const pointsStr = starPoints.join(' ');
        return (
          <polygon
            ref={elementRef as React.RefObject<SVGPolygonElement>}
            points={pointsStr}
            fill={styles.fill}
            stroke={styles.stroke}
            strokeWidth={styles.strokeWidth}
            opacity={styles.opacity}
          />
        );
      }
      case 'hexagon': {
        const hexRadius = element.radius || 0;
        if (hexRadius === 0) return null;
        const hexPoints: string[] = [];
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * 2 * Math.PI - Math.PI / 2;
          const px = elementPositionProps.x + hexRadius * Math.cos(angle);
          const py = elementPositionProps.y + hexRadius * Math.sin(angle);
          hexPoints.push(`${px},${py}`);
        }
        const pointsStr = hexPoints.join(' ');
        return (
          <polygon
            ref={elementRef as React.RefObject<SVGPolygonElement>}
            points={pointsStr}
            fill={styles.fill}
            stroke={styles.stroke}
            strokeWidth={styles.strokeWidth}
            opacity={styles.opacity}
          />
        );
      }
      case 'pentagon': {
        const pentRadius = element.radius || 0;
        if (pentRadius === 0) return null;
        const pentPoints: string[] = [];
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * 2 * Math.PI - Math.PI / 2;
          const px = elementPositionProps.x + pentRadius * Math.cos(angle);
          const py = elementPositionProps.y + pentRadius * Math.sin(angle);
          pentPoints.push(`${px},${py}`);
        }
        const pointsStr = pentPoints.join(' ');
        return (
          <polygon
            ref={elementRef as React.RefObject<SVGPolygonElement>}
            points={pointsStr}
            fill={styles.fill}
            stroke={styles.stroke}
            strokeWidth={styles.strokeWidth}
            opacity={styles.opacity}
          />
        );
      }
      case 'octagonStar': {
        const starRadius = element.radius || 0;
        if (starRadius === 0) return null;
        const starPoints: string[] = [];
        
        // Calculate points for 8-pointed star
        for (let i = 0; i < 16; i++) {
          const radius = i % 2 === 0 ? starRadius : starRadius * 0.4;
          const angle = (i * Math.PI) / 8;
          const px = elementPositionProps.x + radius * Math.cos(angle);
          const py = elementPositionProps.y + radius * Math.sin(angle);
          starPoints.push(`${px},${py}`);
        }
        
        const pointsStr = starPoints.join(' ');
        return (
          <polygon
            ref={elementRef as React.RefObject<SVGPolygonElement>}
            points={pointsStr}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
            {...selectedStyle}
          />
        );
      }
      case 'blockArrow': {
        const points = element.points || [];
        if (points.length < 7) return null;
        const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
        return (
          <polygon
            ref={elementRef as React.RefObject<SVGPolygonElement>}
            points={pointsStr}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
            {...selectedStyle}
          />
        );
      }
      case 'cloud': {
        if (!element.pathData) return null;
        return (
          <path
            ref={elementRef as React.RefObject<SVGPathElement>}
            d={element.pathData}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
            {...selectedStyle}
          />
        );
      }
      default:
        return null;
    }
  };

  const renderedElement = renderElement();

  return (
    <>
      <g transform={groupTransform}>
        {renderedElement}
      </g>
      {element.selected && onResizeStart && localBbox && 
       !['curvedLine', 'line', 'arrow'].includes(type) && !element.locked && (
        <ResizeHandles 
          bbox={localBbox}
          transform={groupTransform}
          onResizeStart={onResizeStart} 
        />
      )}
      {/* Show locked indicator if element is locked and selected */}
      {element.selected && element.locked && (
        <g transform={groupTransform}>
          <g className="locked-indicator">
            <rect
              x={-10}
              y={-30}
              width={20}
              height={20}
              fill="#e74c3c"
              rx={4}
            />
            <text
              x={0}
              y={-16}
              textAnchor="middle"
              fill="white"
              fontSize={12}
              fontFamily="Arial"
            >
              🔒
            </text>
          </g>
        </g>
      )}
    </>
  );
};

export default SVGElement; 