import { useState, useEffect, useCallback } from 'react';

interface AndroidAutoState {
  isAndroidAuto: boolean;
  isCarPlay: boolean;
  isDrivingMode: boolean;
  screenType: 'normal' | 'automotive' | 'compact';
}

/**
 * Hook to detect and respond to automotive environments (Android Auto, CarPlay)
 * Also provides driving mode optimizations
 */
export function useAndroidAuto(): AndroidAutoState & {
  enableAutomotiveMode: () => void;
  disableAutomotiveMode: () => void;
} {
  const [state, setState] = useState<AndroidAutoState>({
    isAndroidAuto: false,
    isCarPlay: false,
    isDrivingMode: false,
    screenType: 'normal',
  });

  // Detect automotive environment
  useEffect(() => {
    const detectAutomotiveMode = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const searchParams = new URLSearchParams(window.location.search);
      
      // Check for Android Auto indicators
      const isAndroidAuto = 
        userAgent.includes('android auto') ||
        searchParams.get('android_auto') === 'true' ||
        window.matchMedia('(display-mode: automotive)').matches;

      // Check for CarPlay indicators
      const isCarPlay = 
        userAgent.includes('carplay') ||
        searchParams.get('carplay') === 'true';

      // Check for driving mode (can be triggered by user or system)
      const isDrivingMode = 
        localStorage.getItem('scene_driving_mode') === 'true' ||
        searchParams.get('driving_mode') === 'true';

      // Determine optimal screen type
      let screenType: AndroidAutoState['screenType'] = 'normal';
      if (isAndroidAuto || isCarPlay) {
        screenType = 'automotive';
      } else if (isDrivingMode || window.innerWidth < 600) {
        screenType = 'compact';
      }

      setState({
        isAndroidAuto,
        isCarPlay,
        isDrivingMode,
        screenType,
      });
    };

    detectAutomotiveMode();

    // Listen for changes
    window.addEventListener('resize', detectAutomotiveMode);
    
    // Listen for storage changes (for driving mode toggle)
    window.addEventListener('storage', detectAutomotiveMode);

    return () => {
      window.removeEventListener('resize', detectAutomotiveMode);
      window.removeEventListener('storage', detectAutomotiveMode);
    };
  }, []);

  const enableAutomotiveMode = useCallback(() => {
    localStorage.setItem('scene_driving_mode', 'true');
    setState(prev => ({
      ...prev,
      isDrivingMode: true,
      screenType: prev.isAndroidAuto || prev.isCarPlay ? 'automotive' : 'compact',
    }));
  }, []);

  const disableAutomotiveMode = useCallback(() => {
    localStorage.removeItem('scene_driving_mode');
    setState(prev => ({
      ...prev,
      isDrivingMode: false,
      screenType: 'normal',
    }));
  }, []);

  return {
    ...state,
    enableAutomotiveMode,
    disableAutomotiveMode,
  };
}

export default useAndroidAuto;
