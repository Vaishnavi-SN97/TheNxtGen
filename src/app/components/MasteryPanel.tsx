import { PixelPanel } from './PixelPanel';
import { PixelProgressBar } from './PixelProgressBar';
import { Star, Trophy, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MasteryPanelProps {
  score: number;
  level: number;
  currentTopic: string;
  masteryProgress: number;
  lastCompletedLevel?: string;
}

export function MasteryPanel({ score, level, currentTopic, masteryProgress, lastCompletedLevel }: MasteryPanelProps) {
  const levelProgress = (score % 100);
  const nextLevelScore = (level + 1) * 100;
  const [countingQuestion, setCountingQuestion] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  // Generate counting questions
  useEffect(() => {
    const generateQuestion = () => {
      setCountingQuestion(Math.floor(Math.random() * 10) + 1);
    };
    generateQuestion();
  }, []);

  // Show completion progress when user completes a level
  useEffect(() => {
    if (lastCompletedLevel) {
      setShowCompletion(true);
      const timer = setTimeout(() => {
        setShowCompletion(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastCompletedLevel]);

  return (
    <PixelPanel variant="primary" className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h2 
            className="text-lg text-purple-800"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            PLAYER STATS
          </h2>
        </div>
      </div>

      {/* Score Display */}
      <div className="bg-white rounded-lg border-4 border-purple-400 p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Star className="w-5 h-5 text-yellow-500 animate-pulse" />
          <span 
            className="text-sm text-gray-600"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            SCORE
          </span>
        </div>
        <div 
          className="text-4xl font-bold text-purple-600"
          style={{ fontFamily: "'Press Start 2P', cursive" }}
        >
          {score}
        </div>
      </div>

      {/* Level Display */}
      <div className="bg-gradient-to-br from-purple-200 to-pink-200 rounded-lg border-4 border-purple-400 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span 
              className="text-xs text-purple-800"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              LEVEL {level}
            </span>
          </div>
          <span 
            className="text-xs text-purple-600"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            {nextLevelScore - score} TO NEXT
          </span>
        </div>
        <PixelProgressBar 
          value={levelProgress} 
          max={100}
          color="purple"
          animated
        />
      </div>

      {/* Current Topic */}
      <div className="bg-blue-50 rounded-lg border-4 border-blue-300 p-3">
        <p 
          className="text-xs text-gray-600 mb-2"
          style={{ fontFamily: "'Press Start 2P', cursive" }}
        >
          LEARNING:
        </p>
        <p 
          className="text-sm text-blue-700 font-bold"
          style={{ fontFamily: "'Press Start 2P', cursive" }}
        >
          {currentTopic}
        </p>
      </div>

      {/* Counting Question */}
      <div className="bg-yellow-50 rounded-lg border-4 border-yellow-400 p-4">
        <p 
          className="text-xs text-yellow-700 mb-3 text-center"
          style={{ fontFamily: "'Press Start 2P', cursive" }}
        >
          HOW MANY?
        </p>
        <div className="flex items-center justify-center gap-3">
          {Array.from({ length: countingQuestion }).map((_, i) => (
            <span key={i} className="text-3xl">⭐</span>
          ))}
        </div>
        <p 
          className="text-xl font-bold text-yellow-700 text-center mt-3"
          style={{ fontFamily: "'Press Start 2P', cursive" }}
        >
          {countingQuestion}
        </p>
      </div>

      {/* Completion Progress - Only shows after level completion */}
      {showCompletion && (
        <div className="animate-pulse">
          <div className="bg-green-100 rounded-lg border-4 border-green-400 p-4">
            <p 
              className="text-xs text-green-600 mb-3 text-center"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              LEVEL COMPLETED!
            </p>
            <PixelProgressBar 
              value={masteryProgress} 
              max={100}
              label="MASTERY"
              color="green"
              showValue
            />
          </div>

          {/* Encouraging Messages */}
          <div className="space-y-2 mt-3">
            {masteryProgress > 75 && (
              <div className="bg-green-100 border-2 border-green-400 rounded px-3 py-2 text-center">
                <p 
                  className="text-xs text-green-700"
                  style={{ fontFamily: "'Press Start 2P', cursive" }}
                >
                  ⭐ AMAZING! ⭐
                </p>
              </div>
            )}
            {masteryProgress > 50 && masteryProgress <= 75 && (
              <div className="bg-blue-100 border-2 border-blue-400 rounded px-3 py-2 text-center">
                <p 
                  className="text-xs text-blue-700"
                  style={{ fontFamily: "'Press Start 2P', cursive" }}
                >
                  GREAT JOB!
                </p>
              </div>
            )}
            {masteryProgress <= 50 && (
              <div className="bg-yellow-100 border-2 border-yellow-400 rounded px-3 py-2 text-center">
                <p 
                  className="text-xs text-yellow-700"
                  style={{ fontFamily: "'Press Start 2P', cursive" }}
                >
                  KEEP GOING!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </PixelPanel>
  );
}