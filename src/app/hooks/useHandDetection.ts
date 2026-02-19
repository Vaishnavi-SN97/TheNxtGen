import { useRef, useState, useCallback, useEffect } from 'react';
import { Hands, Results, LandmarkList, Handedness } from '@mediapipe/hands';

interface Point {
  x: number;
  y: number;
}

interface HandDetectionResult {
  allLandmarks: any[];
  fingerCount: number;
  totalFingers: number;
  isDrawingGesture: boolean;
  indexTip: Point | null;
}

interface UseHandDetectionReturn {
  isInitialized: boolean;
  error: string | null;
  startCamera: (video: HTMLVideoElement, canvas: HTMLCanvasElement) => Promise<void>;
  stopCamera: () => void;
}

const countFingers = (handLandmarks: LandmarkList, handedness: Handedness): number => {
    let fingers = 0;

    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];

    for (let i = 0; i < tips.length; i++) {
        if (handLandmarks[tips[i]].y < handLandmarks[pips[i]].y) {
            fingers++;
        }
    }

    const thumbTip = handLandmarks[4];
    const thumbIp = handLandmarks[3];
    if (handedness && handedness.length > 0) {
        if (handedness[0].categoryName === "Right") {
            if (thumbTip.x < thumbIp.x) {
                fingers++;
            }
        } else { // Left
            if (thumbTip.x > thumbIp.x) {
                fingers++;
            }
        }
    } else {
        if (Math.abs(handLandmarks[4].x - handLandmarks[3].x) > 0.04) {
            fingers++;
        }
    }

    return fingers;
}

export function useHandDetection(
  onResults: (result: HandDetectionResult) => void
): UseHandDetectionReturn {
  const handsRef = useRef<Hands | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (handsRef.current) {
      handsRef.current.close();
      handsRef.current = null;
    }

    if (currentVideoRef.current) {
      currentVideoRef.current.srcObject = null;
      currentVideoRef.current = null;
    }

    setIsInitialized(false);
  }, []);

  const startCamera = useCallback(async (videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) => {
    if (!videoElement || !canvasElement) {
      setError('Video or canvas element not ready');
      return;
    }

    try {
      setError(null);
      currentVideoRef.current = videoElement;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;
      videoElement.srcObject = stream;

      await new Promise<void>((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          resolve();
        };
      });

      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      hands.onResults((results: Results) => {
        let totalFingers = 0;
        const allHandLandmarks: any[] = [];
        let isDrawingGesture = false;
        let indexTip: Point | null = null;

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          results.multiHandLandmarks.forEach((landmarks, index) => {
            allHandLandmarks.push(landmarks);
            const handedness = results.multiHandedness[index];
            totalFingers += countFingers(landmarks, handedness);

            const indexFingerTip = landmarks[8];
            const middleFingerTip = landmarks[12];
            const ringFingerTip = landmarks[16];
            const pinkyFingerTip = landmarks[20];
            const indexMcp = landmarks[5];

            const indexRaised = indexFingerTip.y < indexMcp.y - 0.05;
            const middleFolded = middleFingerTip.y > indexMcp.y;
            const ringFolded = ringFingerTip.y > indexMcp.y;
            const pinkyFolded = pinkyFingerTip.y > indexMcp.y;

            if (indexRaised && middleFolded && ringFolded && pinkyFolded) {
                isDrawingGesture = true;
                indexTip = { x: indexFingerTip.x, y: indexFingerTip.y };
            }
          });
        }

        onResults({
          allLandmarks: allHandLandmarks.length > 0 ? allHandLandmarks : [],
          fingerCount: totalFingers,
          totalFingers: totalFingers,
          isDrawingGesture,
          indexTip
        });
      });

      handsRef.current = hands;

      const processFrame = async () => {
        if (!currentVideoRef.current || !handsRef.current) return;
        if (currentVideoRef.current.readyState >= 2) {
          await handsRef.current.send({ image: currentVideoRef.current });
        }
        animationFrameRef.current = requestAnimationFrame(processFrame);
      };

      processFrame();
      setIsInitialized(true);

    } catch (err: any) {
      console.error('Error initializing hand tracking:', err);
      setError('Failed to access camera: ' + err.message);
      setIsInitialized(false);
      stopCamera();
    }
  }, [onResults, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return { isInitialized, error, startCamera, stopCamera };
}