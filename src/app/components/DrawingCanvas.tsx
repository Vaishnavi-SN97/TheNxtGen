import { useEffect, useRef, useState, useCallback } from 'react';
import { PixelPanel } from './PixelPanel';
import { RetroButton } from './RetroButton';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Check, X, Power, Hand, Brush } from 'lucide-react';
import { useHandDetection } from '../hooks/useHandDetection';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';

interface DrawingCanvasProps {
  currentPrompt: string;
  onAnswer?: (isCorrect: boolean) => void;
  onShapeDetected?: (shape: string, isCorrect: boolean) => void;
  isActive: boolean;
  targetNumber?: number;
  mode: 'count' | 'draw';
}

type Shape = 'circle' | 'square' | 'triangle' | null;

interface Point {
  x: number;
  y: number;
}

export function DrawingCanvas({
  currentPrompt,
  onAnswer,
  onShapeDetected,
  isActive,
  targetNumber = 3,
  mode
}: DrawingCanvasProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [webcamActive, setWebcamActive] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [detectedFingers, setDetectedFingers] = useState<number | null>(null);
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [points, setPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<Point | null>(null);
  const drawingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const STABILITY_TIMEOUT = 1000;
  const INACTIVITY_TIMEOUT = 2000;

  const handleHandResults = useCallback((result: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    if (videoRef.current) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
    }
    
    if (result.allLandmarks && result.allLandmarks.length > 0) {
        result.allLandmarks.forEach((landmarks: any) => {
            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#FFFFFF', lineWidth: 3 });
            drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 2 });
        });
    }

    if (mode === 'count' && onAnswer) {
      setDetectedFingers(result.totalFingers);
      if (isActive) {
        if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
        answerTimeoutRef.current = setTimeout(() => {
          const correct = result.totalFingers === targetNumber;
          setIsCorrect(correct);
          setShowFeedback(true);
          onAnswer(correct);
          setTimeout(() => setShowFeedback(false), 2000);
        }, STABILITY_TIMEOUT);
      }
    } else if (mode === 'draw' && onShapeDetected) {
        if (result.isDrawingGesture && result.indexTip && isActive) {
            const currentPoint = { x: result.indexTip.x * width, y: result.indexTip.y * height };
            if (!lastPointRef.current || Math.hypot(currentPoint.x - lastPointRef.current.x, currentPoint.y - lastPointRef.current.y) > 10) {
                setPoints(prev => [...prev, currentPoint]);
                lastPointRef.current = currentPoint;
                if (!isDrawing) setIsDrawing(true);
                if (drawingTimeoutRef.current) clearTimeout(drawingTimeoutRef.current);
                drawingTimeoutRef.current = setTimeout(() => finishDrawing(), INACTIVITY_TIMEOUT);
            }
        } else if (isDrawing) {
            finishDrawing();
        }
    }
  }, [isActive, targetNumber, onAnswer, mode, onShapeDetected, isDrawing]);

  const { isInitialized, error, startCamera, stopCamera } = useHandDetection(handleHandResults);

  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;
    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    if (points.length > 1) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
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
    if (drawingTimeoutRef.current) clearTimeout(drawingTimeoutRef.current);

    const detected = detectShape(points);
    const targetShape = currentPrompt.toLowerCase().includes('circle') ? 'circle' : null;
    const correct = detected === targetShape;

    setIsCorrect(correct);
    setShowFeedback(true);
    if(onShapeDetected) onShapeDetected(detected || 'unknown', correct);

    setTimeout(() => {
      setShowFeedback(false);
      clearDrawing();
    }, 2000);
  };
  
  const detectShape = (pts: Point[]): Shape => {
      if (pts.length < 10) return null;
      const closureDistance = Math.hypot(pts[0].x - pts[pts.length-1].x, pts[0].y - pts[pts.length-1].y);
      const minX = Math.min(...pts.map(p=>p.x));
      const maxX = Math.max(...pts.map(p=>p.x));
      const minY = Math.min(...pts.map(p=>p.y));
      const maxY = Math.max(...pts.map(p=>p.y));
      const diagonal = Math.hypot(maxX-minX, maxY-minY);

      if(closureDistance / diagonal < 0.3) return 'circle';
      return null;
  }

  const clearDrawing = () => {
    setPoints([]);
    setIsDrawing(false);
    lastPointRef.current = null;
    if (drawingTimeoutRef.current) clearTimeout(drawingTimeoutRef.current);
  };

  const toggleWebcam = async () => {
    if (webcamActive) {
      stopCamera();
      setWebcamActive(false);
    } else {
      setWebcamActive(true);
      if (videoRef.current && canvasRef.current) {
        try {
          await startCamera(videoRef.current, canvasRef.current);
        } catch (err) {
          setWebcamActive(false);
        }
      } else {
        setWebcamActive(false);
      }
    }
  };

  return (
    <PixelPanel variant="default" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-purple-800" style={{ fontFamily: "'Press Start 2P', cursive" }}>
          {mode === 'count' ? 'GESTURE INPUT' : 'AIR DRAWING'}
        </h2>
        <div className="flex items-center gap-2">
          {webcamActive && isInitialized && (
            <span className="text-xs text-green-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
          <RetroButton size="sm" onClick={toggleWebcam} variant={webcamActive ? 'success' : 'default'}>
            <Power className="w-4 h-4" />
          </RetroButton>
        </div>
      </div>

      <div className="bg-yellow-100 border-4 border-yellow-400 rounded-lg p-4 text-center">
        <p className="text-lg text-yellow-800 mb-2" style={{ fontFamily: "'Press Start 2P', cursive" }}>
          {currentPrompt}
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border-2 border-red-400 rounded-lg p-3">
          <p className="text-xs text-red-800 text-center" style={{ fontFamily: "'Press Start 2P', cursive", lineHeight: '1.6' }}>
            ⚠️ {error}
          </p>
        </div>
      )}

      <div className="relative">
        <video ref={videoRef} className="hidden" playsInline />
        <canvas ref={canvasRef} width={640} height={480} className="w-full h-auto border-4 border-purple-400 rounded-lg bg-gray-800" style={{ transform: 'scaleX(-1)' }} />
        <canvas ref={overlayCanvasRef} width={640} height={480} className="absolute inset-0 w-full h-auto pointer-events-none" style={{ transform: 'scaleX(-1)' }} />

        {!webcamActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 rounded-lg border-4 border-purple-400">
            <div className="text-center">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                CAMERA OFF
              </p>
              <RetroButton onClick={toggleWebcam} variant="primary">START CAMERA</RetroButton>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showFeedback && (
            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`
                ${isCorrect ? 'bg-green-500' : 'bg-red-500'}
                border-8 border-white rounded-full w-32 h-32 flex items-center justify-center shadow-2xl`}>
                {isCorrect ? <Check className="w-16 h-16 text-white" strokeWidth={4} /> : <X className="w-16 h-16 text-white" strokeWidth={4} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {mode === 'count' && (
        <div className="flex justify-center items-center gap-4 bg-gray-200 p-2 rounded-lg">
            <Hand className="w-6 h-6 text-gray-600"/>
            <span className="text-lg font-bold text-gray-800">
              Detected Fingers: {detectedFingers ?? '-'}
            </span>
        </div>
      )}
      {mode === 'draw' && (
        <div className="flex justify-between items-center">
            <div>
              {isDrawing && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                    DRAWING...
                  </span>
                </div>
              )}
            </div>
            <RetroButton size="sm" onClick={clearDrawing} variant="danger">CLEAR</RetroButton>
        </div>
      )}
    </PixelPanel>
  );
}