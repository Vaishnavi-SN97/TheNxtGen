import { useEffect, useRef, useState, useCallback } from 'react';
import { PixelPanel } from './PixelPanel';
import { RetroButton } from './RetroButton';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Circle, Square, Triangle, Check, X, Power } from 'lucide-react';
import { useHandDetection } from '../hooks/useHandDetection';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';

interface DrawingCanvasProps {
  currentPrompt: string;
  onShapeDetected: (shape: string, isCorrect: boolean) => void;
  isActive: boolean;
  mode?: 'draw' | 'count';
  targetNumber?: number;
}

type Shape = 'circle' | 'square' | 'triangle' | null;

interface Point {
  x: number;
  y: number;
}

export function DrawingCanvas({ 
  currentPrompt, 
  onShapeDetected, 
  isActive,
  mode = 'draw',
  targetNumber = 3
}: DrawingCanvasProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [webcamActive, setWebcamActive] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [detectedShape, setDetectedShape] = useState<Shape>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [lastMovementTime, setLastMovementTime] = useState<number>(Date.now());
  const lastPointRef = useRef<Point | null>(null);
  const drawingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [useMouseMode, setUseMouseMode] = useState(false);
  const [isMouseDrawing, setIsMouseDrawing] = useState(false);

  // Jitter reduction threshold (in pixels)
  const JITTER_THRESHOLD = 0.015; // 1.5% of canvas size
  const INACTIVITY_TIMEOUT = 2000; // 2 seconds

  // Handle hand detection results
  const handleHandResults = useCallback((result: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw video frame (your face)
    if (videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, width, height);
    }

    // Draw hand skeleton if landmarks exist
    if (result.allLandmarks && result.allLandmarks.length > 0) {
      const landmarks = result.allLandmarks;
      
      // Draw connections (white lines)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      HAND_CONNECTIONS.forEach(([start, end]) => {
        const startLandmark = landmarks[start];
        const endLandmark = landmarks[end];
        ctx.beginPath();
        ctx.moveTo(startLandmark.x * width, startLandmark.y * height);
        ctx.lineTo(endLandmark.x * width, endLandmark.y * height);
        ctx.stroke();
      });

      // Draw landmarks (red dots)
      landmarks.forEach((landmark: any) => {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(landmark.x * width, landmark.y * height, 5, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Highlight index fingertip if drawing gesture
      if (result.isDrawingGesture && result.indexTip) {
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(
          result.indexTip.x * width, 
          result.indexTip.y * height, 
          10, 
          0, 
          2 * Math.PI
        );
        ctx.fill();
      }
    }

    // Handle drawing logic
    if (result.isDrawingGesture && result.indexTip && isActive) {
      const currentPoint = {
        x: result.indexTip.x * width,
        y: result.indexTip.y * height,
      };

      // Check for significant movement (jitter reduction)
      let shouldAddPoint = false;
      
      if (!lastPointRef.current) {
        shouldAddPoint = true;
      } else {
        const distance = Math.sqrt(
          Math.pow(currentPoint.x - lastPointRef.current.x, 2) +
          Math.pow(currentPoint.y - lastPointRef.current.y, 2)
        );
        const threshold = Math.max(width, height) * JITTER_THRESHOLD;
        
        if (distance > threshold) {
          shouldAddPoint = true;
        }
      }

      if (shouldAddPoint) {
        setPoints(prev => [...prev, currentPoint]);
        lastPointRef.current = currentPoint;
        setLastMovementTime(Date.now());
        
        if (!isDrawing) {
          setIsDrawing(true);
        }

        // Reset inactivity timeout
        if (drawingTimeoutRef.current) {
          clearTimeout(drawingTimeoutRef.current);
        }
        drawingTimeoutRef.current = setTimeout(() => {
          finishDrawing();
        }, INACTIVITY_TIMEOUT);
      }
    } else if (isDrawing) {
      // Finger went down, finish drawing
      finishDrawing();
    }
  }, [isActive, isDrawing]);

  // Initialize hand detection
  const { isInitialized, error, startCamera, stopCamera } = useHandDetection(
    handleHandResults
  );

  // Draw the path on overlay canvas
  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;

    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (points.length > 0) {
      ctx.strokeStyle = '#22c55e'; // Green color
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#22c55e';

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }

      ctx.stroke();
    }
  }, [points]);

  const finishDrawing = () => {
    if (points.length < 10) {
      clearDrawing();
      return;
    }

    setIsDrawing(false);
    
    if (drawingTimeoutRef.current) {
      clearTimeout(drawingTimeoutRef.current);
    }

    // Detect shape
    const detected = detectShape(points);
    setDetectedShape(detected);

    // Check if correct
    const targetShape = currentPrompt.toLowerCase().includes('circle') ? 'circle' :
                       currentPrompt.toLowerCase().includes('square') ? 'square' :
                       currentPrompt.toLowerCase().includes('triangle') ? 'triangle' : null;

    const correct = detected === targetShape;
    setIsCorrect(correct);
    setShowFeedback(true);

    onShapeDetected(detected || 'unknown', correct);

    // Hide feedback and clear after 2 seconds
    setTimeout(() => {
      setShowFeedback(false);
      clearDrawing();
    }, 2000);
  };

  const detectShape = (pts: Point[]): Shape => {
    if (pts.length < 10) return null;

    const startPoint = pts[0];
    const endPoint = pts[pts.length - 1];
    
    // Calculate closure distance
    const closureDistance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + 
      Math.pow(endPoint.y - startPoint.y, 2)
    );

    // Calculate total path length
    let totalLength = 0;
    for (let i = 1; i < pts.length; i++) {
      totalLength += Math.sqrt(
        Math.pow(pts[i].x - pts[i-1].x, 2) + 
        Math.pow(pts[i].y - pts[i-1].y, 2)
      );
    }

    // Calculate bounding box
    const minX = Math.min(...pts.map(p => p.x));
    const maxX = Math.max(...pts.map(p => p.x));
    const minY = Math.min(...pts.map(p => p.y));
    const maxY = Math.max(...pts.map(p => p.y));
    const width = maxX - minX;
    const height = maxY - minY;
    const diagonal = Math.sqrt(width * width + height * height);

    // Circle detection: path is closed and relatively circular
    const closureRatio = closureDistance / diagonal;
    if (closureRatio < 0.2) {
      // Check circularity
      const aspectRatio = Math.min(width, height) / Math.max(width, height);
      if (aspectRatio > 0.7) {
        return 'circle';
      }
    }

    // Count direction changes (corners)
    let corners = 0;
    const angleThreshold = Math.PI / 4; // 45 degrees
    
    for (let i = 10; i < pts.length - 10; i += 5) {
      const prev = pts[i - 10];
      const curr = pts[i];
      const next = pts[i + 10];

      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      let angleDiff = Math.abs(angle2 - angle1);
      
      // Normalize angle difference
      if (angleDiff > Math.PI) {
        angleDiff = 2 * Math.PI - angleDiff;
      }

      if (angleDiff > angleThreshold) {
        corners++;
      }
    }

    // Square: ~4 corners
    if (corners >= 3 && corners <= 6) {
      const aspectRatio = Math.min(width, height) / Math.max(width, height);
      if (aspectRatio > 0.6) {
        return 'square';
      }
    }

    // Triangle: ~3 corners
    if (corners >= 2 && corners < 4) {
      return 'triangle';
    }

    // Default to circle if closed shape
    if (closureRatio < 0.3) {
      return 'circle';
    }

    return null;
  };

  const clearDrawing = () => {
    setPoints([]);
    setDetectedShape(null);
    setShowFeedback(false);
    setIsDrawing(false);
    setIsMouseDrawing(false);
    lastPointRef.current = null;
    
    if (drawingTimeoutRef.current) {
      clearTimeout(drawingTimeoutRef.current);
    }
  };

  const toggleWebcam = async () => {
    if (webcamActive) {
      stopCamera();
      setWebcamActive(false);
      clearDrawing();
    } else {
      // Set active first to show loading state
      setWebcamActive(true);
      
      // Start camera immediately in the same call stack as button click
      if (videoRef.current && canvasRef.current) {
        try {
          await startCamera(videoRef.current, canvasRef.current);
        } catch (err) {
          // If camera fails, revert webcam active state
          setWebcamActive(false);
        }
      } else {
        setWebcamActive(false);
      }
    }
  };

  return (
    <PixelPanel variant="default" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 
          className="text-sm text-purple-800"
          style={{ fontFamily: "'Press Start 2P', cursive" }}
        >
          AIR DRAWING
        </h2>
        <div className="flex items-center gap-2">
          {webcamActive && isInitialized && (
            <span className="text-xs text-green-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
          <RetroButton 
            size="sm" 
            onClick={toggleWebcam}
            variant={webcamActive ? 'success' : 'default'}
          >
            <Power className="w-4 h-4" />
          </RetroButton>
        </div>
      </div>

      {/* Prompt */}
      <div className="bg-yellow-100 border-4 border-yellow-400 rounded-lg p-4 text-center">
        <p 
          className="text-lg text-yellow-800 mb-2"
          style={{ fontFamily: "'Press Start 2P', cursive" }}
        >
          {currentPrompt}
        </p>
        <div className="flex justify-center gap-4 mt-3">
          {currentPrompt.toLowerCase().includes('circle') && <Circle className="w-8 h-8 text-yellow-700" />}
          {currentPrompt.toLowerCase().includes('square') && <Square className="w-8 h-8 text-yellow-700" />}
          {currentPrompt.toLowerCase().includes('triangle') && <Triangle className="w-8 h-8 text-yellow-700" />}
        </div>
      </div>

      {/* Instructions */}
      {webcamActive && !error && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
          <p 
            className="text-xs text-blue-800 text-center"
            style={{ fontFamily: "'Press Start 2P', cursive", lineHeight: '1.6' }}
          >
            ☝️ Raise index finger only to draw!
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-2 border-red-400 rounded-lg p-3">
          <p 
            className="text-xs text-red-800 text-center mb-3"
            style={{ fontFamily: "'Press Start 2P', cursive", lineHeight: '1.6' }}
          >
            ⚠️ {error}
          </p>
          <div className="text-center">
            {error.includes('iframe') ? (
              // Iframe-specific instructions
              <>
                <p className="text-xs text-gray-700 mb-3" style={{ lineHeight: '1.5' }}>
                  Camera access is blocked when running inside Figma. 
                  Open the app at localhost:8501 to use camera features.
                </p>
                <RetroButton 
                  size="sm" 
                  onClick={() => window.open('http://localhost:8501/', '_blank')} 
                  variant="primary"
                >
                  OPEN LOCALHOST:8501
                </RetroButton>
              </>
            ) : (
              // Regular permission instructions
              <>
                <p className="text-xs text-gray-700 mb-2" style={{ lineHeight: '1.5' }}>
                  To enable camera:
                </p>
                <ol className="text-xs text-gray-600 text-left mx-auto mb-3" style={{ maxWidth: '350px', lineHeight: '1.5' }}>
                  <li><strong>1. Check browser address bar</strong> - Click camera icon or lock icon</li>
                  <li><strong>2. Set Camera to "Allow"</strong></li>
                  <li><strong>3. Refresh page</strong> and click START CAMERA again</li>
                  <li><strong>4. Click "Allow"</strong> when browser asks for permission</li>
                </ol>
                <p className="text-xs text-gray-500 mb-2" style={{ lineHeight: '1.5' }}>
                  If using Chrome, open <code>chrome://settings/content/camera</code>
                </p>
                <div className="flex gap-2 justify-center">
                  <RetroButton 
                    size="sm" 
                    onClick={() => window.location.reload()} 
                    variant="primary"
                  >
                    REFRESH PAGE
                  </RetroButton>
                  <RetroButton 
                    size="sm" 
                    onClick={() => setWebcamActive(false)} 
                    variant="danger"
                  >
                    CANCEL
                  </RetroButton>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Canvas Container */}
      <div className="relative">
        {/* Hidden video element for MediaPipe */}
        <video
          ref={videoRef}
          className="hidden"
          playsInline
        />

        {/* Main canvas for hand skeleton and grid */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="w-full h-auto border-4 border-purple-400 rounded-lg bg-white"
          style={{ 
            imageRendering: 'auto',
            transform: 'scaleX(-1)', // Flip horizontally for mirror effect
          }}
        />

        {/* Overlay canvas for drawing path */}
        <canvas
          ref={overlayCanvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-auto pointer-events-none"
          style={{ 
            transform: 'scaleX(-1)', // Flip horizontally for mirror effect
          }}
        />

        {/* Webcam inactive overlay */}
        {!webcamActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 rounded-lg border-4 border-purple-400">
            <div className="text-center">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p 
                className="text-sm text-gray-600 mb-4"
                style={{ fontFamily: "'Press Start 2P', cursive" }}
              >
                CAMERA OFF
              </p>
              <RetroButton onClick={toggleWebcam} variant="primary">
                START CAMERA
              </RetroButton>
            </div>
          </div>
        )}

        {/* Feedback Animation */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className={`
                ${isCorrect ? 'bg-green-500' : 'bg-red-500'}
                border-8 border-white
                rounded-full
                w-32 h-32
                flex items-center justify-center
                shadow-2xl
              `}>
                {isCorrect ? (
                  <Check className="w-16 h-16 text-white" strokeWidth={4} />
                ) : (
                  <X className="w-16 h-16 text-white" strokeWidth={4} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confetti on correct answer */}
        {showFeedback && isCorrect && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: '50%', 
                  y: '50%',
                  opacity: 1,
                  scale: 1 
                }}
                animate={{ 
                  x: `${50 + (Math.random() - 0.5) * 100}%`,
                  y: `${50 + (Math.random() - 0.5) * 100}%`,
                  opacity: 0,
                  scale: 0,
                  rotate: Math.random() * 360
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute w-4 h-4 rounded-full"
                style={{ 
                  backgroundColor: ['#FFD700', '#FF69B4', '#87CEEB', '#90EE90'][Math.floor(Math.random() * 4)]
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div>
          {detectedShape && (
            <div className="flex items-center gap-2">
              <span 
                className="text-xs text-gray-600"
                style={{ fontFamily: "'Press Start 2P', cursive" }}
              >
                DETECTED:
              </span>
              <span 
                className="text-xs font-bold text-purple-700"
                style={{ fontFamily: "'Press Start 2P', cursive" }}
              >
                {detectedShape.toUpperCase()}
              </span>
            </div>
          )}
          {isDrawing && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span 
                className="text-xs text-green-600"
                style={{ fontFamily: "'Press Start 2P', cursive" }}
              >
                DRAWING...
              </span>
            </div>
          )}
        </div>
        <RetroButton size="sm" onClick={clearDrawing} variant="danger">
          CLEAR
        </RetroButton>
      </div>
    </PixelPanel>
  );
}