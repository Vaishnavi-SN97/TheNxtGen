import { PixelPanel } from './PixelPanel';
import { motion } from 'motion/react';

interface KnowledgeNode {
  id: string;
  label: string;
  mastery: number;
  unlocked: boolean;
  x: number;
  y: number;
  dependencies: string[];
}

interface KnowledgeGraphProps {
  nodes: KnowledgeNode[];
}

export function KnowledgeGraph({ nodes }: KnowledgeGraphProps) {
  return (
    <PixelPanel variant="success" className="space-y-4">
      <h2 
        className="text-sm text-center text-green-800"
        style={{ fontFamily: "'Press Start 2P', cursive" }}
      >
        SKILL TREE
      </h2>

      {/* Graph Canvas */}
      <div className="relative w-full h-96 bg-gradient-to-br from-green-50 to-emerald-100 border-4 border-green-400 rounded-lg overflow-hidden">
        {/* Draw connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {nodes.map(node => 
            node.dependencies.map(depId => {
              const depNode = nodes.find(n => n.id === depId);
              if (!depNode) return null;
              
              const isActive = node.unlocked && depNode.unlocked;
              
              return (
                <motion.line
                  key={`${depId}-${node.id}`}
                  x1={`${depNode.x}%`}
                  y1={`${depNode.y}%`}
                  x2={`${node.x}%`}
                  y2={`${node.y}%`}
                  stroke={isActive ? '#22c55e' : '#d1d5db'}
                  strokeWidth="3"
                  strokeDasharray={isActive ? '0' : '5,5'}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1 }}
                />
              );
            })
          )}
        </svg>

        {/* Draw nodes */}
        {nodes.map(node => (
          <motion.div
            key={node.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="absolute"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="relative">
              {/* Glow effect for unlocked nodes */}
              {node.unlocked && (
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5] 
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                  className="absolute inset-0 rounded-full bg-green-400 blur-xl"
                />
              )}

              {/* Node circle */}
              <div 
                className={`
                  relative w-16 h-16 rounded-full border-4 flex items-center justify-center
                  ${node.unlocked ? 'bg-green-500 border-green-700' : 'bg-gray-400 border-gray-600'}
                  ${node.mastery >= 100 ? 'bg-yellow-500 border-yellow-700' : ''}
                  shadow-lg
                `}
              >
                {/* Mastery indicator */}
                {node.unlocked && (
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div 
                      className="bg-yellow-300 transition-all duration-500"
                      style={{ 
                        height: `${node.mastery}%`,
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                      }}
                    />
                  </div>
                )}

                {/* Lock icon or checkmark */}
                <div className="relative z-10">
                  {node.unlocked ? (
                    node.mastery >= 100 ? (
                      <span className="text-2xl">✓</span>
                    ) : (
                      <span 
                        className="text-xs text-white font-bold"
                        style={{ fontFamily: "'Press Start 2P', cursive" }}
                      >
                        {node.mastery}%
                      </span>
                    )
                  ) : (
                    <span className="text-xl">🔒</span>
                  )}
                </div>
              </div>

              {/* Label */}
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <p 
                  className={`text-xs px-2 py-1 rounded border-2
                    ${node.unlocked ? 'bg-green-100 border-green-400 text-green-800' : 'bg-gray-200 border-gray-400 text-gray-600'}
                  `}
                  style={{ fontFamily: "'Press Start 2P', cursive" }}
                >
                  {node.label}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-gray-600 mx-auto mb-1" />
          <p className="text-xs text-gray-600" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            LOCKED
          </p>
        </div>
        <div>
          <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-green-700 mx-auto mb-1" />
          <p className="text-xs text-green-700" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            ACTIVE
          </p>
        </div>
        <div>
          <div className="w-6 h-6 rounded-full bg-yellow-500 border-2 border-yellow-700 mx-auto mb-1 flex items-center justify-center">
            <span className="text-sm">✓</span>
          </div>
          <p className="text-xs text-yellow-700" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            MASTER
          </p>
        </div>
      </div>
    </PixelPanel>
  );
}
