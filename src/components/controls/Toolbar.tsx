import React from 'react';
import './Toolbar.css';

interface ToolbarProps {
  onAddRectangle: () => void;
  onAddCircle: () => void;
  onAddText: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onExportSVG: () => void;
  onExportPNG: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelectedElement: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAddRectangle,
  onAddCircle,
  onAddText,
  onUndo,
  onRedo,
  onDelete,
  onExportSVG,
  onExportPNG,
  canUndo,
  canRedo,
  hasSelectedElement,
}) => {
  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3>Add Elements</h3>
        <div className="toolbar-buttons">
          <button 
            className="toolbar-button" 
            onClick={onAddRectangle}
            title="Add Rectangle"
          >
            <i className="icon">⬜</i>
            <span>Rectangle</span>
          </button>
          
          <button 
            className="toolbar-button" 
            onClick={onAddCircle}
            title="Add Circle"
          >
            <i className="icon">⭕</i>
            <span>Circle</span>
          </button>
          
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
        <h3>Actions</h3>
        <div className="toolbar-buttons">
          <button 
            className="toolbar-button" 
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
          >
            <i className="icon">↩️</i>
            <span>Undo</span>
          </button>
          
          <button 
            className="toolbar-button" 
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
          >
            <i className="icon">↪️</i>
            <span>Redo</span>
          </button>
          
          <button 
            className="toolbar-button" 
            onClick={onDelete}
            disabled={!hasSelectedElement}
            title="Delete Selected"
          >
            <i className="icon">🗑️</i>
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
            <i className="icon">📁</i>
            <span>SVG</span>
          </button>
          
          <button 
            className="toolbar-button export-button" 
            onClick={onExportPNG}
            title="Export as PNG"
          >
            <i className="icon">📁</i>
            <span>PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar; 