export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface ElementStyles {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

export interface LogoElement {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'path';
  position: Position;
  dimensions?: Dimensions;
  styles: ElementStyles;
  rotation: number;
  content?: string; // For text elements
  points?: Position[]; // For paths
  radius?: number; // For circles
  fontFamily?: string; // For text
  fontSize?: number; // For text
  selected: boolean;
}

export interface CanvasSettings {
  width: number;
  height: number;
  background: string;
  gridSize: number;
  showGrid: boolean;
  zoomLevel: number;
}

export interface LogoState {
  elements: LogoElement[];
  selectedElementId: string | null;
  canvasSettings: CanvasSettings;
  history: {
    past: LogoState[];
    future: LogoState[];
  };
} 