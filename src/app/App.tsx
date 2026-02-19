import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Volume2, VolumeX, Music, Brush, Hand } from 'lucide-react';
import { DrawingCanvas } from './components/DrawingCanvas';
import { MasteryPanel } from './components/MasteryPanel';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { VideoSection } from './components/VideoSection';
import { PixelCharacter } from './components/PixelCharacter';
import { useSounds } from './hooks/useSounds';
import { RetroButton } from './components/RetroButton';

// Types
interface KnowledgeNode {
  id: string;
  label: string;
  mastery: number;
  unlocked: boolean;
  x: number;
  y: number;
  dependencies: string[];
}

interface VideoRecommendation {
  id:string;
  title: string;
  thumbnail: string;
  videoId: string;
  topic: string;
}

type CharacterMood = 'happy' | 'neutral' | 'encouraging' | 'excited';
type GameMode = 'count' | 'draw';

const mathQuestions = [
    { question: 'What is 1 + 1?', answer: 2 },
    { question: 'What is 1 + 2?', answer: 3 },
    { question: 'What is 2 + 1?', answer: 3 },
    { question: 'What is 2 + 2?', answer: 4 },
    { question: 'What is 2 + 3?', answer: 5 },
    { question: 'What is 3 + 2?', answer: 5 },
    { question: 'What is 3 + 1?', answer: 4 },
    { question: 'What is 1 + 3?', answer: 4 },
    { question: 'What is 4 + 1?', answer: 5 },
    { question: 'What is 1 + 4?', answer: 5 },
    { question: 'What is 2 - 1?', answer: 1 },
    { question: 'What is 3 - 1?', answer: 2 },
    { question: 'What is 3 - 2?', answer: 1 },
    { question: 'What is 4 - 1?', answer: 3 },
    { question: 'What is 4 - 2?', answer: 2 },
    { question: 'What is 4 - 3?', answer: 1 },
    { question: 'What is 5 - 1?', answer: 4 },
    { question: 'What is 5 - 2?', answer: 3 },
    { question: 'What is 5 - 3?', answer: 2 },
    { question: 'What is 5 - 4?', answer: 1 },
];
const PRACTICE_THRESHOLD = 3;

export default function App() {
  // Game State
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [targetNumber, setTargetNumber] = useState(() => {
    const initialQuestion = mathQuestions[Math.floor(Math.random() * mathQuestions.length)];
    return initialQuestion.answer;
  });
  const [mode, setMode] = useState<GameMode>('count');
  const [masteryProgress, setMasteryProgress] = useState(0);

  const { playSound, startBackgroundMusic, stopBackgroundMusic } = useSounds();

  useEffect(() => {
    const savedScore = localStorage.getItem('score');
    if (savedScore) {
      setScore(parseInt(savedScore, 10));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('score', score.toString());
  }, [score]);

  useEffect(() => {
    if (musicEnabled) {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  }, [musicEnabled, startBackgroundMusic, stopBackgroundMusic]);

  const [characterMood, setCharacterMood] = useState<CharacterMood>('neutral');
  const [characterMessage, setCharacterMessage] = useState('Welcome! Select a mode to start.');

  const [currentPrompt, setCurrentPrompt] = useState(() => {
    const initialQuestion = mathQuestions.find(q => q.answer === targetNumber) || mathQuestions[0];
    return initialQuestion.question;
  });
  
  const [isPracticing, setIsPracticing] = useState(false);
  const [practicingNodeId, setPracticingNodeId] = useState<string | null>('counting');
  const [practiceProgress, setPracticeProgress] = useState(0);

  const [knowledgeNodes, setKnowledgeNodes] = useState<KnowledgeNode[]>([
    { id: 'counting', label: 'Counting', mastery: 0, unlocked: true, x: 30, y: 20, dependencies: [] },
    { id: 'addition', label: 'Addition', mastery: 0, unlocked: false, x: 50, y: 50, dependencies: ['counting'] },
    { id: 'subtraction', label: 'Subtraction', mastery: 0, unlocked: false, x: 70, y: 80, dependencies: ['addition'] },
  ]);

  const [videoRecommendations] = useState<VideoRecommendation[]>([
    { id: '1', title: 'Learn to Count 1-10', thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', videoId: 'dQw4w9WgXcQ', topic: 'Counting' },
    { id: '2', title: 'Addition for Kids', thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400', videoId: 'dQw4w9WgXcQ', topic: 'Addition' },
  ]);

  const unlockedVideos = Math.min(level, videoRecommendations.length);

  const generateNewQuestion = useCallback(() => {
    if (mode === 'count') {
      const { question, answer } = mathQuestions[Math.floor(Math.random() * mathQuestions.length)];
      setTargetNumber(answer);
      setCurrentPrompt(question);
    } else {
      setCurrentPrompt('Draw a Circle!');
    }
  }, [mode]);

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      if (soundEnabled) playSound('success');
      const newScore = score + 10;
      setScore(newScore);
      setMasteryProgress(prev => Math.min(prev + 10, 100));

      if (isPracticing && practicingNodeId) {
          const newPracticeProgress = practiceProgress + 1;
          setPracticeProgress(newPracticeProgress);
          setCharacterMessage(`You! got it crct! ${PRACTICE_THRESHOLD - newPracticeProgress} more to go!`);

          if (newPracticeProgress >= PRACTICE_THRESHOLD) {
              updateKnowledgeGraph(practicingNodeId, 100);
              setCharacterMessage('You! got it crct!');
              setIsPracticing(false);
              setPracticingNodeId(null);
              setPracticeProgress(0);
          }
      } else {
        setCharacterMessage('You! got it crct!');
      }

      if (newScore >= (level + 1) * 100) {
        levelUp();
      }
      
      setTimeout(() => generateNewQuestion(), 2000);
    } else {
      if (soundEnabled) playSound('fail');
      const newScore = Math.max(score - 5, 0);
      setScore(newScore);
      setCharacterMood('encouraging');
      setCharacterMessage('Keep trying! You can do it!');
      if(isPracticing) {
          setPracticeProgress(0);
      }
    }
  };
  
  const handleShapeDetected = (shape: string, isCorrect: boolean) => {
    if (isCorrect) {
        if (soundEnabled) playSound('success');
        setScore(prev => prev + 10);
        setMasteryProgress(prev => Math.min(prev + 10, 100));
        setCharacterMessage('Awesome circle!');
    } else {
        if (soundEnabled) playSound('fail');
        setCharacterMessage('That doesn\'t look like a circle. Try again!');
    }
    setTimeout(() => generateNewQuestion(), 2000);
  }

  const levelUp = () => {
    if (soundEnabled) playSound('levelUp');
    const newLevel = level + 1;
    setLevel(newLevel);
    setShowLevelUp(true);
    setCharacterMood('excited');
    setCharacterMessage('LEVEL UP! Amazing work!');
    setTimeout(() => setShowLevelUp(false), 3000);
  };

  const updateKnowledgeGraph = (nodeId: string, increment: number) => {
    setKnowledgeNodes(prev => {
        const newNodes = prev.map(node =>
            node.id === nodeId
                ? { ...node, mastery: Math.min(node.mastery + increment, 100) }
                : node
        );

        const masteredNode = newNodes.find(n => n.id === nodeId);
        if (masteredNode && masteredNode.mastery >= 100) {
            return newNodes.map(n => {
                const dependenciesMet = n.dependencies.every(depId => {
                    const depNode = newNodes.find(d => d.id === depId);
                    return depNode && depNode.mastery >= 100;
                });
                if (dependenciesMet && !n.unlocked) {
                    setPracticingNodeId(n.id);
                    return { ...n, unlocked: true };
                }
                return n;
            });
        }
        return newNodes;
    });
  };

  const handleNodeClick = (node: KnowledgeNode) => {
      if(!node.unlocked) {
          setCharacterMessage("You need to unlock this skill first!");
          return;
      }
      if(node.mastery >= 100) {
          setCharacterMessage("You have already mastered this skill!");
          return;
      }
      
      setIsPracticing(true);
      setPracticingNodeId(node.id);
      setPracticeProgress(0);
      setCharacterMessage(`Let's practice ${node.label}!`);
      setMode('count');
      generateNewQuestion();
  }
  
  useEffect(() => {
    generateNewQuestion();
  }, [mode, generateNewQuestion]);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 p-4 overflow-x-hidden"
      style={{ fontFamily: "'Quicksand', sans-serif" }}
    >
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="mb-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 border-b-8 border-purple-800 rounded-lg shadow-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Gamepad2 className="w-12 h-12 text-yellow-300" />
                <div>
                  <h1 
                    className="text-2xl md:text-4xl text-white mb-1"
                    style={{ fontFamily: "'Press Start 2P', cursive" }}
                  >
                    LEARNING QUEST
                  </h1>
                  <p 
                    className="text-sm text-purple-200"
                    style={{ fontFamily: "'Press Start 2P', cursive" }}
                  >
                    Gesture-Powered Education
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-3 bg-purple-500 hover:bg-purple-400 rounded-lg border-4 border-purple-700 transition-colors"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-6 h-6 text-white" />
                  ) : (
                    <VolumeX className="w-6 h-6 text-white" />
                  )}
                </button>
                
                <button
                  onClick={() => setMusicEnabled(!musicEnabled)}
                  className={`p-3 rounded-lg border-4 transition-colors ${
                    musicEnabled 
                      ? 'bg-green-500 hover:bg-green-400 border-green-700' 
                      : 'bg-purple-500 hover:bg-purple-400 border-purple-700'
                  }`}
                >
                  <Music className={`w-6 h-6 ${musicEnabled ? 'text-white animate-pulse' : 'text-white opacity-50'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 space-y-6"
          >
            <MasteryPanel
                score={score}
                level={level}
                currentTopic={practicingNodeId || 'Free Play'}
                masteryProgress={masteryProgress}
            />
             <div className="flex justify-around">
                <RetroButton onClick={() => setMode('count')} variant={mode === 'count' ? 'primary' : 'default'}>
                    <Hand className="w-5 h-5 mr-2"/>
                    Count
                </RetroButton>
                <RetroButton onClick={() => setMode('draw')} variant={mode === 'draw' ? 'primary' : 'default'}>
                    <Brush className="w-5 h-5 mr-2"/>
                    Draw
                </RetroButton>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-6"
          >
            <DrawingCanvas
              currentPrompt={currentPrompt}
              onAnswer={handleAnswer}
              onShapeDetected={handleShapeDetected}
              isActive={true}
              targetNumber={targetNumber}
              mode={mode}
            />
          </motion.div>
          
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <KnowledgeGraph nodes={knowledgeNodes} onNodeClick={handleNodeClick} practicingNodeId={practicingNodeId || undefined} />
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <VideoSection
            recommendations={videoRecommendations}
            unlockedVideos={unlockedVideos}
          />
        </motion.div>
      </div>
      
      <PixelCharacter
        mood={characterMood}
        message={characterMessage}
        position="bottom-right"
      />
      
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="bg-gradient-to-br from-yellow-300 to-yellow-500 border-8 border-yellow-600 rounded-3xl p-12 shadow-2xl text-center"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0] 
                }}
                transition={{ 
                  duration: 0.5,
                  repeat: Infinity 
                }}
                className="text-8xl mb-4"
              >
                ⭐
              </motion.div>
              <h2 
                className="text-5xl text-yellow-900 mb-4"
                style={{ fontFamily: "'Press Start 2P', cursive" }}
              >
                LEVEL UP!
              </h2>
              <p 
                className="text-3xl text-yellow-800"
                style={{ fontFamily: "'Press Start 2P', cursive" }}
              >
                LEVEL {level}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}