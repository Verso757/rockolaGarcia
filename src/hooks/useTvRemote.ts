import { useEffect } from 'react';

interface UseTvRemoteOptions {
  onPlayPause: () => void;
  onNext: () => void;
  onToggleFullscreen?: () => void;
  onOpenSearch?: () => void;
}

/**
 * Handles physical TV remote control buttons (D-Pad, Media Keys, Enter, Back)
 * Compatible with Samsung Tizen, LG webOS, Android TV / Google TV, Fire TV, Roku browsers.
 */
export function useTvRemote({
  onPlayPause,
  onNext,
  onToggleFullscreen,
  onOpenSearch,
}: UseTvRemoteOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting when user is typing inside an input field
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      switch (e.key) {
        // Physical TV Remote Media Keys
        case 'MediaPlayPause':
        case 'MediaPlay':
        case 'MediaPause':
        case 'k':
        case 'K':
          e.preventDefault();
          onPlayPause();
          break;

        case 'MediaTrackNext':
        case 'n':
        case 'N':
          e.preventDefault();
          onNext();
          break;

        case 'f':
        case 'F':
          if (onToggleFullscreen) {
            e.preventDefault();
            onToggleFullscreen();
          }
          break;

        case 's':
        case 'S':
        case '/':
          if (onOpenSearch) {
            e.preventDefault();
            onOpenSearch();
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayPause, onNext, onToggleFullscreen, onOpenSearch]);
}
