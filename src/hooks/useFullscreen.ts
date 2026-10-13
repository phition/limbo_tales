import { useState, useEffect, useCallback } from 'react';
import { isFullscreen, toggleFullscreen, enterFullscreen, exitFullscreen } from '../utils/fullscreen';

export function useFullscreen() {
  const [fullscreen, setFullscreen] = useState<boolean>(() => isFullscreen());

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(isFullscreen());
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggle = useCallback(() => {
    return toggleFullscreen();
  }, []);

  const enter = useCallback(() => {
    return enterFullscreen();
  }, []);

  const exit = useCallback(() => {
    return exitFullscreen();
  }, []);

  return { isFullscreen: fullscreen, toggle, enter, exit };
}
