import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import vision
from mediapipe.tasks.python.vision import HandLandmarker, HandLandmarkerOptions

# Initialize the hand landmarker
options = HandLandmarkerOptions(
    base_options=mp.tasks.BaseOptions(model_asset_path='c:\\Users\\Windows 11\\Downloads\\Retro Pixel Gaming UI\\hand_landmarker.task'),
    num_hands=2,
    min_hand_detection_confidence=0.7,
    min_hand_presence_confidence=0.7,
    min_tracking_confidence=0.7
)

landmarker = HandLandmarker.create_from_options(options)

drawing_points = []

def count_fingers(hand_landmarks, handedness):
    fingers = 0

    # Check index, middle, ring, pinky
    tips = [8, 12, 16, 20]
    pips = [6, 10, 14, 18]

    for tip, pip in zip(tips, pips):
        if hand_landmarks[tip].y < hand_landmarks[pip].y:
            fingers += 1

    # Thumb - improved detection using handedness
    thumb_tip = hand_landmarks[4]
    thumb_ip = hand_landmarks[3]
    if handedness == "Right":
        if thumb_tip.x < thumb_ip.x:
            fingers += 1
    else:  # Left
        if thumb_tip.x > thumb_ip.x:
            fingers += 1

    return fingers

def detect_circle(points):
    if len(points) < 20:
        return False

    pts = np.array(points)
    center = np.mean(pts, axis=0)
    distances = np.linalg.norm(pts - center, axis=1)

    return np.std(distances) < 20  # circle consistency

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Error: Could not open camera.")
    exit()

target_number = 3
mode = "count"  # "count" or "draw"

print("Controls:")
print("Press 'c' for count mode")
print("Press 'd' for draw mode")
print("Press 'q' to quit")

while True:
    ret, frame = cap.read()
    if not ret:
        print("Error: Could not read frame.")
        break

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # Create MP Image
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    
    # Detect hands
    results = landmarker.detect(mp_image)

    total_fingers = 0
    drawing_points = []  # Reset drawing points each frame for real-time drawing

    if results.hand_landmarks:
        for idx, hand_landmarks in enumerate(results.hand_landmarks):
            # Draw landmarks
            for landmark in hand_landmarks:
                x = int(landmark.x * frame.shape[1])
                y = int(landmark.y * frame.shape[0])
                cv2.circle(frame, (x, y), 5, (0, 255, 0), -1)
            
            # Get handedness
            handedness = results.handedness[idx][0].category_name if results.handedness else "Right"

            fingers = count_fingers(hand_landmarks, handedness)
            total_fingers += fingers

            # Drawing mode (index finger tip)
            if mode == "draw":
                x = int(hand_landmarks[8].x * frame.shape[1])
                y = int(hand_landmarks[8].y * frame.shape[0])
                drawing_points.append((x, y))

    # Draw path in draw mode
    if mode == "draw" and len(drawing_points) > 1:
        for i in range(1, len(drawing_points)):
            cv2.line(frame, drawing_points[i - 1], drawing_points[i], (255, 0, 0), 3)

    # COUNT MODE
    if mode == "count":
        status = "Correct" if total_fingers == target_number else "Try Again"

        cv2.putText(frame, f"Show: {target_number}",
                    (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        cv2.putText(frame, f"Detected: {total_fingers}",
                    (10, 80), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

        color = (0, 255, 0) if status == "Correct" else (0, 0, 255)

        cv2.putText(frame, status,
                    (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 3)

    # DRAW MODE
    elif mode == "draw":
        is_circle = detect_circle(drawing_points) if len(drawing_points) >= 20 else False

        text = "Circle Detected!" if is_circle else "Draw a Circle"
        color = (0, 255, 0) if is_circle else (0, 0, 255)

        cv2.putText(frame, text,
                    (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 3)

    cv2.imshow("Gesture Learning", frame)

    key = cv2.waitKey(1)

    if key == ord('c'):
        mode = "count"
        drawing_points = []

    elif key == ord('d'):
        mode = "draw"
        drawing_points = []

    elif key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()