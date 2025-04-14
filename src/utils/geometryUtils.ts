import { LogoElement, Position } from "../types";

// --- Bounding Box Calculation ---

/** Represents a rectangular bounding box */
export interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

/** Rotates a point around a center */
function rotatePoint(
    point: Position,
    center: Position,
    angleDegrees: number
): Position {
    const angleRad = angleDegrees * (Math.PI / 180);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const px = point.x - center.x;
    const py = point.y - center.y;

    return {
        x: px * cos - py * sin + center.x,
        y: px * sin + py * cos + center.y,
    };
}

/** Calculates the bounding box of a single element */
export function calculateElementBoundingBox(
    element: LogoElement
): BoundingBox | null {
    const strokeWidth = element.styles.strokeWidth || 0;
    const halfStroke = strokeWidth / 2;

    switch (element.type) {
        case "rectangle": {
            if (!element.dimensions) return null;
            const { x, y } = element.position;
            const { width, height } = element.dimensions;
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            const center = { x: centerX, y: centerY };

            const corners: Position[] = [
                { x: x, y: y },
                { x: x + width, y: y },
                { x: x + width, y: y + height },
                { x: x, y: y + height },
            ];

            const rotatedCorners = corners.map((p) =>
                rotatePoint(p, center, element.rotation)
            );

            const minX =
                Math.min(...rotatedCorners.map((p) => p.x)) - halfStroke;
            const minY =
                Math.min(...rotatedCorners.map((p) => p.y)) - halfStroke;
            const maxX =
                Math.max(...rotatedCorners.map((p) => p.x)) + halfStroke;
            const maxY =
                Math.max(...rotatedCorners.map((p) => p.y)) + halfStroke;
            return { minX, minY, maxX, maxY };
        }

        case "circle": {
            if (!element.radius) return null;
            const { x, y } = element.position;
            const radius = element.radius;
            // Rotation doesn't affect circle bounding box
            return {
                minX: x - radius - halfStroke,
                minY: y - radius - halfStroke,
                maxX: x + radius + halfStroke,
                maxY: y + radius + halfStroke,
            };
        }

        case "ellipse": {
            if (!element.rx || !element.ry) return null;
            // Approximation: Use the bounding box of the axis-aligned ellipse and rotate its corners.
            // More accurate calculation is complex.
            const { x, y } = element.position;
            const rx = element.rx;
            const ry = element.ry;
            const center = { x, y };

            // Bounding box corners of the unrotated ellipse relative to its center
            const cornersRel: Position[] = [
                { x: -rx, y: -ry },
                { x: rx, y: -ry },
                { x: rx, y: ry },
                { x: -rx, y: ry },
            ];
            // Absolute corners of the unrotated ellipse
            const cornersAbs = cornersRel.map((p) => ({
                x: p.x + x,
                y: p.y + y,
            }));
            const rotatedCorners = cornersAbs.map((p) =>
                rotatePoint(p, center, element.rotation)
            );

            const minX =
                Math.min(...rotatedCorners.map((p) => p.x)) - halfStroke;
            const minY =
                Math.min(...rotatedCorners.map((p) => p.y)) - halfStroke;
            const maxX =
                Math.max(...rotatedCorners.map((p) => p.x)) + halfStroke;
            const maxY =
                Math.max(...rotatedCorners.map((p) => p.y)) + halfStroke;
            return { minX, minY, maxX, maxY };
        }

        case "line":
        case "arrow":
        case "path":
        case "polygon":
        case "star":
        case "hexagon":
        case "pentagon":
        case "octagonStar": {
            // Calculate points as done in exportUtils (absolute coordinates)
            let points: Position[] = [];
            if (
                element.type === "line" ||
                element.type === "arrow" ||
                element.type === "path"
            ) {
                points = element.points || []; // Assume points are absolute
            } else if (element.type === "polygon") {
                const sides = element.sides || 3;
                const radius = element.radius || 0;
                if (radius <= 0) return null;
                for (let i = 0; i < sides; i++) {
                    const angle = (i / sides) * 2 * Math.PI - Math.PI / 2;
                    points.push({
                        x: element.position.x + radius * Math.cos(angle),
                        y: element.position.y + radius * Math.sin(angle),
                    });
                }
            } else if (element.type === "star") {
                const numPoints = element.numPoints || 5;
                const outerRadius = element.outerRadius || 0;
                const innerRadius = element.innerRadius || outerRadius / 2;
                if (outerRadius <= 0) return null;
                for (let i = 0; i < numPoints * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle =
                        (i / (numPoints * 2)) * 2 * Math.PI - Math.PI / 2;
                    points.push({
                        x: element.position.x + radius * Math.cos(angle),
                        y: element.position.y + radius * Math.sin(angle),
                    });
                }
            } else if (element.type === "hexagon") {
                const radius = element.radius || 0;
                if (radius <= 0) return null;
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * 2 * Math.PI - Math.PI / 2;
                    points.push({
                        x: element.position.x + radius * Math.cos(angle),
                        y: element.position.y + radius * Math.sin(angle),
                    });
                }
            } else if (element.type === "pentagon") {
                const radius = element.radius || 0;
                if (radius <= 0) return null;
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * 2 * Math.PI - Math.PI / 2;
                    points.push({
                        x: element.position.x + radius * Math.cos(angle),
                        y: element.position.y + radius * Math.sin(angle),
                    });
                }
            } else if (element.type === "octagonStar") {
                const radius = element.radius || 0;
                if (radius <= 0) return null;
                for (let i = 0; i < 16; i++) {
                    const currentRadius = i % 2 === 0 ? radius : radius * 0.4;
                    const angle = (i * Math.PI) / 8;
                    points.push({
                        x: element.position.x + currentRadius * Math.cos(angle),
                        y: element.position.y + currentRadius * Math.sin(angle),
                    });
                }
            }

            if (points.length === 0) return null;

            // Rotate points if needed (especially for lines/paths if rotation is stored)
            const center = element.position; // Use element position as rotation center
            const rotatedPoints = points.map((p) =>
                rotatePoint(p, center, element.rotation)
            );

            const minX =
                Math.min(...rotatedPoints.map((p) => p.x)) - halfStroke;
            const minY =
                Math.min(...rotatedPoints.map((p) => p.y)) - halfStroke;
            const maxX =
                Math.max(...rotatedPoints.map((p) => p.x)) + halfStroke;
            const maxY =
                Math.max(...rotatedPoints.map((p) => p.y)) + halfStroke;
            return { minX, minY, maxX, maxY };
        }

        case "blockArrow": {
            const { width = 0, height = 0 } = element.dimensions || {};
            const points = element.points || [];
            if (points.length === 0) return null;

            // Calculate bounds from points in local coordinates
            const localMinX = Math.min(...points.map((p) => p.x));
            const localMaxX = Math.max(...points.map((p) => p.x));
            const localMinY = Math.min(...points.map((p) => p.y));
            const localMaxY = Math.max(...points.map((p) => p.y));

            // Convert to absolute coordinates
            const { x, y } = element.position;
            const center = { x: x + width / 2, y: y + height / 2 };

            // Create corners from local bounds
            const corners: Position[] = [
                { x: x + localMinX, y: y + localMinY },
                { x: x + localMaxX, y: y + localMinY },
                { x: x + localMaxX, y: y + localMaxY },
                { x: x + localMinX, y: y + localMaxY },
            ];

            // Rotate corners if needed
            const rotatedCorners = corners.map((p) =>
                rotatePoint(p, center, element.rotation)
            );

            const minX =
                Math.min(...rotatedCorners.map((p) => p.x)) - halfStroke;
            const minY =
                Math.min(...rotatedCorners.map((p) => p.y)) - halfStroke;
            const maxX =
                Math.max(...rotatedCorners.map((p) => p.x)) + halfStroke;
            const maxY =
                Math.max(...rotatedCorners.map((p) => p.y)) + halfStroke;
            return { minX, minY, maxX, maxY };
        }

        case "cloud": {
            const { width = 140, height = 90 } = element.dimensions || {};
            const { x, y } = element.position;
            const center = { x: x + width / 2, y: y + height / 2 };

            // Create corners for the cloud's bounding box
            const corners: Position[] = [
                { x: x, y: y },
                { x: x + width, y: y },
                { x: x + width, y: y + height },
                { x: x, y: y + height },
            ];

            // Rotate corners if needed
            const rotatedCorners = corners.map((p) =>
                rotatePoint(p, center, element.rotation)
            );

            const minX =
                Math.min(...rotatedCorners.map((p) => p.x)) - halfStroke;
            const minY =
                Math.min(...rotatedCorners.map((p) => p.y)) - halfStroke;
            const maxX =
                Math.max(...rotatedCorners.map((p) => p.x)) + halfStroke;
            const maxY =
                Math.max(...rotatedCorners.map((p) => p.y)) + halfStroke;
            return { minX, minY, maxX, maxY };
        }

        case "text": {
            // Approximation: Use position and estimated size based on font size.
            // Accurate text bounding box requires rendering or complex font metrics.
            const fontSize = element.fontSize || 16;
            const estimatedWidth =
                (element.content?.length || 1) * fontSize * 0.6; // Rough estimate
            const estimatedHeight = fontSize;
            const { x, y } = element.position;
            // Assuming position is middle-center based on previous findings
            const approxHalfWidth = estimatedWidth / 2;
            const approxHalfHeight = estimatedHeight / 2;

            const corners: Position[] = [
                { x: x - approxHalfWidth, y: y - approxHalfHeight },
                { x: x + approxHalfWidth, y: y - approxHalfHeight },
                { x: x + approxHalfWidth, y: y + approxHalfHeight },
                { x: x - approxHalfWidth, y: y + approxHalfHeight },
            ];

            const rotatedCorners = corners.map((p) =>
                rotatePoint(p, { x, y }, element.rotation)
            );

            const minX =
                Math.min(...rotatedCorners.map((p) => p.x)) - halfStroke; // Add stroke? Text usually doesn't have same stroke concept
            const minY =
                Math.min(...rotatedCorners.map((p) => p.y)) - halfStroke;
            const maxX =
                Math.max(...rotatedCorners.map((p) => p.x)) + halfStroke;
            const maxY =
                Math.max(...rotatedCorners.map((p) => p.y)) + halfStroke;
            return { minX, minY, maxX, maxY };
        }

        default:
            return null;
    }
}

/** Calculates the combined bounding box for multiple elements */
export function calculateOverallBoundingBox(
    elements: LogoElement[]
): (BoundingBox & { width: number; height: number }) | null {
    if (elements.length === 0) return null;

    let overallMinX = Infinity;
    let overallMinY = Infinity;
    let overallMaxX = -Infinity;
    let overallMaxY = -Infinity;
    let hasBox = false;

    elements.forEach((element) => {
        const box = calculateElementBoundingBox(element);
        if (box) {
            hasBox = true;
            overallMinX = Math.min(overallMinX, box.minX);
            overallMinY = Math.min(overallMinY, box.minY);
            overallMaxX = Math.max(overallMaxX, box.maxX);
            overallMaxY = Math.max(overallMaxY, box.maxY);
        }
    });

    if (!hasBox) return null;

    // Add a small padding if desired
    const padding = 5;
    overallMinX -= padding;
    overallMinY -= padding;
    overallMaxX += padding;
    overallMaxY += padding;

    const width = overallMaxX - overallMinX;
    const height = overallMaxY - overallMinY;

    if (width <= 0 || height <= 0) return null; // Handle cases where box is invalid

    return {
        minX: overallMinX,
        minY: overallMinY,
        maxX: overallMaxX,
        maxY: overallMaxY,
        width: width,
        height: height,
    };
}

// --- Point In Element Calculation ---

/** Checks if a point is inside an element */
export function isPointInElement(
    element: LogoElement,
    position: Position
): boolean {
    const box = calculateElementBoundingBox(element);
    if (!box) return false;

    const point = {
        x: position.x - element.position.x,
        y: position.y - element.position.y,
    };
    const halfStroke = (element.styles.strokeWidth || 0) / 2;

    switch (element.type) {
        case "rectangle":
        case "circle":
        case "ellipse":
        case "line":
        case "arrow":
        case "path":
        case "polygon":
        case "star":
        case "hexagon":
        case "pentagon":
        case "octagonStar":
        case "blockArrow": {
            const points = element.points || [];
            if (points.length === 0) return false;

            // Ray Casting Algorithm (point in polygon test)
            let inside = false;
            for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
                const xi = points[i].x + position.x;
                const yi = points[i].y + position.y;
                const xj = points[j].x + position.x;
                const yj = points[j].y + position.y;

                const intersect =
                    yi > point.y !== yj > point.y &&
                    point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
                if (intersect) inside = !inside;
            }
            return inside;
        }

        case "text": {
            // Approximation: Use position and estimated size based on font size.
            // Accurate text bounding box requires rendering or complex font metrics.
            const fontSize = element.fontSize || 16;
            const estimatedWidth =
                (element.content?.length || 1) * fontSize * 0.6; // Rough estimate
            const estimatedHeight = fontSize;
            const { x, y } = element.position;
            // Assuming position is middle-center based on previous findings
            const approxHalfWidth = estimatedWidth / 2;
            const approxHalfHeight = estimatedHeight / 2;

            const corners: Position[] = [
                { x: x - approxHalfWidth, y: y - approxHalfHeight },
                { x: x + approxHalfWidth, y: y - approxHalfHeight },
                { x: x + approxHalfWidth, y: y + approxHalfHeight },
                { x: x - approxHalfWidth, y: y + approxHalfHeight },
            ];

            const rotatedCorners = corners.map((p) =>
                rotatePoint(p, { x, y }, element.rotation)
            );

            const minX =
                Math.min(...rotatedCorners.map((p) => p.x)) - halfStroke; // Add stroke? Text usually doesn't have same stroke concept
            const minY =
                Math.min(...rotatedCorners.map((p) => p.y)) - halfStroke;
            const maxX =
                Math.max(...rotatedCorners.map((p) => p.x)) + halfStroke;
            const maxY =
                Math.max(...rotatedCorners.map((p) => p.y)) + halfStroke;
            return (
                point.x >= minX &&
                point.x <= maxX &&
                point.y >= minY &&
                point.y <= maxY
            );
        }

        default:
            return false;
    }
}
