import { toPng, toSvg, toJpeg } from 'html-to-image';
import { saveAs } from 'file-saver';
import { LogoState, CanvasSettings } from '../types';

// Export the logo as an SVG string
export const generateSvgString = (state: LogoState): string => {
  const { canvasSettings, elements } = state;
  const { width, height, background } = canvasSettings;

  let svgContent = `<svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="${width}" 
    height="${height}" 
    viewBox="0 0 ${width} ${height}"
  >`;

  // Add background
  svgContent += `<rect width="${width}" height="${height}" fill="${background}" />`;

  // Add each element
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
          transform="rotate(${element.rotation} ${element.position.x + (element.dimensions?.width || 0) / 2} ${element.position.y + (element.dimensions?.height || 0) / 2})"
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
          transform="rotate(${element.rotation} ${element.position.x} ${element.position.y})"
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
          transform="rotate(${element.rotation} ${element.position.x} ${element.position.y})"
        >${element.content}</text>`;
        break;

      case 'path':
        if (element.points && element.points.length > 0) {
          // Generate SVG path data
          let pathData = `M ${element.points[0].x} ${element.points[0].y}`;
          for (let i = 1; i < element.points.length; i++) {
            pathData += ` L ${element.points[i].x} ${element.points[i].y}`;
          }

          svgContent += `<path 
            d="${pathData}" 
            fill="${element.styles.fill}" 
            stroke="${element.styles.stroke}" 
            stroke-width="${element.styles.strokeWidth}" 
            opacity="${element.styles.opacity}" 
            transform="rotate(${element.rotation} ${element.position.x} ${element.position.y})"
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

// Export the logo as PNG from the canvas element
export const exportPng = async (canvasRef: HTMLElement, filename = 'logo.png'): Promise<void> => {
  try {
    const dataUrl = await toPng(canvasRef, { 
      quality: 0.95,
      pixelRatio: 2
    });
    saveAs(dataUrl, filename);
  } catch (error) {
    console.error('Error exporting as PNG:', error);
  }
};

// Export the logo as JPEG from the canvas element
export const exportJpeg = async (canvasRef: HTMLElement, filename = 'logo.jpg'): Promise<void> => {
  try {
    const dataUrl = await toJpeg(canvasRef, { 
      quality: 0.9,
      pixelRatio: 2
    });
    saveAs(dataUrl, filename);
  } catch (error) {
    console.error('Error exporting as JPEG:', error);
  }
}; 