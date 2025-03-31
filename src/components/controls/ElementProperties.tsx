import React, { useState, useEffect } from 'react';
import { LogoElement } from '../../types';
import { SketchPicker, ColorResult } from 'react-color';
import './ElementProperties.css';

interface ElementPropertiesProps {
  selectedElement: LogoElement | null;
  onUpdateElement: (element: LogoElement) => void;
}

const ElementProperties: React.FC<ElementPropertiesProps> = ({
  selectedElement,
  onUpdateElement,
}) => {
  const [element, setElement] = useState<LogoElement | null>(null);
  const [showFillPicker, setShowFillPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);

  useEffect(() => {
    setElement(selectedElement);
  }, [selectedElement]);

  if (!element) {
    return (
      <div className="element-properties">
        <div className="no-selection">
          <p>No element selected</p>
          <p>Click on an element to edit its properties</p>
        </div>
      </div>
    );
  }

  const handleChange = (field: string, value: string | number | object) => {
    const updatedElement = { ...element } as any;

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updatedElement[parent] = {
        ...updatedElement[parent],
        [child]: value,
      };
    } else {
      updatedElement[field] = value;
    }

    setElement(updatedElement);
    onUpdateElement(updatedElement);
  };

  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    handleChange('position', {
      ...element.position,
      [axis]: numValue,
    });
  };

  const handleDimensionsChange = (dimension: 'width' | 'height', value: string) => {
    if (element.type !== 'rectangle' || !element.dimensions) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    handleChange('dimensions', {
      ...element.dimensions,
      [dimension]: numValue,
    });
  };

  const handleRadiusChange = (value: string) => {
    if (element.type !== 'circle') return;

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    handleChange('radius', numValue);
  };

  const handleTextChange = (field: 'content' | 'fontFamily' | 'fontSize', value: string | number) => {
    if (element.type !== 'text') return;

    if (field === 'fontSize') {
      const numValue = parseFloat(value.toString());
      if (isNaN(numValue) || numValue <= 0) return;
      handleChange(field, numValue);
    } else {
      handleChange(field, value);
    }
  };

  const commonControls = (
    <>
      <div className="property-group">
        <h4>Position</h4>
        <div className="property-row">
          <label>X:</label>
          <input
            type="number"
            value={element.position.x}
            onChange={(e) => handlePositionChange('x', e.target.value)}
          />
        </div>
        <div className="property-row">
          <label>Y:</label>
          <input
            type="number"
            value={element.position.y}
            onChange={(e) => handlePositionChange('y', e.target.value)}
          />
        </div>
      </div>

      <div className="property-group">
        <h4>Appearance</h4>
        <div className="property-row">
          <label>Fill:</label>
          <div className="color-input-wrapper">
            <div
              className="color-preview"
              style={{ backgroundColor: element.styles.fill }}
              onClick={() => setShowFillPicker(!showFillPicker)}
            />
            {showFillPicker && (
              <div className="color-picker-popover">
                <div 
                  className="color-picker-cover" 
                  onClick={() => setShowFillPicker(false)} 
                />
                <SketchPicker
                  color={element.styles.fill}
                  onChange={(color: ColorResult) => handleChange('styles.fill', color.hex)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="property-row">
          <label>Stroke:</label>
          <div className="color-input-wrapper">
            <div
              className="color-preview"
              style={{ backgroundColor: element.styles.stroke }}
              onClick={() => setShowStrokePicker(!showStrokePicker)}
            />
            {showStrokePicker && (
              <div className="color-picker-popover">
                <div 
                  className="color-picker-cover" 
                  onClick={() => setShowStrokePicker(false)} 
                />
                <SketchPicker
                  color={element.styles.stroke}
                  onChange={(color: ColorResult) => handleChange('styles.stroke', color.hex)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="property-row">
          <label>Stroke Width:</label>
          <input
            type="number"
            min="0"
            max="20"
            value={element.styles.strokeWidth}
            onChange={(e) => handleChange('styles.strokeWidth', parseFloat(e.target.value))}
          />
        </div>

        <div className="property-row">
          <label>Opacity:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={element.styles.opacity}
            onChange={(e) => handleChange('styles.opacity', parseFloat(e.target.value))}
          />
          <span className="range-value">{element.styles.opacity.toFixed(1)}</span>
        </div>
      </div>

      <div className="property-group">
        <h4>Transform</h4>
        <div className="property-row">
          <label>Rotation:</label>
          <input
            type="range"
            min="0"
            max="360"
            value={element.rotation}
            onChange={(e) => handleChange('rotation', parseFloat(e.target.value))}
          />
          <span className="range-value">{element.rotation}°</span>
        </div>
      </div>
    </>
  );

  let specificControls = null;

  switch (element.type) {
    case 'rectangle':
      specificControls = (
        <div className="property-group">
          <h4>Rectangle Properties</h4>
          <div className="property-row">
            <label>Width:</label>
            <input
              type="number"
              min="1"
              value={element.dimensions?.width || 0}
              onChange={(e) => handleDimensionsChange('width', e.target.value)}
            />
          </div>
          <div className="property-row">
            <label>Height:</label>
            <input
              type="number"
              min="1"
              value={element.dimensions?.height || 0}
              onChange={(e) => handleDimensionsChange('height', e.target.value)}
            />
          </div>
        </div>
      );
      break;

    case 'circle':
      specificControls = (
        <div className="property-group">
          <h4>Circle Properties</h4>
          <div className="property-row">
            <label>Radius:</label>
            <input
              type="number"
              min="1"
              value={element.radius || 0}
              onChange={(e) => handleRadiusChange(e.target.value)}
            />
          </div>
        </div>
      );
      break;

    case 'text':
      specificControls = (
        <div className="property-group">
          <h4>Text Properties</h4>
          <div className="property-row">
            <label>Content:</label>
            <input
              type="text"
              value={element.content || ''}
              onChange={(e) => handleTextChange('content', e.target.value)}
            />
          </div>
          <div className="property-row">
            <label>Font:</label>
            <select
              value={element.fontFamily || 'Arial'}
              onChange={(e) => handleTextChange('fontFamily', e.target.value)}
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Impact">Impact</option>
            </select>
          </div>
          <div className="property-row">
            <label>Size:</label>
            <input
              type="number"
              min="1"
              value={element.fontSize || 24}
              onChange={(e) => handleTextChange('fontSize', e.target.value)}
            />
          </div>
        </div>
      );
      break;

    case 'arrow':
      specificControls = (
        <div className="property-group">
          <h4>Arrow Properties</h4>
          <div className="property-row">
            <label>Arrow Head Size:</label>
            <input
              type="number"
              min="5"
              max="50"
              value={element.arrowHeadSize || 15}
              onChange={(e) => handleChange('arrowHeadSize', parseFloat(e.target.value))}
            />
          </div>
        </div>
      );
      break;
  }

  return (
    <div className="element-properties">
      <h3>Element Properties</h3>
      {commonControls}
      {specificControls}
    </div>
  );
};

export default ElementProperties; 