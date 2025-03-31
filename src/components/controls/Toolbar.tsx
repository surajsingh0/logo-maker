import React, { useState } from 'react';
import './Toolbar.css';

interface ToolbarProps {
  onAddRectangle: () => void;
  onAddCircle: () => void;
  onAddText: () => void;
  onAddEllipse: () => void;
  onAddLine: () => void;
  onAddPolygon: () => void;
  onAddStar: () => void;
  onAddCurvedLine: () => void;
  onAddHexagon: () => void;
  onAddArrow: () => void;
  onAddPentagon: () => void;
  onAddOctagonStar: () => void;
  onAddBlockArrow: () => void;
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
  onAddCurvedLine,
  onAddHexagon,
  onAddArrow,
  onAddPentagon,
  onAddOctagonStar,
  onAddBlockArrow,
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
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    shapes: false,
    text: false,
    arrange: false,
    actions: false,
    export: false
  });

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3 onClick={() => toggleSection('shapes')} className="section-header">
          Shapes
          <span className="collapse-icon">{collapsedSections.shapes ? '▸' : '▾'}</span>
        </h3>
        <div className={`toolbar-buttons ${collapsedSections.shapes ? 'collapsed' : ''}`}>
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
            onClick={onAddPentagon}
            title="Add Pentagon"
          >
            <i className="icon">⬟</i>
            <span>Pentagon</span>
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
            onClick={onAddOctagonStar}
            title="Add Octagon Star"
          >
            <i className="icon">✴</i>
            <span>Octagon Star</span>
          </button>

          <button 
            className="toolbar-button" 
            onClick={onAddHexagon}
            title="Add Hexagon"
          >
            <i className="icon">⬡</i>
            <span>Hexagon</span>
          </button>
          
          <button 
            className="toolbar-button" 
            onClick={onAddLine}
            title="Add Line"
          >
            <i className="icon">╱</i>
            <span>Line</span>
          </button>

          <button 
            className="toolbar-button" 
            onClick={onAddCurvedLine}
            title="Curve"
          >
            <i className="icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 20 Q12 4 20 20" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </i>
            <span>Curve</span>
          </button>

          <button 
            className="toolbar-button" 
            onClick={onAddArrow}
            title="Add Arrow"
          >
            <i className="icon">➔</i>
            <span>Arrow</span>
          </button>

          <button 
            className="toolbar-button" 
            onClick={onAddBlockArrow}
            title="Add Block Arrow"
          >
            <i className="icon">➤</i>
            <span>Block Arrow</span>
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <h3 onClick={() => toggleSection('text')} className="section-header">
          Text
          <span className="collapse-icon">{collapsedSections.text ? '▸' : '▾'}</span>
        </h3>
        <div className={`toolbar-buttons ${collapsedSections.text ? 'collapsed' : ''}`}>
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
        <h3 onClick={() => toggleSection('arrange')} className="section-header">
          Arrange
          <span className="collapse-icon">{collapsedSections.arrange ? '▸' : '▾'}</span>
        </h3>
        <div className={`toolbar-buttons ${collapsedSections.arrange ? 'collapsed' : ''}`}>
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
        <h3 onClick={() => toggleSection('actions')} className="section-header">
          Actions
          <span className="collapse-icon">{collapsedSections.actions ? '▸' : '▾'}</span>
        </h3>
        <div className={`toolbar-buttons ${collapsedSections.actions ? 'collapsed' : ''}`}>
          <button 
            className="toolbar-button" 
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
          >
            <i className="icon">↶</i>
            <span>Undo</span>
          </button>

          <button 
            className="toolbar-button" 
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
          >
            <i className="icon">↷</i>
            <span>Redo</span>
          </button>

          <button 
            className="toolbar-button" 
            onClick={onDelete}
            disabled={!hasSelection}
            title="Delete"
          >
            <i className="icon">🗑</i>
            <span>Delete</span>
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <h3 onClick={() => toggleSection('export')} className="section-header">
          Export
          <span className="collapse-icon">{collapsedSections.export ? '▸' : '▾'}</span>
        </h3>
        <div className={`toolbar-buttons ${collapsedSections.export ? 'collapsed' : ''}`}>
          <button 
            className="toolbar-button export-button" 
            onClick={onExportSVG}
            title="Export as SVG"
          >
            <i className="icon">↓</i>
            <span>Export SVG</span>
          </button>

          <button 
            className="toolbar-button export-button" 
            onClick={onExportPNG}
            title="Export as PNG"
          >
            <i className="icon">↓</i>
            <span>Export PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;