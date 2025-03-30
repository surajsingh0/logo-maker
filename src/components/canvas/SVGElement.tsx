import React from 'react';
import { LogoElement, Position } from '../../types';
import ResizeHandles from './ResizeHandles';

interface SVGElementProps {
  element: LogoElement;
  onResizeStart?: (handle: string, event: React.MouseEvent) => void;
}

const SVGElement: React.FC<SVGElementProps> = ({ element, onResizeStart }) => {
  const { type, position, styles, rotation } = element;
  const { fill, stroke, strokeWidth, opacity } = styles;

  // Common transformation for all elements
  const transform = `rotate(${rotation} ${position.x} ${position.y})`;
  
  // Selected element styling
  const selectedStyle = element.selected 
    ? { stroke: '#2196f3', strokeWidth: strokeWidth + 1, strokeDasharray: '4 2' } 
    : {};

  // Wrapper component to add resize handles
  const withResizeHandles = (elementJsx: React.ReactElement) => {
    if (!element.selected || !onResizeStart) return elementJsx;
    
    return (
      <g>
        {elementJsx}
        <ResizeHandles 
          element={element} 
          onResizeStart={onResizeStart} 
        />
      </g>
    );
  };

  switch (type) {
    case 'rectangle':
      const { width = 0, height = 0 } = element.dimensions || {};
      
      return withResizeHandles(
        <g>
          <rect
            x={position.x}
            y={position.y}
            width={width}
            height={height}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
            transform={transform}
          />
          {element.selected && (
            <rect
              x={position.x - 2}
              y={position.y - 2}
              width={width + 4}
              height={height + 4}
              fill="none"
              {...selectedStyle}
              transform={transform}
            />
          )}
        </g>
      );

    case 'circle':
      const radius = element.radius || 0;
      
      return withResizeHandles(
        <g>
          <circle
            cx={position.x}
            cy={position.y}
            r={radius}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
            transform={transform}
          />
          {element.selected && (
            <circle
              cx={position.x}
              cy={position.y}
              r={radius + 2}
              fill="none"
              {...selectedStyle}
              transform={transform}
            />
          )}
        </g>
      );

    case 'text':
      const textContent = element.content || '';
      const fontFamily = element.fontFamily || 'Arial';
      const fontSize = element.fontSize || 24;
      
      return withResizeHandles(
        <g>
          <text
            x={position.x}
            y={position.y}
            fontFamily={fontFamily}
            fontSize={`${fontSize}px`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
            transform={transform}
          >
            {textContent}
          </text>
          {element.selected && (
            <rect
              x={position.x - 4}
              y={position.y - fontSize}
              width={textContent.length * (fontSize * 0.6) + 8}
              height={fontSize + 8}
              fill="none"
              {...selectedStyle}
              transform={transform}
            />
          )}
        </g>
      );

    case 'path':
      const points = element.points || [];
      
      if (points.length === 0) {
        return null;
      }
      
      let pathData = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        pathData += ` L ${points[i].x} ${points[i].y}`;
      }
      
      return withResizeHandles(
        <g>
          <path
            d={pathData}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
            transform={transform}
          />
          {element.selected && (
            <path
              d={pathData}
              fill="none"
              {...selectedStyle}
              transform={transform}
            />
          )}
        </g>
      );

    case 'ellipse':
      const rx = element.rx || 0;
      const ry = element.ry || 0;

      return withResizeHandles(
        <g>
          <ellipse
            cx={position.x}
            cy={position.y}
            rx={rx}
            ry={ry}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
            transform={transform}
          />
          {element.selected && (
            <ellipse
              cx={position.x}
              cy={position.y}
              rx={rx + 2}
              ry={ry + 2}
              fill="none"
              {...selectedStyle}
              transform={transform}
            />
          )}
        </g>
      );

    case 'line':
      const linePoints = element.points || [];
      if (linePoints.length < 2) return null; // Need at least two points
      const p1 = linePoints[0];
      const p2 = linePoints[1];

      return withResizeHandles(
        <g>
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
            // Lines are defined by points, transform origin might need adjustment
            // For simplicity, applying rotation around the element's defined center
            transform={transform}
          />
          {element.selected && (
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              fill="none"
              {...selectedStyle}
              transform={transform}
            />
          )}
        </g>
      );

    case 'polygon': {
      const sides = element.sides || 3;
      const polyRadius = element.radius || 0;
      const polyPoints: string[] = [];
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * 2 * Math.PI - Math.PI / 2; // Start from top
        const px = position.x + polyRadius * Math.cos(angle);
        const py = position.y + polyRadius * Math.sin(angle);
        polyPoints.push(`${px},${py}`);
      }
      const pointsStr = polyPoints.join(' ');

      return withResizeHandles(
        <g>
          <polygon
            points={pointsStr}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
            transform={transform} 
          />
          {element.selected && (
             <polygon
              points={pointsStr}
              fill="none"
              {...selectedStyle}
              transform={transform}
            />
          )}
        </g>
      );
    }

    case 'star': {
      const numPoints = element.numPoints || 5;
      const outerRadius = element.outerRadius || 0;
      const innerRadius = element.innerRadius || outerRadius / 2;
      const starPoints: string[] = [];
      for (let i = 0; i < numPoints * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i / (numPoints * 2)) * 2 * Math.PI - Math.PI / 2; // Start from top
        const px = position.x + radius * Math.cos(angle);
        const py = position.y + radius * Math.sin(angle);
        starPoints.push(`${px},${py}`);
      }
      const pointsStr = starPoints.join(' ');

      return withResizeHandles(
        <g>
          <polygon
            points={pointsStr}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
            transform={transform}
          />
           {element.selected && (
             <polygon
              points={pointsStr}
              fill="none"
              {...selectedStyle}
              transform={transform}
            />
          )}
        </g>
      );
    }

    default:
      return null;
  }
};

export default SVGElement; 