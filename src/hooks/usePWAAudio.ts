import { useEffect, useState } from 'react';

export const usePWAAudio = () => {
  const [isPWA, setIsPWA] = useState(false);
  const [audioSupported, setAudioSupported] = useState(true);

  useEffect(() => {
    // Detect if running as PWA
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSPWA = (window.navigator as any).standalone === true;
      const isAndroidPWA = window.matchMedia('(display-mode: standalone)').matches;
      
      return isStandalone || isIOSPWA || isAndroidPWA;
    };

    setIsPWA(checkPWA());

    // Check audio support in PWA
    const checkAudioSupport = () => {
      const audio = new Audio();
      const canPlayMP3 = audio.canPlayType('audio/mpeg') !== '';
      const canPlayOGG = audio.canPlayType('audio/ogg') !== '';
      const canPlayWAV = audio.canPlayType('audio/wav') !== '';
      
      return canPlayMP3 || canPlayOGG || canPlayWAV;
    };

    setAudioSupported(checkAudioSupport());

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      setIsPWA(checkPWA());
    };

    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const handlePWAAudioPlay = async (audioElement: HTMLAudioElement) => {
    // Simply call play() - PWA doesn't need special AudioContext handling for <audio> elements
    return audioElement.play();
  };

  return {
    isPWA,
    audioSupported,
    handlePWAAudioPlay
  };
};
