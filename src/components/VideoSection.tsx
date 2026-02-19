import React, { useRef, useState, useCallback } from 'react';
import { useHandDetection } from '../hooks/useHandDetection';
import { useSounds } from '../hooks/useSounds';
import { useGameStorage } from '../hooks/useGameStorage';
import { RetroButton } from '../app/components/RetroButton';

interface VideoSectionProps {
  recommendations?: any[];
  unlockedVideos?: any[];
  onScoreChange?: (score: number) => void;
  onLevelComplete?: (levelName: string) => void;
}

type GameLevel = 'menu' | 'number' | 'count' | 'subtraction';

interface PerformanceMetrics {
  level: GameLevel;
  score: number;
  attempts: number;
  correctAttempts: number;
  accuracy: number;
  avgDetectionTime: number;
}

export const VideoSection: React.FC<VideoSectionProps> = ({ onScoreChange, onLevelComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level, setLevel] = useState<GameLevel>('menu');
  const [score, setScore] = useState(0);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [attempts, setAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  
  // Subtraction mode
  const [num1, setNum1] = useState(5);
  const [num2, setNum2] = useState(2);
  const [subtractionScore, setSubtractionScore] = useState(0);
  
  // Visual feedback for counting level
  const [showCorrectFeedback, setShowCorrectFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | null>(null);
  
  const { result, switchMode } = useHandDetection(videoRef, canvasRef);
  const { playSound } = useSounds();
  const { progress, loaded, updateLevelScore, completeLevel } = useGameStorage();
  const detectionTimeRef = useRef<number>(Date.now());
  const lastDetectedRef = useRef<number | null>(null);

  // Load saved scores on mount
  React.useEffect(() => {
    if (loaded) {
      setScore(progress.levelScores.number);
      setSubtractionScore(progress.levelScores.subtraction);
    }
  }, [loaded, progress.levelScores]);

  const startLevel = (newLevel: GameLevel) => {
    setLevel(newLevel);
    switchMode(newLevel === 'menu' ? 'count' : newLevel);
    
    if (newLevel === 'number') {
      setCurrentNumber(1);
      setScore(0);
      setAttempts(0);
      setCorrectAttempts(0);
    } else if (newLevel === 'count') {
      setScore(0);
      setAttempts(0);
      setCorrectAttempts(0);
    } else if (newLevel === 'subtraction') {
      setSubtractionScore(0);
      setAttempts(0);
      setCorrectAttempts(0);
      generateSubtractionProblem();
    }
    
    detectionTimeRef.current = Date.now();
    lastDetectedRef.current = null;
  };

  const proceedToNextLevel = () => {
    if (level === 'number') {
      updateLevelScore('number', score);
      completeLevel('number');
      setTimeout(() => {
        startLevel('count');
      }, 500);
    } else if (level === 'count') {
      updateLevelScore('count', score);
      completeLevel('count');
      setTimeout(() => {
        startLevel('subtraction');
      }, 500);
    } else if (level === 'subtraction') {
      updateLevelScore('subtraction', subtractionScore);
      completeLevel('subtraction');
      setTimeout(() => {
        startLevel('menu');
      }, 500);
    }
  };

  const generateSubtractionProblem = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * a);
    setNum1(a);
    setNum2(b);
  };

  // **LEVEL 1: Number Detection (1-10)**
  React.useEffect(() => {
    if (level === 'number' && result.detectedNumber !== null && result.status.includes('Detected')) {
      if (lastDetectedRef.current === result.detectedNumber) return; // Avoid duplicate
      lastDetectedRef.current = result.detectedNumber;

      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (result.detectedNumber === currentNumber) {
        const newScore = score + 1;
        const newCorrect = correctAttempts + 1;
        setScore(newScore);
        setCorrectAttempts(newCorrect);
        
        if (onScoreChange) {
          onScoreChange(newScore);
        }

        // Advance to next number
        if (currentNumber < 10) {
          setTimeout(() => {
            setCurrentNumber(currentNumber + 1);
            lastDetectedRef.current = null;
          }, 1200);
        } else {
          // Complete level
          setTimeout(() => {
            const accuracy = ((newCorrect / newAttempts) * 100).toFixed(1);
            if (onLevelComplete) onLevelComplete('number');
            alert(`🎉 Level 1 Complete!\nFinal Score: ${newScore}/10\nAccuracy: ${accuracy}%`);
            proceedToNextLevel();
          }, 1500);
        }
      }
    }
  }, [result.detectedNumber, result.status, level, currentNumber, score, attempts, correctAttempts, onScoreChange]);

  // **LEVEL 2: Counting (Fingers)**
  React.useEffect(() => {
    if (level === 'count' && result.fingerCount === 3) {
      if (lastDetectedRef.current === 3) return;
      lastDetectedRef.current = 3;

      const newScore = score + 1;
      const newAttempts = attempts + 1;
      const newCorrect = correctAttempts + 1;
      
      // Play correct sound immediately
      playSound('correct');
      
      // Show visual feedback
      setFeedbackMessage('✨ CORRECT! ✨');
      setFeedbackType('correct');
      setShowCorrectFeedback(true);
      
      setScore(newScore);
      setAttempts(newAttempts);
      setCorrectAttempts(newCorrect);
      
      if (onScoreChange) {
        onScoreChange(newScore);
      }

      // Hide feedback after 1 second
      const feedbackTimer = setTimeout(() => {
        setShowCorrectFeedback(false);
      }, 1000);

      if (newScore >= 5) {
        const accuracy = ((newCorrect / newAttempts) * 100).toFixed(1);
        playSound('level_complete');
        setTimeout(() => {
          alert(`✅ Level 2 Complete!\nScore: ${newScore}\nAccuracy: ${accuracy}%`);
          if (onLevelComplete) onLevelComplete('count');
          proceedToNextLevel();
        }, 500);
      } else {
        setTimeout(() => {
          lastDetectedRef.current = null;
        }, 1200);
      }
      
      return () => clearTimeout(feedbackTimer);
    }
  }, [result.fingerCount, level, score, attempts, correctAttempts, onScoreChange, playSound]);
      
      setScore(newScore);
      setAttempts(newAttempts);
      setCorrectAttempts(newCorrect);
      
      if (onScoreChange) {
        onScoreChange(newScore);
      }

      // Hide feedback after 1 second
      const feedbackTimer = setTimeout(() => {
        setShowCorrectFeedback(false);
      }, 1000);

      if (newScore >= 5) {
        const accuracy = ((newCorrect / newAttempts) * 100).toFixed(1);
        playSound('level_complete');
        setTimeout(() => {
          if (onLevelComplete) onLevelComplete('count');
          alert(`✅ Level 2 Complete!\nScore: ${newScore}\nAccuracy: ${accuracy}%`);
          setLevel('menu');
        }, 500);
      } else {
        setTimeout(() => {
          lastDetectedRef.current = null;
        }, 1200);
      }
      
      return () => clearTimeout(feedbackTimer);
    }
  }, [result.fingerCount, result.status, level, score, attempts, correctAttempts, onScoreChange, playSound]);

  // **LEVEL 3: Subtraction (Accept both FINGERS and DRAWN numbers)**
  React.useEffect(() => {
    if (level !== 'subtraction') return;
    
    const expectedAnswer = num1 - num2;
    let detectedAnswer: number | null = null;
    let detectionMethod = '';

    // Method 1: Check drawn number
    if (result.detectedNumber !== null && result.status.includes('Detected')) {
      detectedAnswer = result.detectedNumber;
      detectionMethod = 'drawn';
    }
    // Method 2: Check finger count
    else if (result.fingerCount > 0 && result.status === 'Correct' && result.fingerCount !== 3) {
      detectedAnswer = result.fingerCount;
      detectionMethod = 'fingers';
    }

    if (detectedAnswer === null) return;

    if (lastDetectedRef.current === detectedAnswer) return;
    lastDetectedRef.current = detectedAnswer;

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (detectedAnswer === expectedAnswer) {
      playSound('correct');
      setFeedbackMessage(`✅ CORRECT! (${detectionMethod})`);
      setFeedbackType('correct');
      setShowCorrectFeedback(true);

      const newScore = subtractionScore + 1;
      const newCorrect = correctAttempts + 1;
      setSubtractionScore(newScore);
      setCorrectAttempts(newCorrect);

      setTimeout(() => setShowCorrectFeedback(false), 1500);

      if (newScore >= 5) {
        const accuracy = ((newCorrect / newAttempts) * 100).toFixed(1);
        playSound('level_complete');
        setTimeout(() => {
          alert(`🏆 Level 3 Complete!\nScore: ${newScore}\nAccuracy: ${accuracy}%`);
          if (onLevelComplete) onLevelComplete('subtraction');
          proceedToNextLevel();
        }, 500);
      } else {
        setTimeout(() => {
          generateSubtractionProblem();
          lastDetectedRef.current = null;
        }, 1500);
      }
    } else {
      playSound('incorrect');
      setFeedbackMessage(`❌ Wrong! Answer is ${expectedAnswer}`);
      setFeedbackType('incorrect');
      setShowCorrectFeedback(true);
      setTimeout(() => setShowCorrectFeedback(false), 1500);
      setTimeout(() => {
        lastDetectedRef.current = null;
      }, 1500);
    }
  }, [result.detectedNumber, result.fingerCount, result.status, level, num1, num2, attempts, correctAttempts, subtractionScore, playSound]);

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden">
      <div className="w-full max-w-4xl mx-auto">
        {/* Webcam only - clean background */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            className="w-full block"
            width="640"
            height="480"
            autoPlay
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
            width="640"
            height="480"
          />

          {/* MENU MODE */}
          {level === 'menu' && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center space-y-6">
              <p className="text-4xl font-bold text-pixel-green">🎮 LEARNING QUEST</p>
              <p className="text-xl text-white">Choose Your Level:</p>
              <div className="space-y-4">
                <RetroButton onClick={() => startLevel('number')} className="w-64">
                  📝 Level 1: Number Detection
                </RetroButton>
                <RetroButton onClick={() => startLevel('count')} className="w-64">
                  ✋ Level 2: Counting
                </RetroButton>
                <RetroButton onClick={() => startLevel('subtraction')} className="w-64">
                  🧮 Level 3: Subtraction
                </RetroButton>
              </div>
            </div>
          )}

          {/* Status Display - Overlay on video */}
          {level !== 'menu' && (
            <div className="absolute inset-0 flex flex-col items-center justify-between p-6">
              {/* Top - Instructions */}
              <div className="text-center text-white">
                {level === 'number' && (
                  <>
                    <p className="text-3xl font-bold text-pixel-green mb-2">Level 1: Number Detection</p>
                    <p className="text-2xl font-bold text-pixel-yellow">Draw Number: {currentNumber}</p>
                  </>
                )}
                {level === 'count' && (
                  <>
                    <p className="text-3xl font-bold text-pixel-green mb-2">Level 2: Counting</p>
                    <p className="text-2xl font-bold text-pixel-yellow mb-4">Show 3 Fingers ✋</p>
                    <div className="bg-pixel-green bg-opacity-20 border-2 border-pixel-green rounded px-4 py-2 inline-block">
                      <p className="text-lg text-pixel-green font-bold">Current Fingers: {result.fingerCount}</p>
                    </div>
                  </>
                )}
                {level === 'subtraction' && (
                  <>
                    <p className="text-3xl font-bold text-pixel-green mb-2">Level 3: Subtraction</p>
                    <p className="text-4xl font-bold text-pixel-yellow mb-2">{num1} - {num2} = ?</p>
                  </>
                )}
                {!result.isHandDetected && (
                  <p className="text-lg text-pixel-red animate-pulse">🚨 Hand not detected - Move closer</p>
                )}
              </div>

              {/* Center - Status & Feedback */}
              <div className="text-center text-white">
                <p className="text-lg text-pixel-white mb-6">{result.status}</p>
                
                {/* Correct/Incorrect Feedback */}
                {showCorrectFeedback && feedbackType === 'correct' && (
                  <div className="animate-pulse">
                    <p className="text-5xl font-bold text-pixel-green drop-shadow-lg" style={{
                      animation: 'bounce 0.6s ease-in-out'
                    }}>
                      {feedbackMessage}
                    </p>
                  </div>
                )}
                {showCorrectFeedback && feedbackType === 'incorrect' && (
                  <p className="text-4xl font-bold text-pixel-red drop-shadow-lg">
                    {feedbackMessage}
                  </p>
                )}
              </div>

              {/* Bottom - Score & Controls */}
              <div className="flex flex-col items-center space-y-4">
                <div className="text-2xl font-bold text-pixel-green">
                  Score: {level === 'subtraction' ? subtractionScore : score}
                </div>
                <div className="text-lg text-pixel-white">
                  Attempts: {attempts} | Correct: {correctAttempts} | Accuracy: {attempts > 0 ? ((correctAttempts / attempts) * 100).toFixed(0) : 0}%
                </div>
                <RetroButton onClick={() => setLevel('menu')}>← Back to Menu</RetroButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};