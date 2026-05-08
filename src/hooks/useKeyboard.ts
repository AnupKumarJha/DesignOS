import { useEffect } from 'react';
import { useStore } from '../store/useStore';

import { useStore as useZustandStore } from 'zustand';

export const useKeyboard = () => {
  const { activeTool, setActiveTool, selection, removeWall, removeFurniture, removeOpening } = useStore();
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
  }, [selection, removeWall, removeFurniture, removeOpening, undo, redo, setActiveTool]);
};
