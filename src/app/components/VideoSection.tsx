import { PixelPanel } from './PixelPanel';
import { Play, Gift, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface VideoRecommendation {
  id: string;
  title: string;
  thumbnail: string;
  videoId: string;
  topic: string;
}

interface VideoSectionProps {
  recommendations: VideoRecommendation[];
  unlockedVideos: number;
}

export function VideoSection({ recommendations, unlockedVideos }: VideoSectionProps) {
  return (
    <PixelPanel variant="warning" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="w-6 h-6 text-yellow-600 animate-bounce" />
          <h2 
            className="text-sm text-yellow-800"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            REWARD VIDEOS
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-600" />
          <span 
            className="text-xs text-yellow-700"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            {unlockedVideos} UNLOCKED
          </span>
        </div>
      </div>

      {/* Unlock message */}
      <div className="bg-yellow-50 border-4 border-yellow-300 rounded-lg p-3 text-center">
        <p 
          className="text-xs text-yellow-800"
          style={{ fontFamily: "'Press Start 2P', cursive", lineHeight: '1.6' }}
        >
          Complete levels to unlock educational videos!
        </p>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {recommendations.map((video, index) => {
          const isUnlocked = index < unlockedVideos;
          
          return (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Video Card */}
              <div 
                className={`
                  relative rounded-lg border-4 overflow-hidden
                  ${isUnlocked ? 'border-yellow-400 cursor-pointer hover:scale-105' : 'border-gray-400 opacity-60'}
                  transition-transform
                `}
                onClick={() => isUnlocked && window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-purple-200 to-pink-200 relative">
                  {isUnlocked ? (
                    <>
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                          <Play className="w-6 h-6 text-white ml-1" fill="white" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🔒</div>
                        <p 
                          className="text-xs text-gray-600"
                          style={{ fontFamily: "'Press Start 2P', cursive" }}
                        >
                          LOCKED
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className={`p-2 ${isUnlocked ? 'bg-yellow-100' : 'bg-gray-200'}`}>
                  <p 
                    className="text-xs line-clamp-2"
                    style={{ 
                      fontFamily: "'Quicksand', sans-serif",
                      fontWeight: 600
                    }}
                  >
                    {video.title}
                  </p>
                  <p 
                    className="text-xs text-gray-600 mt-1"
                    style={{ fontFamily: "'Quicksand', sans-serif" }}
                  >
                    {video.topic}
                  </p>
                </div>
              </div>

              {/* New unlock animation */}
              {isUnlocked && index === unlockedVideos - 1 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="absolute -top-2 -right-2 z-10"
                >
                  <div className="bg-yellow-400 border-4 border-yellow-600 rounded-full p-2">
                    <Star className="w-4 h-4 text-yellow-800" fill="currentColor" />
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Next unlock progress */}
      {unlockedVideos < recommendations.length && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p 
              className="text-xs text-yellow-800"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              NEXT UNLOCK
            </p>
            <p 
              className="text-xs text-yellow-700"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              COMPLETE LEVEL {unlockedVideos + 1}
            </p>
          </div>
        </div>
      )}
    </PixelPanel>
  );
}
