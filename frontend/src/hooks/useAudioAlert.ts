import { useEffect, useRef, useState, useCallback } from 'react';

export type AlertLevel = 'WATCH' | 'WARNING' | 'SEVERE';

export const useAudioAlert = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const sirenIntervalRef = useRef<any>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('chakravyuh_audio_muted') === 'true';
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  const initAudio = useCallback(() => {
    if (!audioContext.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioContext.current = new AudioCtx();
      }
    }
    if (audioContext.current && audioContext.current.state === 'suspended') {
      audioContext.current.resume();
    }
    setHasPermission(true);
  }, []);

  useEffect(() => {
    const handleFirstClick = () => {
      initAudio();
      window.removeEventListener('click', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);
    return () => {
      window.removeEventListener('click', handleFirstClick);
      stopSound();
    };
  }, [initAudio]);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem('chakravyuh_audio_muted', String(next));
      if (next) stopSound();
      return next;
    });
  };

  const playTone = (freq: number, durationSec: number, type: OscillatorType = 'sine', volume: number = 0.2) => {
    if (isMuted || !audioContext.current) return;
    try {
      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }
      const osc = audioContext.current.createOscillator();
      const gain = audioContext.current.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioContext.current.currentTime);

      gain.gain.setValueAtTime(volume, audioContext.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.current.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(audioContext.current.destination);

      osc.start();
      osc.stop(audioContext.current.currentTime + durationSec);
    } catch (e) {
      console.warn('Audio play tone error:', e);
    }
  };

  const stopSound = () => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
    setIsPlaying(false);
  };

  const triggerAlert = (level: AlertLevel | 'MODERATE' | 'HIGH' | 'CRITICAL') => {
    if (isMuted) return;
    initAudio();
    stopSound();

    const normalized = (level === 'CRITICAL' ? 'SEVERE' : (level === 'HIGH' ? 'WARNING' : (level === 'MODERATE' ? 'WATCH' : level))) as AlertLevel;

    setIsPlaying(true);

    if (normalized === 'WATCH') {
      // Single Beep (520 Hz, 0.4s)
      playTone(520, 0.4, 'sine', 0.25);
      setTimeout(() => setIsPlaying(false), 500);
    } else if (normalized === 'WARNING') {
      // Beep — Beep — Beep (680 Hz pulses)
      playTone(680, 0.25, 'triangle', 0.3);
      setTimeout(() => playTone(680, 0.25, 'triangle', 0.3), 350);
      setTimeout(() => playTone(680, 0.25, 'triangle', 0.3), 700);
      setTimeout(() => setIsPlaying(false), 1100);
    } else if (normalized === 'SEVERE') {
      // Continuous urgent siren: BEEP BEEP BEEP (pause) BEEP BEEP BEEP
      const playSirenBurst = () => {
        if (isMuted) return;
        // Dual-tone rapid alarm
        playTone(850, 0.18, 'sawtooth', 0.25);
        setTimeout(() => playTone(950, 0.18, 'sawtooth', 0.25), 200);
        setTimeout(() => playTone(850, 0.18, 'sawtooth', 0.25), 400);
        setTimeout(() => playTone(950, 0.22, 'sawtooth', 0.25), 600);
      };

      playSirenBurst();
      sirenIntervalRef.current = setInterval(playSirenBurst, 1400);
    }
  };

  return {
    triggerAlert,
    playAlertSound: triggerAlert,
    stopSound,
    isPlaying,
    isMuted,
    toggleMute,
    hasPermission,
    requestAudioPermission: initAudio
  };
};
