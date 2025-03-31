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
      default:
        return null;
    }
  };

  const renderedElement = renderElement();

  if (type === 'line') {
    const points = element.points || [];
    if (points.length < 2) return null;
    const [start, end] = points;
    const lineTransform = `rotate(${rotation} ${position.x} ${position.y})`;
    const handleRadius = 6;

    return (
      <g>
        <line
          ref={elementRef as React.RefObject<SVGLineElement>}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={stroke}
          strokeWidth={element.selected ? strokeWidth + 1 : strokeWidth}
          strokeDasharray={element.selected ? '4 2' : undefined}
          opacity={opacity}
          transform={lineTransform}
        />
        {element.selected && onEndpointDown && (
          <>
            <circle
              className="resize-handle nw corner"
              cx={start.x}
              cy={start.y}
              r={handleRadius}
              fill="white"
              stroke="#2196f3"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              transform={lineTransform}
              onMouseDown={(e) => onEndpointDown(element.id, 0, e)}
            />
            <circle
              className="resize-handle se corner"
              cx={end.x}
              cy={end.y}
              r={handleRadius}
              fill="white"
              stroke="#2196f3"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              transform={lineTransform}
              onMouseDown={(e) => onEndpointDown(element.id, 1, e)}
            />
          </>
        )}
      </g>
    );
  }

  if (type === 'arrow') {
    const points = element.points || [];
    if (points.length < 2) return null;
    const [start, end] = points;
    const arrowHeadSize = element.arrowHeadSize || 15;

    // Calculate arrow head points
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);

    const arrowHead1 = {
      x: end.x - arrowHeadSize * Math.cos(angle - Math.PI / 6),
      y: end.y - arrowHeadSize * Math.sin(angle - Math.PI / 6)
    };
    const arrowHead2 = {
      x: end.x - arrowHeadSize * Math.cos(angle + Math.PI / 6),
      y: end.y - arrowHeadSize * Math.sin(angle + Math.PI / 6)
    };

    const lineTransform = `rotate(${rotation} ${position.x} ${position.y})`;
    const handleRadius = 6;

    return (
      <g>
        <path
          ref={elementRef as React.RefObject<SVGPathElement>}
          d={`M ${start.x} ${start.y} L ${end.x} ${end.y} M ${arrowHead1.x} ${arrowHead1.y} L ${end.x} ${end.y} L ${arrowHead2.x} ${arrowHead2.y}`}
          fill="none"
          stroke={stroke}
          strokeWidth={element.selected ? strokeWidth + 1 : strokeWidth}
          strokeDasharray={element.selected ? '4 2' : undefined}
          opacity={opacity}
          transform={lineTransform}
        />
        {element.selected && onEndpointDown && (
          <>
            <circle
              className="resize-handle nw corner"
              cx={start.x}
              cy={start.y}
              r={handleRadius}
              fill="white"
              stroke="#2196f3"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              transform={lineTransform}
              onMouseDown={(e) => onEndpointDown(element.id, 0, e)}
            />
            <circle
              className="resize-handle se corner"
              cx={end.x}
              cy={end.y}
              r={handleRadius}
              fill="white"
              stroke="#2196f3"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              transform={lineTransform}
              onMouseDown={(e) => onEndpointDown(element.id, 1, e)}
            />
          </>
        )}
      </g>
    );
  }

  if (type === 'curvedLine') {
    const points = element.points || [];
    if (points.length < 3) return null;
    const [start, control, end] = points;
    const handleRadius = 6;

    return (
      <g transform={groupTransform}>
        {/* Guide lines when selected */}
        {element.selected && (
          <>
            <line
              x1={start.x}
              y1={start.y}
              x2={control.x}
              y2={control.y}
              stroke="#2196f3"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.5}
            />
            <line
              x1={control.x}
              y1={control.y}
              x2={end.x}
              y2={end.y}
              stroke="#2196f3"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.5}
            />
          </>
        )}

        {/* The curve itself */}
        <path
          ref={elementRef as React.RefObject<SVGPathElement>}
          d={`M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`}
          fill="none"
          stroke={stroke}
          strokeWidth={element.selected ? strokeWidth + 1 : strokeWidth}
          strokeDasharray={element.selected ? '4 2' : undefined}
          opacity={opacity}
        />

        {/* Control points when selected */}
        {element.selected && onEndpointDown && (
          <>
            <circle
              className="resize-handle nw corner"
              cx={start.x}
              cy={start.y}
              r={handleRadius}
              fill="white"
              stroke="#2196f3"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              onMouseDown={(e) => onEndpointDown(element.id, 0, e)}
            />
            <circle
              className="resize-handle n"
              cx={control.x}
              cy={control.y}
              r={5}
              fill="white"
              stroke="#2196f3"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              onMouseDown={(e) => onEndpointDown(element.id, 1, e)}
            />
            <circle
              className="resize-handle se corner"
              cx={end.x}
              cy={end.y}
              r={handleRadius}
              fill="white"
              stroke="#2196f3"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              onMouseDown={(e) => onEndpointDown(element.id, 2, e)}
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
      {element.selected && onResizeStart && localBbox && 
       !['curvedLine', 'line'].includes(type) && (
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