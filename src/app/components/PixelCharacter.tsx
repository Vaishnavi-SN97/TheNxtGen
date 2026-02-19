import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface PixelCharacterProps {
  mood: 'happy' | 'neutral' | 'encouraging' | 'excited';
  message?: string;
  position?: 'bottom-left' | 'bottom-right';
}

export function PixelCharacter({ mood, message, position = 'bottom-right' }: PixelCharacterProps) {
  const [showMessage, setShowMessage] = useState(!!message);

  useEffect(() => {
    if (message) {
      setShowMessage(true);
      const timer = setTimeout(() => setShowMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const positionClasses = {
    'bottom-left': 'left-4 bottom-4',
    'bottom-right': 'right-4 bottom-4',
  };

  const expressions = {
    happy: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        {/* Face */}
        <rect x="12" y="12" width="40" height="40" fill="#FFD6A5" />
        {/* Eyes */}
        <rect x="20" y="24" width="6" height="6" fill="#000" />
        <rect x="38" y="24" width="6" height="6" fill="#000" />
        {/* Smile */}
        <rect x="24" y="38" width="4" height="4" fill="#000" />
        <rect x="28" y="40" width="8" height="4" fill="#000" />
        <rect x="36" y="38" width="4" height="4" fill="#000" />
        {/* Hair */}
        <rect x="16" y="8" width="32" height="8" fill="#8B4513" />
        {/* Body */}
        <rect x="20" y="52" width="24" height="8" fill="#4A90E2" />
      </svg>
    ),
    neutral: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="12" y="12" width="40" height="40" fill="#FFD6A5" />
        <rect x="20" y="24" width="6" height="6" fill="#000" />
        <rect x="38" y="24" width="6" height="6" fill="#000" />
        <rect x="24" y="38" width="16" height="4" fill="#000" />
        <rect x="16" y="8" width="32" height="8" fill="#8B4513" />
        <rect x="20" y="52" width="24" height="8" fill="#4A90E2" />
      </svg>
    ),
    encouraging: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="12" y="12" width="40" height="40" fill="#FFD6A5" />
        <rect x="20" y="24" width="6" height="6" fill="#000" />
        <rect x="38" y="24" width="6" height="6" fill="#000" />
        {/* Determined expression */}
        <rect x="22" y="38" width="20" height="4" fill="#000" />
        <rect x="16" y="8" width="32" height="8" fill="#8B4513" />
        <rect x="20" y="52" width="24" height="8" fill="#4A90E2" />
        {/* Thumbs up */}
        <rect x="48" y="36" width="6" height="12" fill="#FFD6A5" />
      </svg>
    ),
    excited: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="12" y="12" width="40" height="40" fill="#FFD6A5" />
        {/* Wide excited eyes */}
        <rect x="18" y="22" width="8" height="8" fill="#000" />
        <rect x="38" y="22" width="8" height="8" fill="#000" />
        {/* Big smile */}
        <rect x="20" y="38" width="4" height="6" fill="#000" />
        <rect x="24" y="42" width="16" height="4" fill="#000" />
        <rect x="40" y="38" width="4" height="6" fill="#000" />
        <rect x="16" y="8" width="32" height="8" fill="#8B4513" />
        <rect x="20" y="52" width="24" height="8" fill="#4A90E2" />
        {/* Star sparkle */}
        <rect x="52" y="16" width="4" height="4" fill="#FFD700" className="animate-pulse" />
      </svg>
    ),
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed ${positionClasses[position]} z-50`}
    >
      <div className="relative">
        {/* Character */}
        <motion.div
          animate={{ 
            y: [0, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-24 h-24"
          style={{ imageRendering: 'pixelated' }}
        >
          {expressions[mood]}
        </motion.div>

        {/* Speech Bubble */}
        <AnimatePresence>
          {showMessage && message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute ${position === 'bottom-right' ? 'right-full mr-4' : 'left-full ml-4'} bottom-0 mb-8`}
            >
              <div className="relative bg-white border-4 border-gray-800 rounded-lg px-4 py-3 shadow-lg max-w-xs">
                <p 
                  className="text-xs text-gray-800"
                  style={{ fontFamily: "'Press Start 2P', cursive", lineHeight: '1.6' }}
                >
                  {message}
                </p>
                {/* Speech bubble tail */}
                <div 
                  className={`absolute ${position === 'bottom-right' ? 'right-0 translate-x-2' : 'left-0 -translate-x-2'} bottom-4`}
                >
                  <div className="w-4 h-4 bg-white border-r-4 border-b-4 border-gray-800 rotate-45" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
