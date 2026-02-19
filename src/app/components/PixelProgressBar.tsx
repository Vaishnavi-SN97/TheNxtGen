import { Progress } from "./ui/progress";

interface PixelProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
  animated?: boolean;
}

export function PixelProgressBar({ 
  value, 
  max = 100, 
  label, 
  showValue = true,
  color = 'green',
  animated = false
}: PixelProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="flex justify-between items-center">
          <span 
            className="text-xs text-gray-700 uppercase tracking-wide"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            {label}
          </span>
          {showValue && (
            <span 
              className="text-xs text-gray-700"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div className="relative w-full h-6 bg-gray-300 border-4 border-gray-400 rounded overflow-hidden">
        <div 
          className={`h-full ${colors[color]} ${animated ? 'animate-pulse' : ''} transition-all duration-500 ease-out`}
          style={{ 
            width: `${percentage}%`,
            imageRendering: 'pixelated',
          }}
        />
        {/* Pixel overlay effect */}
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.1) 2px, rgba(0,0,0,.1) 4px)',
          }}
        />
      </div>
    </div>
  );
}
