import { useCallback } from 'react';

type SoundType = 'correct' | 'incorrect' | 'level_complete' | 'beep';

export const useSounds = () => {
  const playSound = useCallback((soundType: SoundType) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;

      switch (soundType) {
        case 'correct':
          // Success sound - rising notes
          for (let i = 0; i < 3; i++) {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.value = 400 + (i * 200);
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0.3, now + (i * 0.1));
            gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.1) + 0.2);
            
            osc.start(now + (i * 0.1));
            osc.stop(now + (i * 0.1) + 0.2);
          }
          break;

        case 'incorrect':
          // Error sound - low buzzer
          const oscErr = audioContext.createOscillator();
          const gainErr = audioContext.createGain();
          
          oscErr.connect(gainErr);
          gainErr.connect(audioContext.destination);
          
          oscErr.frequency.value = 200;
          oscErr.type = 'square';
          
          gainErr.gain.setValueAtTime(0.2, now);
          gainErr.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          
          oscErr.start(now);
          oscErr.stop(now + 0.3);
          break;

        case 'level_complete':
          // Victory fanfare - three ascending notes
          const freqs = [523.25, 659.25, 783.99]; // C, E, G
          for (let i = 0; i < freqs.length; i++) {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.value = freqs[i];
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0.3, now + (i * 0.15));
            gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.15) + 0.4);
            
            osc.start(now + (i * 0.15));
            osc.stop(now + (i * 0.15) + 0.4);
          }
          break;

        case 'beep':
          // Simple beep
          const oscBeep = audioContext.createOscillator();
          const gainBeep = audioContext.createGain();
          
          oscBeep.connect(gainBeep);
          gainBeep.connect(audioContext.destination);
          
          oscBeep.frequency.value = 800;
          oscBeep.type = 'sine';
          
          gainBeep.gain.setValueAtTime(0.2, now);
          gainBeep.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          
          oscBeep.start(now);
          oscBeep.stop(now + 0.1);
          break;
      }
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }, []);

  return { playSound };
};
