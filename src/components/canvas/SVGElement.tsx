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
    ? { stroke: '#2196f3', strokeWidth: strokeWidth + 1, strokeDasharray: '4 2' } 
    : {};

  useLayoutEffect(() => {
    if (elementRef.current && element.selected) {
      const bbox = elementRef.current.getBBox();
      setLocalBbox(bbox);
    } else {
      setLocalBbox(null);
    }
  }, [element, element.selected, position.x, position.y, rotation, element.dimensions, element.radius, element.rx, element.ry, element.fontSize, element.content, element.outerRadius, element.innerRadius]);

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
      case 'line':
        return null;
      default:
        return null;
    }
  };

  const renderedElement = renderElement();

  if (type === 'line') {
      const linePoints = element.points || [];
      if (linePoints.length < 2) return null;
      const p1 = linePoints[0];
      const p2 = linePoints[1];
      const handleRadius = 5;
      const lineTransform = `rotate(${rotation} ${position.x} ${position.y})`;

      return (
        <g>
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={stroke}
            strokeWidth={element.selected ? strokeWidth + 1 : strokeWidth}
            strokeDasharray={element.selected ? '4 2' : undefined}
            opacity={opacity}
            transform={lineTransform} 
          />
          {element.selected && onEndpointDown && (
            <> 
              <circle
                className="line-endpoint-handle"
                cx={p1.x}
                cy={p1.y}
                r={handleRadius}
                fill="white"
                stroke="#2196f3"
                strokeWidth={1}
                style={{ cursor: 'pointer' }}
                onMouseDown={(e) => onEndpointDown(element.id, 0, e)}
                transform={lineTransform} 
              />
              <circle
                className="line-endpoint-handle"
                cx={p2.x}
                cy={p2.y}
                r={handleRadius}
                fill="white"
                stroke="#2196f3"
                strokeWidth={1}
                style={{ cursor: 'pointer' }}
                onMouseDown={(e) => onEndpointDown(element.id, 1, e)}
                transform={lineTransform}
              />
            </>
          )}
        </g>
      );
  }

  return (
    <g>
      <g transform={groupTransform}>
        {renderedElement}
      </g>
      {element.selected && onResizeStart && localBbox && (
        <ResizeHandles 
          bbox={localBbox}
          transform={groupTransform}
          onResizeStart={onResizeStart} 
        />
      )}
    </g>
  );
};

export default SVGElement; 