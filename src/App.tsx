import { useRef } from 'react';
import { useLogoState } from './hooks/useLogoState';
import Canvas from './components/canvas/Canvas';
import Toolbar from './components/controls/Toolbar';
import ElementProperties from './components/controls/ElementProperties';
import { exportSvg, exportPng } from './utils/exportUtils';
import { createRectangle, createCircle, createText } from './utils/elementUtils';
import './App.css';

function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    state,
    addElement,
    updateElement,
    removeElement,
    setSelectedElement,
    selectElementAtPosition,
    updateCanvasSettings,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useLogoState();

  const { 
    elements, 
    selectedElementId, 
    canvasSettings 
  } = state;

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

  // Element drag handler
  const handleElementDrag = (elementId: string, newPosition: { x: number; y: number }) => {
    const element = elements.find(el => el.id === elementId);
    if (element) {
      updateElement({
        ...element,
        position: newPosition,
      });
    }
  };

  // Export handlers
  const handleExportSVG = () => {
    exportSvg(state);
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
        onUndo={undo}
        onRedo={redo}
        onDelete={() => selectedElementId && removeElement(selectedElementId)}
        onExportSVG={handleExportSVG}
        onExportPNG={handleExportPNG}
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
