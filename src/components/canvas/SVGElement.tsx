import React from 'react';
import { LogoElement } from '../../types';

interface SVGElementProps {
  element: LogoElement;
}

const SVGElement: React.FC<SVGElementProps> = ({ element }) => {
  const { type, position, styles, rotation } = element;
  const { fill, stroke, strokeWidth, opacity } = styles;

  // Common transformation for all elements
  const transform = `rotate(${rotation} ${position.x} ${position.y})`;
  
  // Selected element styling
  const selectedStyle = element.selected 
    ? { stroke: '#2196f3', strokeWidth: strokeWidth + 1, strokeDasharray: '4 2' } 
    : {};

  switch (type) {
    case 'rectangle':
      const { width = 0, height = 0 } = element.dimensions || {};
      
      return (
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
            />
          )}
        </g>
      );

    case 'circle':
      const radius = element.radius || 0;
      
      return (
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
            />
          )}
        </g>
      );

    case 'text':
      const textContent = element.content || '';
      const fontFamily = element.fontFamily || 'Arial';
      const fontSize = element.fontSize || 24;
      
      return (
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
      
      return (
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
            />
          )}
        </g>
      );

    default:
      return null;
  }
};

export default SVGElement; 