import { useState, useEffect, useCallback } from 'react';

export interface GameProgress {
  currentLevel: number;
  levelScores: {
    number: number;
    count: number;
    subtraction: number;
  };
  completedLevels: string[];
  totalScore: number;
  lastUpdated: number;
}

const DEFAULT_PROGRESS: GameProgress = {
  currentLevel: 1,
  levelScores: {
    number: 0,
    count: 0,
    subtraction: 0,
  },
  completedLevels: [],
  totalScore: 0,
  lastUpdated: Date.now(),
};

export const useGameStorage = () => {
  const [progress, setProgress] = useState<GameProgress>(DEFAULT_PROGRESS);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gameProgress');
      if (saved) {
        setProgress(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load game progress:', error);
      setProgress(DEFAULT_PROGRESS);
    }
    setLoaded(true);
  }, []);

  // Save to localStorage whenever progress changes
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem('gameProgress', JSON.stringify(progress));
      } catch (error) {
        console.warn('Failed to save game progress:', error);
      }
    }
  }, [progress, loaded]);

  const updateLevelScore = useCallback((levelName: 'number' | 'count' | 'subtraction', score: number) => {
    setProgress((prev) => ({
      ...prev,
      levelScores: {
        ...prev.levelScores,
        [levelName]: score,
      },
      totalScore: prev.levelScores.number + prev.levelScores.count + prev.levelScores.subtraction + score - prev.levelScores[levelName],
      lastUpdated: Date.now(),
    }));
  }, []);

  const completeLevel = useCallback((levelName: string) => {
    setProgress((prev) => {
      if (prev.completedLevels.includes(levelName)) {
        return prev; // Already completed
      }

      const newCompleted = [...prev.completedLevels, levelName];
      const nextLevel = Math.min(prev.currentLevel + 1, 3); // Max 3 levels

      return {
        ...prev,
        completedLevels: newCompleted,
        currentLevel: nextLevel,
        lastUpdated: Date.now(),
      };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    localStorage.removeItem('gameProgress');
  }, []);

  const getCanAccessLevel = useCallback((level: number): boolean => {
    return level <= progress.currentLevel;
  }, [progress.currentLevel]);

  return {
    progress,
    loaded,
    updateLevelScore,
    completeLevel,
    resetProgress,
    getCanAccessLevel,
  };
};
