import { useState, useCallback } from "react";
import { LogoState, LogoElement, CanvasSettings, Position } from "../types";
import { isPointInElement } from "../utils/elementUtils";

const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
    width: 800,
    height: 600,
    background: "#ffffff",
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
    const saveState = useCallback(
        (
            newState:
                | Partial<LogoState>
                | ((prevState: LogoState) => Partial<LogoState>)
        ) => {
            // Check if newState is a function or an object
            const update =
                typeof newState === "function" ? newState(state) : newState;

            setState((prevState) => {
                // Create a copy of the current state for history
                const historyCopy = {
                    ...prevState,
                    history: {
                        // Only add to history if it's not identical to the last past state
                        past: [
                            ...prevState.history.past,
                            { ...prevState, history: { past: [], future: [] } },
                        ],
                        future: [],
                    },
                };

                return { ...historyCopy, ...update };
            });
        },
        [state]
    );

    const addElement = useCallback(
        (element: LogoElement) => {
            saveState({
                elements: [...state.elements, element],
                selectedElementId: element.id,
            });
        },
        [state.elements, saveState]
    );

    const updateElement = useCallback(
        (updatedElement: LogoElement) => {
            saveState({
                elements: state.elements.map((element) =>
                    element.id === updatedElement.id ? updatedElement : element
                ),
            });
        },
        [state.elements, saveState]
    );

    const removeElement = useCallback(
        (elementId: string) => {
            saveState((prevState) => ({
                elements: prevState.elements.filter(
                    (element) => element.id !== elementId
                ),
                selectedElementId:
                    prevState.selectedElementId === elementId
                        ? null
                        : prevState.selectedElementId,
                // Reset selection flags if the removed element was the only one selected
                ...(prevState.selectedElementId === elementId &&
                prevState.elements.filter((el) => el.selected).length === 1
                    ? {
                          elements: prevState.elements
                              .filter((element) => element.id !== elementId)
                              .map((el) => ({ ...el, selected: false })),
                      }
                    : {}),
            }));
        },
        [saveState]
    );

    const removeSelectedElements = useCallback(() => {
        saveState((prevState) => ({
            elements: prevState.elements.filter(
                (el) => !el.selected || el.locked
            ),
            selectedElementId: null, // Clear selection
        }));
    }, [saveState]);

    const setSelectedElement = useCallback(
        (elementId: string | null) => {
            // Deselect all elements
            const updatedElements = state.elements.map((element) => ({
                ...element,
                selected: element.id === elementId,
            }));

            saveState({
                elements: updatedElements,
                selectedElementId: elementId,
            });
        },
        [state.elements, saveState]
    );

    const selectElementAtPosition = useCallback(
        (position: Position) => {
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
        },
        [state.elements, setSelectedElement]
    );

    const updateCanvasSettings = useCallback(
        (settings: Partial<CanvasSettings>) => {
            saveState({
                canvasSettings: { ...state.canvasSettings, ...settings },
            });
        },
        [state.canvasSettings, saveState]
    );

    const undo = useCallback(() => {
        setState((prevState) => {
            if (prevState.history.past.length === 0) return prevState;

            const previous =
                prevState.history.past[prevState.history.past.length - 1];
            const newPast = prevState.history.past.slice(0, -1);

            return {
                ...previous,
                history: {
                    past: newPast,
                    future: [
                        { ...prevState, history: { past: [], future: [] } }, // Add current state to future
                        ...prevState.history.future,
                    ],
                },
            };
        });
    }, [setState]); // Dependency is setState

    const redo = useCallback(() => {
        setState((prevState) => {
            if (prevState.history.future.length === 0) return prevState;

            const next = prevState.history.future[0];
            const newFuture = prevState.history.future.slice(1);

            return {
                ...next,
                history: {
                    past: [
                        ...prevState.history.past,
                        { ...prevState, history: { past: [], future: [] } },
                    ], // Add current state to past
                    future: newFuture,
                },
            };
        });
    }, [setState]);

    // Z-index manipulation functions
    const bringForward = useCallback(() => {
        saveState((prevState) => {
            let items = [...prevState.elements];
            const selectedIndices = prevState.elements
                .map((el, index) => (el.selected ? index : -1))
                .filter((index) => index !== -1)
                .sort((a, b) => a - b); // Process from bottom up

            if (selectedIndices.length === 0) return prevState;

            // Move block forward if possible
            for (let i = selectedIndices.length - 1; i >= 0; i--) {
                const currentIndex = selectedIndices[i];
                // Find the actual current index after potential previous swaps
                const actualIndex = items.findIndex(
                    (el) => el.id === prevState.elements[currentIndex].id
                );
                if (
                    actualIndex < items.length - 1 &&
                    !items[actualIndex + 1].selected
                ) {
                    // Swap with the unselected item above
                    [items[actualIndex], items[actualIndex + 1]] = [
                        items[actualIndex + 1],
                        items[actualIndex],
                    ];
                }
            }
            return { ...prevState, elements: items };
        });
    }, [saveState]);

    const sendBackward = useCallback(() => {
        saveState((prevState) => {
            let items = [...prevState.elements];
            const selectedIndices = prevState.elements
                .map((el, index) => (el.selected ? index : -1))
                .filter((index) => index !== -1)
                .sort((a, b) => a - b); // Process from top down

            if (selectedIndices.length === 0) return prevState;

            for (let i = 0; i < selectedIndices.length; i++) {
                const currentIndex = selectedIndices[i];
                const actualIndex = items.findIndex(
                    (el) => el.id === prevState.elements[currentIndex].id
                );
                if (actualIndex > 0 && !items[actualIndex - 1].selected) {
                    // Swap with the unselected item below
                    [items[actualIndex], items[actualIndex - 1]] = [
                        items[actualIndex - 1],
                        items[actualIndex],
                    ];
                }
            }
            return { ...prevState, elements: items };
        });
    }, [saveState]);

    const bringToFront = useCallback(() => {
        saveState((prevState) => {
            const selectedItems = prevState.elements.filter(
                (el) => el.selected
            );
            const otherItems = prevState.elements.filter((el) => !el.selected);
            if (selectedItems.length === 0) return prevState;
            return {
                ...prevState,
                elements: [...otherItems, ...selectedItems],
            };
        });
    }, [saveState]);

    const sendToBack = useCallback(() => {
        saveState((prevState) => {
            const selectedItems = prevState.elements.filter(
                (el) => el.selected
            );
            const otherItems = prevState.elements.filter((el) => !el.selected);
            if (selectedItems.length === 0) return prevState;
            return {
                ...prevState,
                elements: [...selectedItems, ...otherItems],
            };
        });
    }, [saveState]);

    const canUndo = state.history.past.length > 0;
    const canRedo = state.history.future.length > 0;

    const updateElementPoint = useCallback(
        (elementId: string, pointIndex: number, newPosition: Position) => {
            saveState({
                elements: state.elements.map((el) => {
                    if (el.id === elementId && el.points) {
                        const newPoints = [...el.points];
                        if (pointIndex >= 0 && pointIndex < newPoints.length) {
                            newPoints[pointIndex] = newPosition;
                            return { ...el, points: newPoints };
                        }
                    }
                    return el;
                }),
            });
        },
        [state.elements, saveState]
    );

    const selectMultipleElements = useCallback(
        (elementIds: string[]) => {
            const selectedIdsSet = new Set(elementIds);

            // First update the state with a proper setState call to ensure it's available immediately
            setState((prevState) => {
                const updatedElements = prevState.elements.map((el) => ({
                    ...el,
                    selected: selectedIdsSet.has(el.id),
                }));

                return {
                    ...prevState,
                    elements: updatedElements,
                    selectedElementId:
                        elementIds.length === 1 ? elementIds[0] : null,
                };
            });

            // Then add this to history via saveState
            saveState(() => ({
                // No need to update elements again since we did that in setState already
                selectedElementId:
                    elementIds.length === 1 ? elementIds[0] : null,
            }));
        },
        [setState, saveState]
    );

    const dragSelectedElements = useCallback(
        (dx: number, dy: number) => {
            // Get a fresh snapshot of elements to ensure we're working with up-to-date state
            setState((prevState) => {
                // Find the selected elements directly from the current state
                const selectedElements = prevState.elements.filter(
                    (el) => el.selected
                );

                if (selectedElements.length === 0) {
                    return prevState; // No changes
                }

                // Update positions for all selected elements
                const updatedElements = prevState.elements.map((el) => {
                    if (!el.selected) return el;

                    const newPosition = {
                        x: el.position.x + dx,
                        y: el.position.y + dy,
                    };
                    let newPoints = el.points;

                    if (el.type === "line" && el.points) {
                        newPoints = el.points.map((p) => ({
                            x: p.x + dx,
                            y: p.y + dy,
                        }));
                    }

                    return {
                        ...el,
                        position: newPosition,
                        // Only update points if they changed
                        ...(newPoints !== el.points && { points: newPoints }),
                    };
                });

                // Return new state WITHOUT changing history during drag operations
                return {
                    ...prevState,
                    elements: updatedElements,
                };
            });
        },
        [setState]
    );

    const updateMultipleElements = useCallback(
        (updates: LogoElement[]) => {
            saveState((prevState) => ({
                elements: prevState.elements.map((element) => {
                    const update = updates.find((u) => u.id === element.id);
                    return update || element;
                }),
            }));
        },
        [saveState]
    );

    return {
        state,
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
    };
};
