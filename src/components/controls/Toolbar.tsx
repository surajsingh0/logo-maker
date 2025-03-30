import React from 'react';
import './Toolbar.css';

interface ToolbarProps {
  onAddRectangle: () => void;
  onAddCircle: () => void;
  onAddText: () => void;
  onAddEllipse: () => void;
  onAddLine: () => void;
  onAddPolygon: () => void;
  onAddStar: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onExportSVG: () => void;
  onExportPNG: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  hasMultiSelection: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAddRectangle,
  onAddCircle,
  onAddText,
  onAddEllipse,
  onAddLine,
  onAddPolygon,
  onAddStar,
  onUndo,
  onRedo,
  onDelete,
  onExportSVG,
  onExportPNG,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  canUndo,
  canRedo,
  hasSelection,
  hasMultiSelection,
}) => {
  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3>Shapes</h3>
        <div className="toolbar-buttons">
          <button 
            className="toolbar-button" 
            onClick={onAddRectangle}
            title="Add Rectangle"
          >
            <i className="icon">□</i>
            <span>Rectangle</span>
          </button>
          
          <button 
            className="toolbar-button" 
            onClick={onAddCircle}
            title="Add Circle"
          >
            <i className="icon">○</i>
            <span>Circle</span>
          </button>
          
          <button 
            className="toolbar-button" 
            onClick={onAddEllipse}
            title="Add Ellipse"
          >
            <i className="icon">⬭</i>
            <span>Ellipse</span>
          </button>

          <button 
            className="toolbar-button" 
            onClick={onAddPolygon}
            title="Add Polygon (Triangle)"
          >
            <i className="icon">△</i>
            <span>Polygon</span>
          </button>

          <button 
            className="toolbar-button" 
            onClick={onAddStar}
            title="Add Star"
          >
            <i className="icon">★</i>
            <span>Star</span>
          </button>
          
          <button 
            className="toolbar-button" 
            onClick={onAddLine}
            title="Add Line"
          >
            <i className="icon">╱</i>
            <span>Line</span>
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <h3>Text</h3>
        <div className="toolbar-buttons">
          <button 
            className="toolbar-button" 
            onClick={onAddText}
            title="Add Text"
          >
            <i className="icon">T</i>
            <span>Text</span>
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <h3>Arrange</h3>
        <div className="toolbar-buttons">
          <button 
            className="toolbar-button" 
            onClick={onBringToFront}
            disabled={!hasSelection}
            title="Bring to Front"
          >
            <i className="icon">⤒</i>
            <span>Front</span>
          </button>

          <button 
            className="toolbar-button" 
            onClick={onBringForward}
            disabled={!hasSelection}
            title="Bring Forward"
          >
            <i className="icon">↑</i>
            <span>Forward</span>
          </button>

          <button 
            className="toolbar-button" 
            onClick={onSendBackward}
            disabled={!hasSelection}
            title="Send Backward"
          >
            <i className="icon">↓</i>
            <span>Backward</span>
          </button>

          <button 
            className="toolbar-button" 
            onClick={onSendToBack}
            disabled={!hasSelection}
            title="Send to Back"
          >
            <i className="icon">⤓</i>
            <span>Back</span>
          </button>
        </div>
      </div>
      
      <div className="toolbar-section">
        <h3>Edit</h3>
        <div className="toolbar-buttons">
          <button 
            className="toolbar-button" 
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
          >
            <i className="icon">↩</i>
            <span>Undo</span>
          </button>
          
          <button 
            className="toolbar-button" 
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
          >
            <i className="icon">↪</i>
            <span>Redo</span>
          </button>

          <button 
            className="toolbar-button" 
            onClick={onDelete}
            disabled={!hasSelection}
            title="Delete Selected"
          >
            <i className="icon">✕</i>
            <span>Delete</span>
          </button>
        </div>
      </div>
      
      <div className="toolbar-section">
        <h3>Export</h3>
        <div className="toolbar-buttons">
          <button 
            className="toolbar-button export-button" 
            onClick={onExportSVG}
            title="Export as SVG"
          >
            <i className="icon">💾</i>
            <span>Export SVG</span>
          </button>
          
          <button 
            className="toolbar-button export-button" 
            onClick={onExportPNG}
            title="Export as PNG"
          >
            <i className="icon">🖼️</i>
            <span>Export PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar; 