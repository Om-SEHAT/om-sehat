import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    closeCurrentDialog?: () => void;
  }
}

/**
 * A hook that traps focus within a container.
 * Useful for modals, dialogs, and other UI elements that need to trap focus.
 */
function useFocusTrap(active: boolean = true) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Find all focusable elements
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Set initial focus
    firstElement.focus();

    // Handle keydown events
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Tab key
      if (e.key === 'Tab') {
        // Shift + Tab - move backwards
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } 
        // Tab - move forwards
        else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }

      // Check for Escape key
      if (e.key === 'Escape' && typeof window.closeCurrentDialog === 'function') {
        window.closeCurrentDialog();
      }
    };

    // Add event listeners
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [active]);

  return containerRef;
}

export default useFocusTrap;
