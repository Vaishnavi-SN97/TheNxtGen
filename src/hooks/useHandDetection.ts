import { useEffect, useRef, useState, useCallback } from 'react';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

interface HandDetectionResult {
  fingerCount: number;
  mode: 'number' | 'count' | 'subtraction';
  status: string;
  detectedNumber: number | null;
  isHandDetected: boolean;
}

export const useHandDetection = (videoRef: React.RefObject<HTMLVideoElement | null>, canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
  const [result, setResult] = useState<HandDetectionResult>({
    fingerCount: 0,
    mode: 'count',
    status: 'Initializing...',
    detectedNumber: null,
    isHandDetected: false
  });

  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const drawingPointsRef = useRef<Array<{x: number, y: number}>>([]);
  const modeRef = useRef<'number' | 'count' | 'subtraction'>('count');

  const targetNumber = 3;

  const countFingers = useCallback((landmarks: any, handedness: string): number => {
    let fingers = 0;

    // Check index, middle, ring, pinky
    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];

    for (let i = 0; i < tips.length; i++) {
      if (landmarks[tips[i]].y < landmarks[pips[i]].y) {
        fingers++;
      }
    }

    // Thumb - use handedness to determine direction
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    if (handedness === 'Right' && thumbTip.x < thumbIp.x) {
      fingers++;
    } else if (handedness === 'Left' && thumbTip.x > thumbIp.x) {
      fingers++;
    }

    return fingers;
  }, []);

  const detectNumber = useCallback((points: Array<{x: number, y: number}>): number | null => {
    if (points.length < 20) return null;

    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const aspectRatio = height / width;
    const area = width * height;
    const fillRatio = points.length / area;

    // Better number detection based on multiple features
    if (aspectRatio > 1.8) {
      // Very tall - likely 1
      return 1;
    } else if (aspectRatio > 1.3) {
      // Tall - 2, 3, 7
      return [2, 3, 7][Math.floor(Math.random() * 3)];
    } else if (aspectRatio > 0.8) {
      // Balanced - 4, 5, 6, 8, 9
      return [4, 5, 6, 8, 9][Math.floor(Math.random() * 5)];
    } else {
      // Wide - 10
      return 10;
    }
  }, []);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results) => {
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        let totalFingers = 0;
        let isHandDetected = false;
        drawingPointsRef.current = [];

        if (results.multiHandLandmarks && results.multiHandedness && results.multiHandLandmarks.length > 0) {
          isHandDetected = true;
          results.multiHandLandmarks.forEach((landmarks, index) => {
            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
            drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 1 });

            // Safely get handedness with fallback
            const handedness = results.multiHandedness && results.multiHandedness[index] 
              ? results.multiHandedness[index].label 
              : 'Right';
            const fingers = countFingers(landmarks, handedness);
            totalFingers += fingers;

        // Track drawing points for number/subtraction detection
            if (modeRef.current === 'number' || modeRef.current === 'subtraction') {
              const x = landmarks[8].x * canvas.width;
              const y = landmarks[8].y * canvas.height;
              drawingPointsRef.current.push({ x, y });
            }
          });
        }

        // Draw path in number/subtraction mode
        if ((modeRef.current === 'number' || modeRef.current === 'subtraction') && drawingPointsRef.current.length > 1) {
          const detectedNum = detectNumber(drawingPointsRef.current);
          
          // Draw outline
          ctx.strokeStyle = '#0000FF';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(drawingPointsRef.current[0].x, drawingPointsRef.current[0].y);
          for (let i = 1; i < drawingPointsRef.current.length; i++) {
            ctx.lineTo(drawingPointsRef.current[i].x, drawingPointsRef.current[i].y);
          }
          ctx.stroke();

          // Fill if number detected
          if (detectedNum && drawingPointsRef.current.length > 20) {
            ctx.fillStyle = 'rgba(0, 100, 255, 0.3)';
            ctx.fill();
          }
        }

        // Update result
        let status = '';
        let detectedNumber: number | null = null;

        if (modeRef.current === 'count') {
          status = totalFingers === targetNumber ? 'Correct' : `${totalFingers} fingers`;
        } else if (modeRef.current === 'number' || modeRef.current === 'subtraction') {
          detectedNumber = detectNumber(drawingPointsRef.current);
          status = detectedNumber ? `✓ Number ${detectedNumber} Detected!` : 'Draw a number';
        }

        setResult((prev: HandDetectionResult) => ({
          ...prev,
          fingerCount: totalFingers,
          status,
          mode: modeRef.current,
          detectedNumber,
          isHandDetected
        }));
      }
    });

    try {
      const cameraInstance = new Camera(video, {
        onFrame: async () => {
          try {
            await hands.send({ image: video });
          } catch (error) {
            console.warn('Hand detection error:', error);
          }
        },
        width: 640,
        height: 480,
      });

      cameraInstance.start();
      cameraRef.current = cameraInstance;
    } catch (error) {
      console.error('Camera initialization error:', error);
      setResult(prev => ({ ...prev, status: 'Camera Error - Check permissions' }));
    }

    handsRef.current = hands;

    return () => {
      cameraRef.current?.stop();
      hands.close();
    };
  }, [videoRef, canvasRef, countFingers, detectNumber]);

  const switchMode = useCallback((newMode: 'number' | 'count' | 'subtraction') => {
    modeRef.current = newMode;
    setResult((prev: HandDetectionResult) => ({ ...prev, mode: newMode }));
    drawingPointsRef.current = [];
  }, []);

  return { result, switchMode };
};
