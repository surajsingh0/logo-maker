import { useState, useCallback } from 'react';
import { LogoState, LogoElement, CanvasSettings, Position } from '../types';
import { isPointInElement } from '../utils/elementUtils';

const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  width: 800,
  height: 600,
  background: '#ffffff',
  gridSize: 20,
  showGrid: true,
  zoomLevel: 1,
};

const INITIAL_STATE: LogoState = {
  elements: [],
  selectedElementId: null,
  canvasSettings: DEFAULT_CANVAS_SETTINGS,
  history: {
    past: [],
    future: [],
  },
};

export const useLogoState = (initialState = INITIAL_STATE) => {
  const [state, setState] = useState<LogoState>(initialState);

  // Save current state to history and apply changes
  const saveState = useCallback((newState: Partial<LogoState>) => {
    setState(prevState => {
      // Create a copy of the current state for history
      const historyCopy = {
        ...prevState,
        history: {
          past: [...prevState.history.past, { ...prevState, history: { past: [], future: [] } }],
          future: [],
        },
      };
      
      // Apply the new state changes
      return { ...historyCopy, ...newState };
    });
  }, []);

  // Add a new element
  const addElement = useCallback((element: LogoElement) => {
    saveState({
      elements: [...state.elements, element],
      selectedElementId: element.id,
    });
  }, [state.elements, saveState]);

  // Update an existing element
  const updateElement = useCallback((updatedElement: LogoElement) => {
    saveState({
      elements: state.elements.map(element => 
        element.id === updatedElement.id ? updatedElement : element
      ),
    });
  }, [state.elements, saveState]);

  // Remove an element
  const removeElement = useCallback((elementId: string) => {
    saveState({
      elements: state.elements.filter(element => element.id !== elementId),
      selectedElementId: state.selectedElementId === elementId ? null : state.selectedElementId,
    });
  }, [state.elements, state.selectedElementId, saveState]);

  // Set the selected element
  const setSelectedElement = useCallback((elementId: string | null) => {
    // Deselect all elements
    const updatedElements = state.elements.map(element => ({
      ...element,
      selected: element.id === elementId,
    }));

    setState(prevState => ({
      ...prevState,
      elements: updatedElements,
      selectedElementId: elementId,
    }));
  }, [state.elements]);

  // Select element at a position
  const selectElementAtPosition = useCallback((position: Position) => {
    // Check elements in reverse order (top to bottom in z-index)
    for (let i = state.elements.length - 1; i >= 0; i--) {
      const element = state.elements[i];
      if (isPointInElement(element, position)) {
        setSelectedElement(element.id);
        return element.id;
      }
    }
    
    // No element found at position
    setSelectedElement(null);
    return null;
  }, [state.elements, setSelectedElement]);

  // Update canvas settings
  const updateCanvasSettings = useCallback((settings: Partial<CanvasSettings>) => {
    saveState({
      canvasSettings: { ...state.canvasSettings, ...settings },
    });
  }, [state.canvasSettings, saveState]);

  // Undo to previous state
  const undo = useCallback(() => {
    setState(prevState => {
      if (prevState.history.past.length === 0) return prevState;
      
      const previous = prevState.history.past[prevState.history.past.length - 1];
      const newPast = prevState.history.past.slice(0, -1);
      
      return {
        ...previous,
        history: {
          past: newPast,
          future: [
            { ...prevState, history: { past: [], future: [] } },
            ...prevState.history.future,
          ],
        },
      };
    });
  }, []);

  // Redo to a future state
  const redo = useCallback(() => {
    setState(prevState => {
      if (prevState.history.future.length === 0) return prevState;
      
      const next = prevState.history.future[0];
      const newFuture = prevState.history.future.slice(1);
      
      return {
        ...next,
        history: {
          past: [...prevState.history.past, { ...prevState, history: { past: [], future: [] } }],
          future: newFuture,
        },
      };
    });
  }, []);

  // Z-index manipulation functions
  const bringForward = useCallback(() => {
    if (!state.selectedElementId) return;
    
    const elements = [...state.elements];
    const selectedIndex = elements.findIndex(el => el.id === state.selectedElementId);
    
    if (selectedIndex < elements.length - 1) {
      // Swap with the element above
      [elements[selectedIndex], elements[selectedIndex + 1]] = 
      [elements[selectedIndex + 1], elements[selectedIndex]];
      
      saveState({ elements });
    }
  }, [state.elements, state.selectedElementId, saveState]);

  const sendBackward = useCallback(() => {
    if (!state.selectedElementId) return;
    
    const elements = [...state.elements];
    const selectedIndex = elements.findIndex(el => el.id === state.selectedElementId);
    
    if (selectedIndex > 0) {
      // Swap with the element below
      [elements[selectedIndex], elements[selectedIndex - 1]] = 
      [elements[selectedIndex - 1], elements[selectedIndex]];
      
      saveState({ elements });
    }
  }, [state.elements, state.selectedElementId, saveState]);

  const bringToFront = useCallback(() => {
    if (!state.selectedElementId) return;
    
    const elements = [...state.elements];
    const selectedIndex = elements.findIndex(el => el.id === state.selectedElementId);
    
    if (selectedIndex < elements.length - 1) {
      // Remove the element and add it to the end
      const [element] = elements.splice(selectedIndex, 1);
      elements.push(element);
      
      saveState({ elements });
    }
  }, [state.elements, state.selectedElementId, saveState]);

  const sendToBack = useCallback(() => {
    if (!state.selectedElementId) return;
    
    const elements = [...state.elements];
    const selectedIndex = elements.findIndex(el => el.id === state.selectedElementId);
    
    if (selectedIndex > 0) {
      // Remove the element and add it to the beginning
      const [element] = elements.splice(selectedIndex, 1);
      elements.unshift(element);
      
      saveState({ elements });
    }
  }, [state.elements, state.selectedElementId, saveState]);

  // Check if undo/redo are available
  const canUndo = state.history.past.length > 0;
  const canRedo = state.history.future.length > 0;

  return {
    state,
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
  };
}; 