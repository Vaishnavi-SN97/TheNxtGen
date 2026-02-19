import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Volume2, VolumeX, Music } from 'lucide-react';
import { DrawingCanvas } from './components/DrawingCanvas';
import { MasteryPanel } from './components/MasteryPanel';
import { CoursePanel } from './components/CoursePanel';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { VideoSection } from './components/VideoSection';
import { PixelCharacter } from './components/PixelCharacter';
import { useSounds } from './hooks/useSounds';

// Types
interface CourseLevel {
  id: number;
  name: string;
  topic: string;
  locked: boolean;
  completed: boolean;
  current: boolean;
}

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
  id: string;
  title: string;
  thumbnail: string;
  videoId: string;
  topic: string;
}

type CharacterMood = 'happy' | 'neutral' | 'encouraging' | 'excited';

export default function App() {
  // Game State
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [lastCompletedLevel, setLastCompletedLevel] = useState<string | undefined>(undefined);
  
  // Sound System
  const { playSound, startBackgroundMusic, stopBackgroundMusic } = useSounds();
  
  // Start/stop music when toggle changes
  useEffect(() => {
    if (musicEnabled) {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  }, [musicEnabled, startBackgroundMusic, stopBackgroundMusic]);
  
  // Character State
  const [characterMood, setCharacterMood] = useState<CharacterMood>('neutral');
  const [characterMessage, setCharacterMessage] = useState('Welcome! Let\'s learn together!');
  
  // Course State
  const [courseLevels, setCourseLevels] = useState<CourseLevel[]>([
    { id: 1, name: 'Counting', topic: 'Numbers 1-10', locked: false, completed: false, current: true },
    { id: 2, name: 'Addition', topic: 'Basic Math', locked: true, completed: false, current: false },
    { id: 3, name: 'Subtraction', topic: 'Basic Math', locked: true, completed: false, current: false },
    { id: 4, name: 'Shapes', topic: 'Geometry', locked: true, completed: false, current: false },
  ]);
  
  const [currentPrompt, setCurrentPrompt] = useState('Draw a Circle!');
  const [masteryProgress, setMasteryProgress] = useState(30);
  
  // Knowledge Graph State
  const [knowledgeNodes, setKnowledgeNodes] = useState<KnowledgeNode[]>([
    { id: 'counting', label: 'Counting', mastery: 30, unlocked: true, x: 30, y: 20, dependencies: [] },
    { id: 'numbers', label: 'Numbers', mastery: 20, unlocked: true, x: 50, y: 35, dependencies: ['counting'] },
    { id: 'addition', label: 'Addition', mastery: 0, unlocked: false, x: 30, y: 60, dependencies: ['numbers'] },
    { id: 'subtraction', label: 'Subtract', mastery: 0, unlocked: false, x: 70, y: 60, dependencies: ['numbers'] },
    { id: 'shapes', label: 'Shapes', mastery: 0, unlocked: false, x: 50, y: 80, dependencies: ['addition', 'subtraction'] },
  ]);
  
  // Video State
  const [videoRecommendations] = useState<VideoRecommendation[]>([
    {
      id: '1',
      title: 'Learn to Count 1-10 | Fun Animation',
      thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
      videoId: 'dQw4w9WgXcQ',
      topic: 'Counting',
    },
    {
      id: '2',
      title: 'Addition for Kids | Animated Lesson',
      thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
      videoId: 'dQw4w9WgXcQ',
      topic: 'Addition',
    },
    {
      id: '3',
      title: 'Subtraction Made Easy | Fun Learning',
      thumbnail: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400',
      videoId: 'dQw4w9WgXcQ',
      topic: 'Subtraction',
    },
    {
      id: '4',
      title: 'Shapes & Colors | Educational Video',
      thumbnail: 'https://images.unsplash.com/photo-1596496181848-3091d4878b24?w=400',
      videoId: 'dQw4w9WgXcQ',
      topic: 'Shapes',
    },
    {
      id: '5',
      title: 'Math Magic | Interactive Learning',
      thumbnail: 'https://images.unsplash.com/photo-1632571401005-458e9d244591?w=400',
      videoId: 'dQw4w9WgXcQ',
      topic: 'Math',
    },
    {
      id: '6',
      title: 'Geometry Basics | Animated Tutorial',
      thumbnail: 'https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=400',
      videoId: 'dQw4w9WgXcQ',
      topic: 'Geometry',
    },
  ]);
  
  const unlockedVideos = Math.min(level, videoRecommendations.length);
  
  // Handle shape detection
  const handleShapeDetected = (shape: string, isCorrect: boolean) => {
    if (isCorrect) {
      // Play success sound
      if (soundEnabled) playSound('success');
      
      const newScore = score + 10;
      setScore(newScore);
      
      const newMastery = Math.min(masteryProgress + 10, 100);
      const oldMastery = masteryProgress;
      setMasteryProgress(newMastery);
      
      // Play coin sound for score increase
      if (soundEnabled) {
        setTimeout(() => playSound('coin'), 200);
      }
      
      // Play level-up sound if mastery threshold crossed
      if (oldMastery < 50 && newMastery >= 50 && soundEnabled) {
        setTimeout(() => playSound('levelUp'), 400);
      }
      
      setCharacterMood('happy');
      setCharacterMessage('Great job! That\'s correct!');
      
      // Check for level up
      if (newScore >= (level + 1) * 100) {
        levelUp();
      }
      
      // Update knowledge graph
      updateKnowledgeGraph('counting', 10);
    } else {
      // Play fail sound
      if (soundEnabled) playSound('fail');
      
      const newScore = Math.max(score - 5, 0);
      setScore(newScore);
      setCharacterMood('encouraging');
      setCharacterMessage('Keep trying! You can do it!');
    }
  };
  
  // Level up logic
  const levelUp = () => {
    // Play level up sound
    if (soundEnabled) playSound('levelUp');
    
    const newLevel = level + 1;
    setLevel(newLevel);
    setShowLevelUp(true);
    setCharacterMood('excited');
    setCharacterMessage('LEVEL UP! Amazing work!');
    
    setTimeout(() => setShowLevelUp(false), 3000);
    
    // Unlock next course level
    setCourseLevels(prev => prev.map((lvl, idx) => {
      if (lvl.id === newLevel - 1) {
        return { ...lvl, completed: true, current: false };
      }
      if (lvl.id === newLevel) {
        return { ...lvl, locked: false, current: true };
      }
      return lvl;
    }));
    
    // Unlock knowledge nodes
    if (newLevel === 2) unlockNode('addition');
    if (newLevel === 3) unlockNode('subtraction');
    if (newLevel === 4) unlockNode('shapes');
  };
  
  // Update knowledge graph
  const updateKnowledgeGraph = (nodeId: string, increment: number) => {
    setKnowledgeNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, mastery: Math.min(node.mastery + increment, 100) }
        : node
    ));
  };
  
  const unlockNode = (nodeId: string) => {
    setKnowledgeNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, unlocked: true }
        : node
    ));
  };
  
  // Handle level selection
  const handleLevelSelect = (levelId: number) => {
    const selectedLevel = courseLevels.find(l => l.id === levelId);
    if (selectedLevel && !selectedLevel.locked) {
      setCourseLevels(prev => prev.map(l => ({
        ...l,
        current: l.id === levelId
      })));
      
      // Update prompt based on level
      const prompts = [
        'Draw a Circle!',
        'Draw a Square!',
        'Draw a Triangle!',
        'Draw any Shape!',
      ];
      setCurrentPrompt(prompts[levelId - 1] || 'Draw a Circle!');
    }
  };
  
  const currentLevel = courseLevels.find(l => l.current);
  
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 p-4 overflow-x-hidden"
      style={{ fontFamily: "'Quicksand', sans-serif" }}
    >
      {/* Camera Permission Banner */}
      {window.self !== window.top && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-4"
        >
          <div className="max-w-7xl mx-auto">
            <div className="bg-yellow-400 border-4 border-yellow-600 rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📷</span>
                  <div>
                    <p 
                      className="text-sm text-yellow-900 font-bold mb-1"
                      style={{ fontFamily: "'Press Start 2P', cursive" }}
                    >
                      CAMERA BLOCKED!
                    </p>
                    <p className="text-xs text-yellow-800">
                      Running inside iframe. Open localhost:8501 to use camera features.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => window.open('http://localhost:8501/', '_blank')}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg border-4 border-yellow-800 transition-colors text-xs font-bold"
                  style={{ fontFamily: "'Press Start 2P', cursive" }}
                >
                  OPEN APP
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Header */}
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
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Mastery & Course */}
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 space-y-6"
          >
            <MasteryPanel
              score={score}
              level={level}
              currentTopic={currentLevel?.topic || 'Getting Started'}
              masteryProgress={masteryProgress}
              lastCompletedLevel={lastCompletedLevel}
            />
            
            <CoursePanel
              levels={courseLevels}
              onLevelSelect={handleLevelSelect}
            />
          </motion.div>
          
          {/* Center Panel - Drawing Canvas */}
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-6"
          >
            <DrawingCanvas
              currentPrompt={currentPrompt}
              onShapeDetected={handleShapeDetected}
              isActive={true}
            />
          </motion.div>
          
          {/* Right Panel - Knowledge Graph */}
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <KnowledgeGraph nodes={knowledgeNodes} />
          </motion.div>
        </div>
        
        {/* Bottom Section - Videos */}
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
      
      {/* Pixel Character */}
      <PixelCharacter
        mood={characterMood}
        message={characterMessage}
        position="bottom-right"
      />
      
      {/* Level Up Animation */}
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