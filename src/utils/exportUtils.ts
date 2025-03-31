import { toPng, toSvg, toJpeg } from 'html-to-image';
import { saveAs } from 'file-saver';
import { LogoState, CanvasSettings, LogoElement } from '../types';
import { calculateOverallBoundingBox } from './geometryUtils';

// Export the logo as an SVG string
export const generateSvgString = (state: LogoState): string => {
  const { canvasSettings, elements } = state;
  
  // Calculate the overall bounding box of the elements
  const overallBox = calculateOverallBoundingBox(elements);
  
  // Determine SVG dimensions and viewBox
  let svgWidth: number;
  let svgHeight: number;
  let viewBox: string;
  
  if (overallBox && overallBox.width > 0 && overallBox.height > 0) {
    // Use bounding box dimensions
    svgWidth = Math.ceil(overallBox.width);
    svgHeight = Math.ceil(overallBox.height);
    viewBox = `${overallBox.minX} ${overallBox.minY} ${overallBox.width} ${overallBox.height}`;
  } else {
    // Fallback to canvas settings if no elements or invalid box
    svgWidth = canvasSettings.width;
    svgHeight = canvasSettings.height;
    viewBox = `0 0 ${svgWidth} ${svgHeight}`;
    // If no elements, return an empty SVG or minimal SVG
    if (elements.length === 0) {
        return `<svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="${svgWidth}" 
            height="${svgHeight}" 
            viewBox="${viewBox}"
            style="background-color: transparent;"
        ></svg>`;
    }
  }

  let svgContent = `<svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="${svgWidth}" 
    height="${svgHeight}" 
    viewBox="${viewBox}"
    style="background-color: transparent;"
  >`;

  // Add each element (coordinates are now relative to the viewBox origin)
  elements.forEach(element => {
    switch (element.type) {
      case 'rectangle':
        svgContent += `<rect 
          x="${element.position.x}" 
          y="${element.position.y}" 
          width="${element.dimensions?.width}" 
          height="${element.dimensions?.height}" 
          fill="${element.styles.fill}" 
          stroke="${element.styles.stroke}" 
          stroke-width="${element.styles.strokeWidth}" 
          opacity="${element.styles.opacity}" 
          transform="rotate(${element.rotation} ${element.position.x + (element.dimensions?.width || 0) / 2} ${element.position.y + (element.dimensions?.height || 0) / 2})"\
        />`;
        break;

      case 'circle':
        svgContent += `<circle 
          cx="${element.position.x}" 
          cy="${element.position.y}" 
          r="${element.radius}" 
          fill="${element.styles.fill}" 
          stroke="${element.styles.stroke}" 
          stroke-width="${element.styles.strokeWidth}" 
          opacity="${element.styles.opacity}" 
          transform="rotate(${element.rotation} ${element.position.x} ${element.position.y})"\
        />`;
        break;

      case 'text':
        svgContent += `<text 
          x="${element.position.x}" 
          y="${element.position.y}" 
          fill="${element.styles.fill}" 
          font-family="${element.fontFamily}" 
          font-size="${element.fontSize}px" 
          opacity="${element.styles.opacity}" 
          text-anchor="middle"
          dominant-baseline="middle"
          transform="rotate(${element.rotation} ${element.position.x} ${element.position.y})"
        >${element.content}</text>`;
        break;

      case 'path':
        if (element.points && element.points.length > 0) {
          let pathData = `M ${element.points[0].x} ${element.points[0].y}`;
          for (let i = 1; i < element.points.length; i++) {
            pathData += ` L ${element.points[i].x} ${element.points[i].y}`;
          }

          svgContent += `<path 
            d="${pathData}" 
            fill="${element.styles.fill === 'none' ? 'transparent' : element.styles.fill}"
            stroke="${element.styles.stroke}" 
            stroke-width="${element.styles.strokeWidth}" 
            opacity="${element.styles.opacity}" 
          />`;
        }
        break;
      
      case 'polygon': {
        const sides = element.sides || 3;
        const radius = element.radius || 0;
        if (radius > 0) {
          const polyPoints: string[] = [];
          for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * 2 * Math.PI - Math.PI / 2;
            const px = element.position.x + radius * Math.cos(angle);
            const py = element.position.y + radius * Math.sin(angle);
            polyPoints.push(`${px},${py}`);
          }
          const pointsStr = polyPoints.join(' ');
          svgContent += `<polygon 
            points="${pointsStr}" 
            fill="${element.styles.fill}" 
            stroke="${element.styles.stroke}" 
            stroke-width="${element.styles.strokeWidth}" 
            opacity="${element.styles.opacity}" 
            transform="rotate(${element.rotation} ${element.position.x} ${element.position.y})"
          />`;
        }
        break;
      }

      case 'star': {
        const numPoints = element.numPoints || 5;
        const outerRadius = element.outerRadius || 0;
        const innerRadius = element.innerRadius || outerRadius / 2;
        if (outerRadius > 0) {
          const starPoints: string[] = [];
          for (let i = 0; i < numPoints * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i / (numPoints * 2)) * 2 * Math.PI - Math.PI / 2;
            const px = element.position.x + radius * Math.cos(angle);
            const py = element.position.y + radius * Math.sin(angle);
            starPoints.push(`${px},${py}`);
          }
          const pointsStr = starPoints.join(' ');
          svgContent += `<polygon 
            points="${pointsStr}" 
            fill="${element.styles.fill}" 
            stroke="${element.styles.stroke}" 
            stroke-width="${element.styles.strokeWidth}" 
            opacity="${element.styles.opacity}" 
            transform="rotate(${element.rotation} ${element.position.x} ${element.position.y})"
          />`;
        }
        break;
      }

      case 'hexagon': {
        const hexRadius = element.radius || 0;
        if (hexRadius > 0) {
          const hexPoints: string[] = [];
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * 2 * Math.PI - Math.PI / 2;
            const px = element.position.x + hexRadius * Math.cos(angle);
            const py = element.position.y + hexRadius * Math.sin(angle);
            hexPoints.push(`${px},${py}`);
          }
          const pointsStr = hexPoints.join(' ');
          svgContent += `<polygon 
            points="${pointsStr}" 
            fill="${element.styles.fill}" 
            stroke="${element.styles.stroke}" 
            stroke-width="${element.styles.strokeWidth}" 
            opacity="${element.styles.opacity}" 
            transform="rotate(${element.rotation} ${element.position.x} ${element.position.y})"
          />`;
        }
        break;
      }

      case 'pentagon': {
        const pentRadius = element.radius || 0;
        if (pentRadius > 0) {
          const pentPoints: string[] = [];
          for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * 2 * Math.PI - Math.PI / 2;
            const px = element.position.x + pentRadius * Math.cos(angle);
            const py = element.position.y + pentRadius * Math.sin(angle);
            pentPoints.push(`${px},${py}`);
          }
          const pointsStr = pentPoints.join(' ');
          svgContent += `<polygon 
            points="${pointsStr}" 
            fill="${element.styles.fill}" 
            stroke="${element.styles.stroke}" 
            stroke-width="${element.styles.strokeWidth}" 
            opacity="${element.styles.opacity}" 
            transform="rotate(${element.rotation} ${element.position.x} ${element.position.y})"
          />`;
        }
        break;
      }

      case 'octagonStar': {
        const starRadius = element.radius || 0;
        if (starRadius > 0) {
          const starPoints: string[] = [];
          for (let i = 0; i < 16; i++) {
            const currentRadius = i % 2 === 0 ? starRadius : starRadius * 0.4;
            const angle = (i * Math.PI) / 8;
            const px = element.position.x + currentRadius * Math.cos(angle);
            const py = element.position.y + currentRadius * Math.sin(angle);
            starPoints.push(`${px},${py}`);
          }
          const pointsStr = starPoints.join(' ');
          svgContent += `<polygon 
            points="${pointsStr}" 
            fill="${element.styles.fill}" 
            stroke="${element.styles.stroke}" 
            stroke-width="${element.styles.strokeWidth}" 
            opacity="${element.styles.opacity}" 
            transform="rotate(${element.rotation} ${element.position.x} ${element.position.y})"
          />`;
        }
        break;
      }

      case 'blockArrow': {
        const points = element.points || [];
        if (points.length > 0) {
          // Convert points to absolute coordinates
          const absolutePoints = points.map(p => ({
            x: p.x + element.position.x,
            y: p.y + element.position.y
          }));
          const pointsStr = absolutePoints.map(p => `${p.x},${p.y}`).join(' ');
          
          // Calculate center for rotation
          const { width = 0, height = 0 } = element.dimensions || {};
          const centerX = element.position.x + width / 2;
          const centerY = element.position.y + height / 2;

          svgContent += `<polygon 
            points="${pointsStr}" 
            fill="${element.styles.fill}" 
            stroke="${element.styles.stroke}" 
            stroke-width="${element.styles.strokeWidth}" 
            opacity="${element.styles.opacity}" 
            transform="rotate(${element.rotation} ${centerX} ${centerY})"
          />`;
        }
        break;
      }

      case 'cloud': {
        if (element.pathData) {
          const { width = 0, height = 0 } = element.dimensions || {};
          const centerX = element.position.x + width / 2;
          const centerY = element.position.y + height / 2;

          svgContent += `<path 
            d="${element.pathData}" 
            fill="${element.styles.fill}" 
            stroke="${element.styles.stroke}" 
            stroke-width="${element.styles.strokeWidth}" 
            opacity="${element.styles.opacity}" 
            transform="translate(${element.position.x} ${element.position.y}) rotate(${element.rotation} ${width/2} ${height/2})"
          />`;
        }
        break;
      }

      case 'ellipse':
        svgContent += `<ellipse 
          cx="${element.position.x}" 
          cy="${element.position.y}" 
          rx="${element.rx}" 
          ry="${element.ry}" 
          fill="${element.styles.fill}" 
          stroke="${element.styles.stroke}" 
          stroke-width="${element.styles.strokeWidth}" 
          opacity="${element.styles.opacity}" 
          transform="rotate(${element.rotation} ${element.position.x} ${element.position.y})"\
        />`;
        break;

      case 'line':
        if (element.points && element.points.length >= 2) {
          const x1 = element.points[0].x;
          const y1 = element.points[0].y;
          const x2 = element.points[1].x;
          const y2 = element.points[1].y;
          svgContent += `<line 
            x1="${x1}" 
            y1="${y1}" 
            x2="${x2}" 
            y2="${y2}" 
            stroke="${element.styles.stroke}" 
            stroke-width="${element.styles.strokeWidth}" 
            opacity="${element.styles.opacity}" 
          />`;
        }
        break;

      case 'arrow':
        if (element.points && element.points.length >= 2) {
          const [start, end] = element.points;
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

          svgContent += `<path 
            d="M ${start.x} ${start.y} L ${end.x} ${end.y} M ${arrowHead1.x} ${arrowHead1.y} L ${end.x} ${end.y} L ${arrowHead2.x} ${arrowHead2.y}"
            fill="none"
            stroke="${element.styles.stroke}" 
            stroke-width="${element.styles.strokeWidth}" 
            opacity="${element.styles.opacity}" 
          />`;
        }
        break;
    }
  });

  svgContent += '</svg>';
  return svgContent;
};

// Export the logo as SVG
export const exportSvg = async (state: LogoState, filename = 'logo.svg'): Promise<void> => {
  const svgString = generateSvgString(state);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  saveAs(blob, filename);
};

// Export the logo as PNG using offscreen canvas
export const exportPng = async (state: LogoState, filename = 'logo.png'): Promise<void> => {
  try {
    // Calculate bounding box again for PNG dimensions
    const overallBox = calculateOverallBoundingBox(state.elements);

    // Handle case with no elements or invalid box
    if (!overallBox || overallBox.width <= 0 || overallBox.height <= 0) {
      console.warn('No content to export for PNG.');
      // Optional: Export a small transparent PNG or show an error
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const pngDataUrl = canvas.toDataURL('image/png');
      saveAs(pngDataUrl, filename);
      return;
    }

    const svgString = generateSvgString(state); // Generate SVG with correct viewBox
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2; // Resolution scale factor
      // Use bounding box dimensions for the canvas
      canvas.width = Math.ceil(overallBox.width * scale);
      canvas.height = Math.ceil(overallBox.height * scale);
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
         ctx.scale(scale, scale);
         // Draw the SVG image. The viewBox handles the translation, so draw at (0,0)
         // relative to the bounding box origin.
         ctx.drawImage(img, 0, 0, overallBox.width, overallBox.height);
         const pngDataUrl = canvas.toDataURL('image/png');
         saveAs(pngDataUrl, filename);
      } else {
         console.error('Could not get 2D context for canvas');
      }
    };

    img.onerror = (error) => {
      console.error('Error loading SVG image for PNG export:', error);
    };

    img.src = svgDataUrl;

  } catch (error) {
    console.error('Error exporting as PNG:', error);
  }
};

// Export the logo as JPEG from the canvas element (consider rewriting like PNG if needed)
export const exportJpeg = async (canvasRef: HTMLElement, filename = 'logo.jpg'): Promise<void> => {
  try {
    const dataUrl = await toJpeg(canvasRef, { 
      quality: 0.9,
      pixelRatio: 2,
    });
    saveAs(dataUrl, filename);
  } catch (error) {
    console.error('Error exporting as JPEG:', error);
  }
}; 