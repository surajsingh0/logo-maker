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
  createStar,
  createCurvedLine,
  createHexagon,
  createArrow,
  createPentagon,
  createOctagonStar,
  createBlockArrow,
  createCloud
} from './utils/elementUtils';
import { LogoElement, Position } from './types';
import './App.css';

function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    state: { elements, selectedElementId, canvasSettings },
    addElement,
    updateElement,
    updateMultipleElements,
    removeElement,
    removeSelectedElements,
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
    selectMultipleElements,
    dragSelectedElements,
  } = useLogoState();

  const selectedElements = elements.filter(el => el.selected);
  const hasMultiSelection = selectedElements.length > 1;
  const hasSelection = selectedElements.length > 0;
  const isSelectedElementLocked = selectedElements.find(el => el.id === selectedElementId)?.locked ?? false;
  const areAllSelectedElementsLocked = selectedElements.length > 0 && selectedElements.every(el => el.locked);
  const areSomeSelectedElementsLocked = selectedElements.some(el => el.locked);

  const selectedElement = elements.find(el => el.id === selectedElementId) || null;

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
    addElement(createPolygon(center, 3)); 
  };

  const handleAddStar = () => {
    const center = {
      x: canvasSettings.width / 2,
      y: canvasSettings.height / 2,
    };
    addElement(createStar(center));
  };

  const handleAddCurvedLine = () => {
    const start = {
      x: canvasSettings.width / 2 - 50,
      y: canvasSettings.height / 2 - 30,
    };
    const end = {
      x: canvasSettings.width / 2 + 50,
      y: canvasSettings.height / 2 + 30,
    };
    addElement(createCurvedLine(start, end));
  };

  const handleAddHexagon = () => {
    const center = {
      x: canvasSettings.width / 2,
      y: canvasSettings.height / 2,
    };
    addElement(createHexagon(center));
  };

  const handleAddPentagon = () => {
    const center = {
      x: canvasSettings.width / 2,
      y: canvasSettings.height / 2,
    };
    addElement(createPentagon(center));
  };

  const handleAddOctagonStar = () => {
    const center = {
      x: canvasSettings.width / 2,
      y: canvasSettings.height / 2,
    };
    addElement(createOctagonStar(center));
  };

  const handleAddBlockArrow = () => {
    const center = {
      x: canvasSettings.width / 2 - 60,
      y: canvasSettings.height / 2 - 30,
    };
    addElement(createBlockArrow(center));
  };

  const handleAddCloud = () => {
    const center = {
      x: canvasSettings.width / 2 - 60,
      y: canvasSettings.height / 2 - 40,
    };
    addElement(createCloud(center));
  };

  const handleAddArrow = () => {
    const start = {
      x: canvasSettings.width / 2 - 50,
      y: canvasSettings.height / 2 - 30,
    };
    const end = {
      x: canvasSettings.width / 2 + 50,
      y: canvasSettings.height / 2 + 30,
    };
    addElement(createArrow(start, end));
  };

  const handleElementDrag = (elementId: string, updates: Partial<Pick<LogoElement, 'position' | 'points'>>) => {
    const element = elements.find(el => el.id === elementId);
    if (element && !element.locked) {
      updateElement({
        ...element,
        ...updates
      });
    }
  };

  const handleElementResize = (elementId: string, updates: Partial<LogoElement>) => {
    const element = elements.find(el => el.id === elementId);
    if (element && !element.locked) {
      updateElement({
        ...element,
        ...updates
      });
    }
  };

  const handleElementPointUpdate = (elementId: string, pointIndex: number, newPosition: Position) => {
    const element = elements.find(el => el.id === elementId);
    if (element && !element.locked) {
      updateElementPoint(elementId, pointIndex, newPosition);
    }
  };

  const handleExportSVG = () => {
    exportSvg({ 
      elements, 
      selectedElementId, 
      canvasSettings,
      history: { past: [], future: [] } // Provide empty history for export
    });
  };

  const handleExportPNG = () => {
    exportPng({
      elements,
      selectedElementId,
      canvasSettings,
      history: { past: [], future: [] }
    });
  };

  const handleDelete = () => {
    if (hasMultiSelection) {
      removeSelectedElements();
    } else if (selectedElementId) {
      const element = elements.find(el => el.id === selectedElementId);
      if (element && !element.locked) {
        removeElement(selectedElementId);
      }
    }
  };

  const handleDragMultipleElements = (dx: number, dy: number) => {
    const currentSelectedElements = elements.filter(el => el.selected);
    if (currentSelectedElements.length === 0 || currentSelectedElements.some(el => el.locked)) {
      return;
    }
    dragSelectedElements(dx, dy);
  };

  const handleZoomChange = (newZoomLevel: number) => {
    updateCanvasSettings({ zoomLevel: newZoomLevel });
  };

  const handleToggleLock = () => {
    if (hasMultiSelection) {
      const shouldLock = !areAllSelectedElementsLocked;
      const updatedElements = selectedElements.map(element => ({
        ...element,
        locked: shouldLock
      }));
      updateMultipleElements(updatedElements);
    } else if (selectedElement) {
      updateElement({
        ...selectedElement,
        locked: !selectedElement.locked
      });
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
        onAddCurvedLine={handleAddCurvedLine}
        onAddHexagon={handleAddHexagon}
        onAddPentagon={handleAddPentagon}
        onAddOctagonStar={handleAddOctagonStar}
        onAddBlockArrow={handleAddBlockArrow}
        onAddCloud={handleAddCloud}
        onAddArrow={handleAddArrow}
        onUndo={undo}
        onRedo={redo}
        onDelete={handleDelete}
        onExportSVG={handleExportSVG}
        onExportPNG={handleExportPNG}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onToggleLock={handleToggleLock}
        canUndo={canUndo}
        canRedo={canRedo}
        hasSelection={hasSelection}
        hasMultiSelection={hasMultiSelection}
        isSelectedElementLocked={isSelectedElementLocked}
        areAllSelectedElementsLocked={areAllSelectedElementsLocked}
        areSomeSelectedElementsLocked={areSomeSelectedElementsLocked}
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
          onSelectMultipleElements={selectMultipleElements}
          onDragMultipleElements={handleDragMultipleElements}
          onZoomChange={handleZoomChange}
        />
      </div>
      
      <ElementProperties
        selectedElement={hasMultiSelection ? null : selectedElement}
        onUpdateElement={updateElement}
      />
    </div>
  );
}

export default App;
