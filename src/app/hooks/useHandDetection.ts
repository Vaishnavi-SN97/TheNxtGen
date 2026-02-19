import { useRef, useState, useCallback, useEffect } from 'react';
import { Hands, Results } from '@mediapipe/hands';

interface Point {
  x: number;
  y: number;
}

interface HandDetectionResult {
  indexTip: Point | null;
  isDrawingGesture: boolean;
  allLandmarks: any[];
  fingerCount: number;
  totalFingers: number;
}

interface UseHandDetectionReturn {
  isInitialized: boolean;
  error: string | null;
  startCamera: (video: HTMLVideoElement, canvas: HTMLCanvasElement) => Promise<void>;
  stopCamera: () => void;
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
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close hands
    if (handsRef.current) {
      handsRef.current.close();
      handsRef.current = null;
    }

    // Clear video
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

      // Check if running in an iframe
      const isInIframe = window.self !== window.top;
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isInIframe) {
          setError('Camera blocked in iframe. Click "Open in New Tab" below to use camera features.');
        } else {
          setError('Camera API not supported in this browser');
        }
        setIsInitialized(false);
        return;
      }

      // Check permissions API if available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          console.log('Camera permission status:', permissionStatus.state);
          
          if (permissionStatus.state === 'denied') {
            if (isInIframe) {
              setError('Camera blocked in iframe. Click "Open in New Tab" to use camera features.');
            } else {
              setError('Camera permission denied. Please allow camera access in browser settings.');
            }
            setIsInitialized(false);
            return;
          }
        } catch (e) {
          console.log('Permissions API not fully supported, continuing...');
        }
      }

      console.log('Requesting camera access...');
      console.log('Running in iframe:', isInIframe);

      // Request camera permission and get stream with better constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      console.log('Camera access granted!');

      streamRef.current = stream;
      videoElement.srcObject = stream;

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          resolve();
        };
      });

      // Initialize MediaPipe Hands
      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
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

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          // Count fingers across all detected hands
          results.multiHandLandmarks.forEach((landmarks) => {
            allHandLandmarks.push(landmarks);
            
            let fingers = 0;
            
            // Check 4 fingers (index, middle, ring, pinky)
            const tips = [8, 12, 16, 20];
            const pips = [6, 10, 14, 18];
            
            for (let i = 0; i < tips.length; i++) {
              if (landmarks[tips[i]].y < landmarks[pips[i]].y) {
                fingers++;
              }
            }
            
            // Check thumb (horizontal comparison)
            if (Math.abs(landmarks[4].x - landmarks[3].x) > 0.04) {
              fingers++;
            }
            
            totalFingers += fingers;
          });
        }

        const handDetectionResult: HandDetectionResult = {
          indexTip: null,
          isDrawingGesture: false,
          allLandmarks: allHandLandmarks.length > 0 ? allHandLandmarks[0] : [],
          fingerCount: totalFingers,
          totalFingers: totalFingers,
        };

        // Drawing gesture detection (first hand only)
        if (allHandLandmarks.length > 0) {
          const landmarks = allHandLandmarks[0];
          const indexTip = landmarks[8];
          const indexMcp = landmarks[5];
          const middleTip = landmarks[12];
          const ringTip = landmarks[16];
          const pinkyTip = landmarks[20];

          const indexRaised = indexTip.y < indexMcp.y - 0.05;
          const middleFolded = middleTip.y > indexMcp.y;
          const ringFolded = ringTip.y > indexMcp.y;
          const pinkyFolded = pinkyTip.y > indexMcp.y;

          handDetectionResult.isDrawingGesture = 
            indexRaised && middleFolded && ringFolded && pinkyFolded;

          if (handDetectionResult.isDrawingGesture) {
            handDetectionResult.indexTip = {
              x: indexTip.x,
              y: indexTip.y,
            };
          }
        }

        onResults(handDetectionResult);
      });

      handsRef.current = hands;

      // Process video frames
      const processFrame = async () => {
        const video = currentVideoRef.current;
        const handsInstance = handsRef.current;
        
        if (!video || !handsInstance) return;

        if (video.readyState >= 2) {
          await handsInstance.send({ image: video });
        }

        animationFrameRef.current = requestAnimationFrame(processFrame);
      };

      processFrame();
      setIsInitialized(true);

    } catch (err: any) {
      console.error('Error initializing hand tracking:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else {
        setError('Failed to access camera: ' + err.message);
      }
      setIsInitialized(false);
      stopCamera();
    }
  }, [onResults, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return { isInitialized, error, startCamera, stopCamera };
}