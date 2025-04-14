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

export type ElementType =
    | "rectangle"
    | "circle"
    | "text"
    | "path"
    | "ellipse"
    | "line"
    | "polygon"
    | "star"
    | "curvedLine"
    | "hexagon"
    | "arrow"
    | "pentagon"
    | "octagonStar"
    | "blockArrow"
    | "cloud";

export interface LogoElement {
    id: string;
    type: ElementType;
    position: Position;
    styles: ElementStyles;
    rotation: number;
    selected: boolean;
    locked?: boolean;

    dimensions?: { width: number; height: number };
    radius?: number;
    rx?: number;
    ry?: number;
    points?: Position[];
    content?: string;
    fontFamily?: string;
    fontSize?: number;
    sides?: number;
    outerRadius?: number;
    innerRadius?: number;
    numPoints?: number;
    arrowHeadSize?: number;
    pathData?: string;
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
