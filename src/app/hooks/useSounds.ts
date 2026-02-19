import { useRef, useCallback, useEffect } from 'react';

export type SoundType = 'success' | 'fail' | 'levelUp' | 'coin' | 'power';

interface UseSoundsReturn {
  playSound: (type: SoundType) => void;
  startBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
  setMusicVolume: (volume: number) => void;
}

// Retro 8-bit sound effects using Web Audio API
export function useSounds(): UseSoundsReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const backgroundMusicRef = useRef<{
    oscillators: OscillatorNode[];
    gainNode: GainNode;
    isPlaying: boolean;
  } | null>(null);

  // Initialize audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Create calm background music loop
  const startBackgroundMusic = useCallback(() => {
    if (backgroundMusicRef.current?.isPlaying) return;

    const ctx = getAudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.15, ctx.currentTime); // Low volume for background
    masterGain.connect(ctx.destination);

    // Calm melody progression (C major pentatonic scale)
    const melody = [
      { note: 523.25, duration: 1.5 },   // C5
      { note: 587.33, duration: 1.5 },   // D5
      { note: 659.25, duration: 1.5 },   // E5
      { note: 783.99, duration: 1.5 },   // G5
      { note: 659.25, duration: 1.5 },   // E5
      { note: 587.33, duration: 1.5 },   // D5
      { note: 523.25, duration: 3 },     // C5 (longer)
      { note: 392.00, duration: 1.5 },   // G4
      { note: 440.00, duration: 1.5 },   // A4
      { note: 523.25, duration: 3 },     // C5 (longer)
    ];

    const playMelody = () => {
      let currentTime = ctx.currentTime;
      const oscillators: OscillatorNode[] = [];

      melody.forEach(({ note, duration }) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.type = 'sine'; // Soft sine wave for calm music
        osc.frequency.setValueAtTime(note, currentTime);
        
        // Smooth envelope
        oscGain.gain.setValueAtTime(0, currentTime);
        oscGain.gain.linearRampToValueAtTime(0.3, currentTime + 0.1);
        oscGain.gain.setValueAtTime(0.3, currentTime + duration - 0.2);
        oscGain.gain.linearRampToValueAtTime(0, currentTime + duration);
        
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        
        osc.start(currentTime);
        osc.stop(currentTime + duration);
        
        oscillators.push(osc);
        currentTime += duration;
      });

      // Loop the music
      const totalDuration = melody.reduce((sum, { duration }) => sum + duration, 0);
      setTimeout(() => {
        if (backgroundMusicRef.current?.isPlaying) {
          playMelody();
        }
      }, totalDuration * 1000);
    };

    backgroundMusicRef.current = {
      oscillators: [],
      gainNode: masterGain,
      isPlaying: true,
    };

    playMelody();
  }, [getAudioContext]);

  const stopBackgroundMusic = useCallback(() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.isPlaying = false;
      backgroundMusicRef.current.gainNode.disconnect();
      backgroundMusicRef.current = null;
    }
  }, []);

  const setMusicVolume = useCallback((volume: number) => {
    if (backgroundMusicRef.current) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      backgroundMusicRef.current.gainNode.gain.setValueAtTime(
        clampedVolume * 0.15,
        audioContextRef.current?.currentTime || 0
      );
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBackgroundMusic();
    };
  }, [stopBackgroundMusic]);

  // Create oscillator-based retro sounds
  const playSound = useCallback((type: SoundType) => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    switch (type) {
      case 'success':
        // Ascending arpeggio
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(523.25, now); // C5
        oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
        break;

      case 'fail':
        // Descending buzz
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;

      case 'levelUp':
        // Power-up melody
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(392, now); // G4
        oscillator.frequency.setValueAtTime(523.25, now + 0.15); // C5
        oscillator.frequency.setValueAtTime(659.25, now + 0.3); // E5
        oscillator.frequency.setValueAtTime(783.99, now + 0.45); // G5
        oscillator.frequency.setValueAtTime(1046.5, now + 0.6); // C6
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.setValueAtTime(0.4, now + 0.6);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
        oscillator.start(now);
        oscillator.stop(now + 0.9);
        break;

      case 'coin':
        // Quick blip
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(988, now); // B5
        oscillator.frequency.setValueAtTime(1319, now + 0.05); // E6
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
        break;

      case 'power':
        // Power on sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(100, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
    }
  }, [getAudioContext]);

  return { playSound, startBackgroundMusic, stopBackgroundMusic, setMusicVolume };
}