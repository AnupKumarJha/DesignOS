import { useEffect } from 'react';
import { useStore } from '../store/useStore';

import { useStore as useZustandStore } from 'zustand';

export const useKeyboard = () => {
  const { setActiveTool, selection, furniture, updateFurniture, addFurniture, removeWall, removeFurniture, removeOpening } = useStore();
  const { undo, redo } = useZustandStore(useStore.temporal, (state: any) => state);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement) return;

      // Delete selection
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection) {
          if (selection.type === 'wall') removeWall(selection.id);
          else if (selection.type === 'furniture') removeFurniture(selection.id);
          else if (selection.type === 'opening') removeOpening(selection.id);
        }
      }

      if (selection?.type === 'furniture') {
        const item = furniture.find((entry) => entry.id === selection.id);
        if (item && e.key === ' ') {
          e.preventDefault();
          updateFurniture(item.id, { rotation: (item.rotation + 90) % 360 });
        }
        if (item && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          addFurniture({
            ...item,
            id: crypto.randomUUID(),
            position: { x: item.position.x + 150, y: item.position.y + 150 },
          });
        }
        if (item && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          const step = e.shiftKey ? 100 : 10;
          updateFurniture(item.id, {
            position: {
              x: item.position.x + (e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0),
              y: item.position.y + (e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0),
            }
          });
        }
      }

      // Cancel current tool
      if (e.key === 'Escape') {
        setActiveTool('SELECT');
        // Manual cleanup might be needed for drafting state in components
      }

      // Undo/Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          if (e.shiftKey) redo();
          else undo();
        }
        if (e.key === 'y') redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, furniture, removeWall, removeFurniture, removeOpening, undo, redo, setActiveTool, updateFurniture, addFurniture]);
};
