// Accessibility utilities and components

// Hook for managing focus trap in modals and overlays
import { useEffect, useRef, useCallback } from 'react';

export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Let parent component handle escape
        const escapeEvent = new CustomEvent('modal-escape');
        container.dispatchEvent(escapeEvent);
      }
    };

    // Focus first element when trap activates
    firstElement?.focus();

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive]);

  return containerRef;
};

// Hook for managing keyboard navigation in lists
export const useKeyboardNavigation = (itemCount: number, onSelect: (index: number) => void) => {
  const currentIndex = useRef(-1);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        currentIndex.current = Math.min(currentIndex.current + 1, itemCount - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        currentIndex.current = Math.max(currentIndex.current - 1, -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (currentIndex.current >= 0) {
          onSelect(currentIndex.current);
        }
        break;
      case 'Escape':
        currentIndex.current = -1;
        break;
    }
  }, [itemCount, onSelect]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return currentIndex.current;
};

// Screen reader announcements
export const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// ARIA labels for common elements
export const ariaLabels = {
  search: 'Cari layanan kesehatan',
  menu: 'Menu navigasi utama',
  closeButton: 'Tutup',
  backButton: 'Kembali',
  homeButton: 'Kembali ke beranda',
  submitButton: 'Kirim formulir',
  loading: 'Sedang memuat',
  error: 'Terjadi kesalahan',
  success: 'Berhasil',
  required: 'Field wajib diisi',
  optional: 'Field opsional',
} as const;

// Focus indicator styles for better visibility
export const focusStyles = 'focus:outline-none focus:ring-2 focus:ring-[#228BE6] focus:ring-offset-2';

// Utility to check if user prefers reduced motion
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
