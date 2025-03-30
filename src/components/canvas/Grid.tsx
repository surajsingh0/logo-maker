import React from 'react';

interface GridProps {
  width: number;
  height: number;
  gridSize: number;
}

const Grid: React.FC<GridProps> = ({ width, height, gridSize }) => {
  const horizontalLines = [];
  for (let y = gridSize; y < height; y += gridSize) {
    horizontalLines.push(
      <line
        key={`h-${y}`}
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke="#ddd"
        strokeWidth={1}
      />
    );
  }

  const verticalLines = [];
  for (let x = gridSize; x < width; x += gridSize) {
    verticalLines.push(
      <line
        key={`v-${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke="#ddd"
        strokeWidth={1}
      />
    );
  }

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    >
      {horizontalLines}
      {verticalLines}
    </svg>
  );
};

export default Grid; 