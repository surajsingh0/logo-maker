import { useRef } from 'react';
import { useLogoState } from './hooks/useLogoState';
import Canvas from './components/canvas/Canvas';
import Toolbar from './components/controls/Toolbar';
import ElementProperties from './components/controls/ElementProperties';
import { exportSvg, exportPng } from './utils/exportUtils';
import { 
  createRectangle, 
  createCircle, 
  createText, 
  createEllipse,
  createLine,
  createPolygon,
  createStar
} from './utils/elementUtils';
import { LogoElement, Position } from './types';
import './App.css';

function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    state: { elements, selectedElementId, canvasSettings },
    addElement,
    updateElement,
    removeElement,
    setSelectedElement,
    selectElementAtPosition,
    updateCanvasSettings,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    undo,
    redo,
    canUndo,
    canRedo,
    updateElementPoint,
  } = useLogoState();

  const selectedElement = elements.find(el => el.id === selectedElementId) || null;

  // Add element handlers
  const handleAddRectangle = () => {
    const center = {
      x: canvasSettings.width / 2 - 50,
      y: canvasSettings.height / 2 - 40,
    };
    addElement(createRectangle(center));
  };

  const handleAddCircle = () => {
    const center = {
      x: canvasSettings.width / 2,
      y: canvasSettings.height / 2,
    };
    addElement(createCircle(center));
  };

  const handleAddText = () => {
    const center = {
      x: canvasSettings.width / 2 - 50,
      y: canvasSettings.height / 2,
    };
    addElement(createText(center, 'Your Text'));
  };

  const handleAddEllipse = () => {
    const center = {
      x: canvasSettings.width / 2,
      y: canvasSettings.height / 2,
    };
    addElement(createEllipse(center));
  };

  const handleAddLine = () => {
    const start = {
      x: canvasSettings.width / 2 - 50,
      y: canvasSettings.height / 2 - 30,
    };
    const end = {
      x: canvasSettings.width / 2 + 50,
      y: canvasSettings.height / 2 + 30,
    };
    addElement(createLine(start, end));
  };

  const handleAddPolygon = () => {
    const center = {
      x: canvasSettings.width / 2,
      y: canvasSettings.height / 2,
    };
    // Default to triangle
    addElement(createPolygon(center, 3)); 
  };

  const handleAddStar = () => {
    const center = {
      x: canvasSettings.width / 2,
      y: canvasSettings.height / 2,
    };
    addElement(createStar(center));
  };

  // Element drag handler
  const handleElementDrag = (elementId: string, updates: Partial<Pick<LogoElement, 'position' | 'points'>>) => {
    const element = elements.find(el => el.id === elementId);
    if (element) {
      updateElement({
        ...element,
        ...updates
      });
    }
  };

  // Element resize handler
  const handleElementResize = (elementId: string, updates: Partial<LogoElement>) => {
    const element = elements.find(el => el.id === elementId);
    if (element) {
      updateElement({
        ...element,
        ...updates
      });
    }
  };

  // Handler for updating a specific point of an element (e.g., line endpoint)
  const handleElementPointUpdate = (elementId: string, pointIndex: number, newPosition: Position) => {
    updateElementPoint(elementId, pointIndex, newPosition);
  };

  // Export handlers
  const handleExportSVG = () => {
    exportSvg({ 
      elements, 
      selectedElementId, 
      canvasSettings,
      history: { past: [], future: [] }  // Empty history is fine for export
    });
  };

  const handleExportPNG = () => {
    if (canvasRef.current) {
      exportPng(canvasRef.current);
    }
  };

  return (
    <div className="app">
      <Toolbar
        onAddRectangle={handleAddRectangle}
        onAddCircle={handleAddCircle}
        onAddText={handleAddText}
        onAddEllipse={handleAddEllipse}
        onAddLine={handleAddLine}
        onAddPolygon={handleAddPolygon}
        onAddStar={handleAddStar}
        onUndo={undo}
        onRedo={redo}
        onDelete={() => selectedElementId && removeElement(selectedElementId)}
        onExportSVG={handleExportSVG}
        onExportPNG={handleExportPNG}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        canUndo={canUndo}
        canRedo={canRedo}
        hasSelectedElement={!!selectedElementId}
      />
      
      <div className="main-content" ref={canvasRef}>
        <Canvas
          elements={elements}
          canvasWidth={canvasSettings.width}
          canvasHeight={canvasSettings.height}
          background={canvasSettings.background}
          showGrid={canvasSettings.showGrid}
          gridSize={canvasSettings.gridSize}
          zoomLevel={canvasSettings.zoomLevel}
          onSelectElement={setSelectedElement}
          onSelectElementAtPosition={selectElementAtPosition}
          onElementDrag={handleElementDrag}
          onElementResize={handleElementResize}
          onElementPointUpdate={handleElementPointUpdate}
        />
      </div>
      
      <ElementProperties
        selectedElement={selectedElement}
        onUpdateElement={updateElement}
      />
    </div>
  );
}

export default App;
