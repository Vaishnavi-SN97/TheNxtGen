import { PixelPanel } from './PixelPanel';
import { Lock, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'motion/react';

interface CourseLevel {
  id: number;
  name: string;
  topic: string;
  locked: boolean;
  completed: boolean;
  current: boolean;
}

interface CoursePanelProps {
  levels: CourseLevel[];
  onLevelSelect: (levelId: number) => void;
}

export function CoursePanel({ levels, onLevelSelect }: CoursePanelProps) {
  return (
    <PixelPanel variant="primary" className="space-y-4">
      <h2 
        className="text-sm text-center text-purple-800"
        style={{ fontFamily: "'Press Start 2P', cursive" }}
      >
        COURSE MAP
      </h2>

      <div className="space-y-3">
        {levels.map((level, index) => (
          <div key={level.id}>
            <motion.button
              whileHover={!level.locked ? { scale: 1.05 } : {}}
              whileTap={!level.locked ? { scale: 0.95 } : {}}
              onClick={() => !level.locked && onLevelSelect(level.id)}
              disabled={level.locked}
              className={`
                w-full p-4 rounded-lg border-4 transition-all
                ${level.locked ? 'bg-gray-200 border-gray-400 cursor-not-allowed opacity-60' : ''}
                ${level.current ? 'bg-yellow-200 border-yellow-500 animate-pulse shadow-lg' : ''}
                ${level.completed && !level.current ? 'bg-green-200 border-green-500' : ''}
                ${!level.locked && !level.current && !level.completed ? 'bg-blue-100 border-blue-400 hover:bg-blue-200' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className={`
                    w-10 h-10 rounded-full border-4 flex items-center justify-center
                    ${level.locked ? 'bg-gray-300 border-gray-500' : ''}
                    ${level.current ? 'bg-yellow-300 border-yellow-600' : ''}
                    ${level.completed ? 'bg-green-300 border-green-600' : ''}
                    ${!level.locked && !level.current && !level.completed ? 'bg-blue-300 border-blue-600' : ''}
                  `}>
                    {level.locked && <Lock className="w-5 h-5 text-gray-600" />}
                    {level.completed && <CheckCircle2 className="w-5 h-5 text-green-700" />}
                    {!level.locked && !level.completed && <Circle className="w-5 h-5 text-blue-700" />}
                  </div>

                  {/* Info */}
                  <div className="text-left">
                    <p 
                      className="text-xs text-gray-700 mb-1"
                      style={{ fontFamily: "'Press Start 2P', cursive" }}
                    >
                      LEVEL {level.id}
                    </p>
                    <p 
                      className={`text-sm font-bold ${level.locked ? 'text-gray-600' : 'text-purple-800'}`}
                      style={{ fontFamily: "'Press Start 2P', cursive" }}
                    >
                      {level.name}
                    </p>
                  </div>
                </div>

                {/* Glow effect for current level */}
                {level.current && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-3 h-3 rounded-full bg-yellow-500"
                  />
                )}
              </div>
            </motion.button>

            {/* Connector line */}
            {index < levels.length - 1 && (
              <div className="flex justify-center py-2">
                <div className={`w-1 h-8 ${level.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
            )}
          </div>
        ))}
      </div>
    </PixelPanel>
  );
}
