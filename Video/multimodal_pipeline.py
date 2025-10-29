def analyze_video(video_path: str, model_path: str = "pose_landmarker_full.task"):
    """
    Runs the multimodal analysis pipeline on a given video.
    Returns the path to the annotated output video and the CSV as a DataFrame.

    """
    # (✅ Paste your existing code here)
    # Make sure you don't hardcode paths like before — use the function args.
    """
    Enhanced pipeline:
    - Face alignment
    - Facial Action Units (py-feat if available, else heuristics)
    - Body-language cues (shoulder tension, head tilt, hand-to-face)
    - Face emotion (separate) via FER if available, else heuristic
    - Visualization + CSV + annotated video

    Adapted from your pipeline. Adjust paths and thresholds as needed.
    """

    import os
    import cv2
    import numpy as np
    import pandas as pd
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    from collections import deque

    # Optional packages (best-effort)
    try:
        from ultralytics import YOLO
        ULTRALYTICS_AVAILABLE = True
    except Exception:
        ULTRALYTICS_AVAILABLE = False

    try:
        from fer import FER
        FER_AVAILABLE = True
    except Exception:
        FER_AVAILABLE = False

    # Try py-feat (Detector class)
    try:
        from feat import Detector
        FEAT_AVAILABLE = True
    except Exception:
        FEAT_AVAILABLE = False

    # ---------- Settings ----------
    model_path = r"pose_landmarker_full.task"
    video_path = video_path
    yolo_candidates = ["yolov8m-face.pt", "yolov8n-face.pt"]

    FACE_CROP_SIZE = (256, 256)        # upscaled crop used for FaceMesh / FER
    FACE_LM_DRAW_STEP = 5

    csv_path=os.path.splitext(video_path)[0] + "_5s_avg.csv"
    video_out = os.path.join(os.path.dirname(video_path), "output_enhanced_overlay.mp4")

    # ---------- Checks ----------
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Pose model not found at: {model_path}")
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video not found at: {video_path}")

    # ---------- Helpers ----------
    def euclidean(a, b):
        return ((a.x - b.x)**2 + (a.y - b.y)**2 + (a.z - b.z)**2)**0.5

    def euclid_raw(p1, p2):
        return np.linalg.norm(np.array(p1) - np.array(p2))

    def compute_motion_energy(prev_landmarks, curr_landmarks):
        if not prev_landmarks or not curr_landmarks:
            return 0.0
        energy = 0.0
        n = min(len(prev_landmarks), len(curr_landmarks))
        for i in range(n):
            a = prev_landmarks[i]
            b = curr_landmarks[i]
            energy += ((a.x - b.x)**2 + (a.y - b.y)**2 + (a.z - b.z)**2)**0.5
        return energy / n if n>0 else 0.0

    # ---------- Alignment ----------
    def align_face_image(face_crop_bgr, landmarks_norm):
        """
        Aligns face crop so eyes are horizontal.
        - face_crop_bgr: original cropped BGR image (not upscaled)
        - landmarks_norm: list of normalized landmarks relative to that crop (x,y in [0,1])
        If landmarks_norm are from the upscaled crop, ensure coordinates are normalized to crop.
        Returns: rotated crop (BGR)
        """
        try:
            # landmarks_norm expected as list of objects or tuples (x,y)
            # pick left/right eye landmark indices common to FaceMesh
            left_eye_idx = [33, 133]   # approximate controllers for left eye region
            right_eye_idx = [362, 263] # approximate controllers for right eye region

            h, w = face_crop_bgr.shape[:2]
            def avg_point(idxs):
                pts = []
                for i in idxs:
                    lm = landmarks_norm[i]
                    # if lm has attributes x,y
                    if hasattr(lm, "x"):
                        pts.append([lm.x * w, lm.y * h])
                    else:
                        pts.append([lm[0] * w, lm[1] * h])
                return np.mean(pts, axis=0)

            l_eye = avg_point(left_eye_idx)
            r_eye = avg_point(right_eye_idx)
            dx = r_eye[0] - l_eye[0]
            dy = r_eye[1] - l_eye[1]
            angle = np.degrees(np.arctan2(dy, dx))
            center = tuple(np.array([w/2, h/2]))
            rot = cv2.getRotationMatrix2D(tuple(((l_eye+r_eye)/2)), angle, 1.0)
            aligned = cv2.warpAffine(face_crop_bgr, rot, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            return aligned
        except Exception:
            return face_crop_bgr.copy()

    # ---------- AUs with py-feat (if available) ----------
    feat_detector = None
    if FEAT_AVAILABLE:
        try:
            # Detector is expensive to instantiate; reuse it
            feat_detector = Detector(face_detection=True, face_detection_backend="skip")  # skip internal face detection, we pass crops
            print("✅ feat (py-feat) available")
        except Exception as e:
            FEAT_AVAILABLE = False
            feat_detector = None
            print("⚠️ feat init failed:", e)

    def extract_aus_with_feat(face_bgr):
        """Return a dict of AUs as provided by py-feat Detector (if available)"""
        if not FEAT_AVAILABLE or feat_detector is None:
            return None
        try:
            # Detector expects RGB
            rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
            res = feat_detector.detect_image(rgb)
            # res.emotions and res.aus available, take first row
            if res is None or res.shape[0] == 0:
                return None
            aus = {}
            # res.aus columns include e.g., AU01_r, AU01_c, etc. We'll extract continuous AUs ending with "_r" if present
            for col in res.columns:
                if col.startswith("AU") and col.endswith("_r"):
                    aus[col[:-2]] = float(res[col].iloc[0])
            return aus
        except Exception as e:
            print("⚠️ feat detect error:", e)
            return None

    # ---------- Landmark-based AU heuristics (fallback) ----------
    def extract_aus_from_facemesh(lm_list):
        """
        lm_list: list of normalized face landmarks (FaceMesh format relative to crop)
        Returns a dict of heuristic AU approximations:
        - AU01 (Inner Brow Raiser) -> relative distance between inner-brow and eye
        - AU12 (Lip Corner Puller) -> mouth corner vs center
        - AU26 (Jaw Drop / Mouth Open) -> mouth open ratio
        Values are normalized approx in [0,1]
        """
        if not lm_list:
            return {}
        # helper to get point
        def pt(i):
            lm = lm_list[i]
            return np.array([lm.x, lm.y])
        # indices (FaceMesh common points)
        # inner brows: 70(left inner brow), 300(right inner brow) - used in your code earlier
        inner_brow_L = pt(70)
        inner_brow_R = pt(300)
        eye_top_L = pt(159); eye_bot_L = pt(145)
        eye_top_R = pt(386); eye_bot_R = pt(374)
        mouth_l = pt(61); mouth_r = pt(291)
        mouth_top = pt(13); mouth_bot = pt(14)
        jaw = pt(152)  # chin

        # compute normalized distances
        eye_l_height = np.linalg.norm(eye_top_L - eye_bot_L)
        eye_r_height = np.linalg.norm(eye_top_R - eye_bot_R)
        eye_avg = (eye_l_height + eye_r_height) / 2.0

        # AU01: inner brow raise estimated by distance inner brow -> eye top
        brow_l_dist = np.linalg.norm(inner_brow_L - eye_top_L)
        brow_r_dist = np.linalg.norm(inner_brow_R - eye_top_R)
        # normalize by eye height (heuristic)
        au01_l = np.clip((brow_l_dist / (eye_avg + 1e-6)) - 1.0, 0.0, 2.0) / 2.0
        au01_r = np.clip((brow_r_dist / (eye_avg + 1e-6)) - 1.0, 0.0, 2.0) / 2.0
        AU01 = float((au01_l + au01_r) / 2.0)

        # AU12: lip corner puller: horizontal distance of mouth corners relative to mouth width
        mouth_w = np.linalg.norm(mouth_l - mouth_r)
        # vertical distances of corners to top/bottom (indicating smile)
        # use top vs corner vertical delta
        mouth_center = (mouth_l + mouth_r) / 2.0
        corner_l_vert = abs(mouth_top[1] - mouth_l[1])
        corner_r_vert = abs(mouth_top[1] - mouth_r[1])
        # bigger horizontal mouth width combined with corner up (smile) -> AU12
        AU12 = float(np.clip((mouth_w * 2.0) - (corner_l_vert + corner_r_vert), 0.0, 1.5))
        AU12 = AU12 / 1.5

        # AU26 (jaw drop): mouth open ratio
        mouth_open = np.linalg.norm(mouth_top - mouth_bot)
        mouth_ratio = mouth_open / (mouth_w + 1e-6)
        AU26 = float(np.clip((mouth_ratio - 0.05) * 3.0, 0.0, 1.0))

        return {"AU01": AU01, "AU12": AU12, "AU26": AU26}

    # ---------- Body language cues ----------
    def compute_body_cues(pose_landmarks, hand_landmarks, face_box):
        """
        pose_landmarks: MediaPipe PoseLandmarker landmarks (list)
        hand_landmarks: list of mp hands Landmarks or None
        face_box: tuple (x1,y1,x2,y2) in frame coordinates or None
        Returns a dict with:
        - shoulder_tension (0..1) smaller shoulder span -> higher tension
        - head_tilt (degrees) (positive = tilt right)
        - hands_to_face_min_dist (0..1 normalized)
        - hands_near_face_flag (bool)
        """
        cues = {
            "shoulder_tension": 0.0,
            "head_tilt_deg": 0.0,
            "hands_to_face_min_dist": 1.0,
            "hands_near_face": False
        }
        try:
            if pose_landmarks:
                # pose_landmarks are normalized to image - pick shoulders (11 left, 12 right) and nose (0)
                left_sh = pose_landmarks[11]; right_sh = pose_landmarks[12]; nose = pose_landmarks[0]
                sh_dist = euclidean(left_sh, right_sh)  # normalized units
                # typical comfortable shoulder span (normalized) ~ 0.25-0.4 depending on crop; calibrate by video
                # we'll invert and clip so smaller distance -> higher tension
                shoulder_tension = np.clip((0.35 - sh_dist) / 0.25, 0.0, 1.0)
                cues["shoulder_tension"] = float(shoulder_tension)
                # head tilt: angle between vector from nose to midpoint of shoulders
                mid_sh = np.array([(left_sh.x+right_sh.x)/2.0, (left_sh.y+right_sh.y)/2.0])
                v = np.array([nose.x - mid_sh[0], nose.y - mid_sh[1]])
                head_tilt_rad = np.arctan2(v[1], v[0])
                cues["head_tilt_deg"] = float(np.degrees(head_tilt_rad))
            # hands to face: compute pixel distance between hand landmarks (wrist or index tip) and face box center
            if hand_landmarks and face_box is not None:
                x1,y1,x2,y2 = face_box
                face_center = np.array([(x1+x2)/2.0, (y1+y2)/2.0])
                hmin = 1e9
                for hand in hand_landmarks:
                    # take index fingertip 8 in hand landmarks
                    lm = hand.landmark[8]
                    # we need to map normalized landmarks to full frame coordinates? We'll assume hand landmarks were obtained from full frame
                    # but mp.solutions.hands returns normalized coords (x,y) relative to image when using process() on full frame.
                    # For safety trust that the caller passes the original image dims earlier and we compute pixel positions there.
                    # Here we just return a placeholder; actual pixel distance computed by caller below if needed.
                    pass
                # We'll leave numerical mapping to caller; set defaults
                cues["hands_near_face"] = False
                cues["hands_to_face_min_dist"] = 1.0
        except Exception:
            pass
        return cues

    # ---------- Face emotion detectors ----------
    fer_detector = None
    if FER_AVAILABLE:
        try:
            fer_detector = FER(mtcnn=True)
            print("✅ FER available")
        except Exception as e:
            FER_AVAILABLE = False
            fer_detector = None
            print("⚠️ FER init failed:", e)

    def detect_emotion_deepface(face_crop_bgr):
        if FER_AVAILABLE and fer_detector is not None:
            try:
                rgb = cv2.cvtColor(face_crop_bgr, cv2.COLOR_BGR2RGB)
                res = fer_detector.detect_emotions(rgb)
                if res:
                    emotions = res[0]["emotions"]
                    dominant = max(emotions, key=emotions.get)
                    score = emotions[dominant]
                    return dominant, float(score)
                return "neutral", 0.0
            except Exception:
                return "unknown", 0.0
        # fallback: return None to let heuristic handle it
        return None, 0.0

    # ---------- Initialize models (MediaPipe, Pose Landmarker, Hands, FaceMesh, FaceDetection) ----------
    # Pose Landmarker (MediaPipe Tasks)

    # ✅ Make sure the file exists first


    # ✅ Create detector properly
    # Load model as bytes (recommended for Windows/MediaPipe)
    with open(r"C:\Users\chint\OneDrive\Desktop\Public Speaking AI\Video\pose_landmarker_full.task", "rb") as f:
        model_buffer = f.read()

    base_options = python.BaseOptions(model_asset_buffer=model_buffer)
    pose_options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO
    )
    pose_detector = vision.PoseLandmarker.create_from_options(pose_options)

    print("✅ Pose Landmarker loaded")


    # Hands (MediaPipe Solutions)
    mp_hands = mp.solutions.hands
    hands_detector = mp_hands.Hands(static_image_mode=False, max_num_hands=2)

    # FaceMesh
    mp_face = mp.solutions.face_mesh
    face_mesh = mp_face.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.4)

    # FaceDetection fallback
    face_detection = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.35)

    # YOLO face detection (optional loader)
    yolo = None
    if ULTRALYTICS_AVAILABLE:
        sel = None
        for f in yolo_candidates:
            if os.path.exists(f):
                sel = f; break
        if sel:
            try:
                yolo = YOLO(sel)
                print(f"✅ YOLO loaded ({sel})")
            except Exception as e:
                print("⚠️ YOLO load failed:", e)
                yolo = None
        else:
            print("⚠️ no yolov8-face weights found locally; YOLO disabled")

    # ---------- Video I/O ----------
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError("Cannot open video")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # ⚠️ Skip annotated video output
    out_writer = None


    # ---------- Loop state ----------
    prev_pose_landmarks = None
    prev_hand_landmarks = None
    prev_face_landmarks = None

    timeline = []
    frame_idx = 0

    # smoothing for emotion
    emotion_history = deque(maxlen=7)

    print("🎬 Processing frames...")

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        timestamp_ms = int((frame_idx / fps) * 1000)

        # ----- Pose detection -----
        try:
            pose_result = pose_detector.detect_for_video(mp_image, timestamp_ms)
            curr_pose_landmarks = pose_result.pose_landmarks[0] if pose_result.pose_landmarks else None
        except Exception:
            curr_pose_landmarks = None

        # ----- Hands detection -----
        try:
            hands_res = hands_detector.process(frame_rgb)
            curr_hand_landmarks = hands_res.multi_hand_landmarks if hands_res and hands_res.multi_hand_landmarks else None
        except Exception:
            curr_hand_landmarks = None

        # ----- Face detection: YOLO -> FaceDetection fallback -----
        face_box = None
        if yolo is not None:
            try:
                yres = yolo(frame, verbose=False)
                boxes = []
                if len(yres) > 0 and hasattr(yres[0], "boxes") and yres[0].boxes is not None:
                    arr = yres[0].boxes.xyxy.cpu().numpy()
                    for b in arr:
                        x1,y1,x2,y2 = map(int, b[:4])
                        if x2-x1 > 8 and y2-y1 > 8:
                            boxes.append((x1,y1,x2,y2))
                if boxes:
                    boxes.sort(key=lambda b: (b[2]-b[0])*(b[3]-b[1]), reverse=True)
                    face_box = boxes[0]
            except Exception:
                face_box = None

        if face_box is None:
            try:
                fd_res = face_detection.process(frame_rgb)
                if fd_res.detections and len(fd_res.detections) > 0:
                    d = fd_res.detections[0]
                    bbox = d.location_data.relative_bounding_box
                    h, w, _ = frame.shape
                    x1 = max(int(bbox.xmin * w) - 10, 0)
                    y1 = max(int(bbox.ymin * h) - 10, 0)
                    x2 = min(int((bbox.xmin + bbox.width) * w) + 10, w)
                    y2 = min(int((bbox.ymin + bbox.height) * h) + 10, h)
                    if x2 - x1 > 8 and y2 - y1 > 8:
                        face_box = (x1,y1,x2,y2)
            except Exception:
                face_box = None

        face_landmarks_for_frame = None
        face_crop_for_emotion = None
        aus_dict = {}
        au_source = "none"

        if face_box is not None:
            x1,y1,x2,y2 = face_box
            crop = frame[y1:y2, x1:x2]
            if crop.size != 0:
                # upscale for FaceMesh / FER
                crop_up = cv2.resize(crop, FACE_CROP_SIZE, interpolation=cv2.INTER_LINEAR)
                crop_up_rgb = cv2.cvtColor(crop_up, cv2.COLOR_BGR2RGB)
                # FaceMesh on upscaled crop
                try:
                    fm_res = face_mesh.process(crop_up_rgb)
                    if fm_res.multi_face_landmarks and len(fm_res.multi_face_landmarks) > 0:
                        lm_list = fm_res.multi_face_landmarks[0].landmark
                        face_landmarks_for_frame = lm_list
                        # remap lm coords to original frame scale when drawing (we'll draw from lm_list scaled back)
                        # draw some landmarks on main frame
                        for i, lm in enumerate(lm_list):
                            if i % FACE_LM_DRAW_STEP != 0:
                                continue
                            cx = int(lm.x * (x2 - x1)) + x1
                            cy = int(lm.y * (y2 - y1)) + y1
                            cv2.circle(frame, (cx, cy), 1, (0,255,0), -1)
                        cv2.rectangle(frame, (x1,y1), (x2,y2), (255,0,0), 2)
                    else:
                        face_landmarks_for_frame = None
                except Exception:
                    face_landmarks_for_frame = None

                # Align crop using FaceMesh landmarks if available (pass landmarks relative to upscaled crop)
                aligned_crop = crop_up.copy()
                if face_landmarks_for_frame:
                    aligned_crop = align_face_image(crop_up, face_landmarks_for_frame)

                # Save a version for emotion detector (pixel-space)
                face_crop_for_emotion = cv2.resize(aligned_crop, (224,224), interpolation=cv2.INTER_LINEAR)

                # 1) Try py-feat for AUs (on aligned crop in BGR)
                if FEAT_AVAILABLE:
                    aus = extract_aus_with_feat(aligned_crop)
                    if aus:
                        aus_dict = aus
                        au_source = "feat"
                # 2) fallback to landmark-based AU heuristics
                if not aus_dict and face_landmarks_for_frame:
                    aus = extract_aus_from_facemesh(face_landmarks_for_frame)
                    aus_dict = aus
                    au_source = "landmark_heuristic"

                # Draw AU values on frame
                au_texts = []
                for k,v in aus_dict.items():
                    au_texts.append(f"{k}:{v:.2f}")
                for i, t in enumerate(au_texts[:4]):
                    cv2.putText(frame, t, (x1+5, y2 + 20 + i*18), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200,200,255), 1)

        # ---- compute energies ----
        body_energy = compute_motion_energy(prev_pose_landmarks, curr_pose_landmarks) if curr_pose_landmarks else 0.0
        hand_energy = 0.0
        if prev_hand_landmarks and curr_hand_landmarks:
            prev_all = [lm for hand in prev_hand_landmarks for lm in hand.landmark]
            curr_all = [lm for hand in curr_hand_landmarks for lm in hand.landmark]
            hand_energy = compute_motion_energy(prev_all, curr_all)
        face_energy = compute_motion_energy(prev_face_landmarks, face_landmarks_for_frame) if face_landmarks_for_frame else 0.0

        # ---- body cues (expanded) ----
        body_cues = {}
        # compute shoulder tension & head tilt
        try:
            if curr_pose_landmarks:
                left_sh = curr_pose_landmarks[11]; right_sh = curr_pose_landmarks[12]; nose = curr_pose_landmarks[0]
                sh_dist = euclidean(left_sh, right_sh)
                shoulder_tension = np.clip((0.35 - sh_dist) / 0.25, 0.0, 1.0)
                mid_sh_x = (left_sh.x + right_sh.x) / 2.0
                mid_sh_y = (left_sh.y + right_sh.y) / 2.0
                v = np.array([nose.x - mid_sh_x, nose.y - mid_sh_y])
                head_tilt_deg = float(np.degrees(np.arctan2(v[1], v[0])))
                body_cues["shoulder_tension"] = float(shoulder_tension)
                body_cues["head_tilt_deg"] = head_tilt_deg
            else:
                body_cues["shoulder_tension"] = 0.0
                body_cues["head_tilt_deg"] = 0.0
        except Exception:
            body_cues["shoulder_tension"] = 0.0
            body_cues["head_tilt_deg"] = 0.0

        # hands to face distance (pixel measure) & near-face flag
        hands_to_face_min_px = None
        hands_near_face_flag = False
        if curr_hand_landmarks and face_box is not None:
            x1,y1,x2,y2 = face_box
            face_center = np.array([(x1+x2)/2.0, (y1+y2)/2.0])
            hmin = 1e9
            for hand in curr_hand_landmarks:
                # mp hands landmark coordinates in Hands.process are normalized x,y relative to image width/height
                # We'll convert to pixel coords
                # If your hands detector was run on frame_rgb (full frame), these are normalized to full image.
                h_px = np.array([hand.landmark[8].x * frame_w, hand.landmark[8].y * frame_h])  # index fingertip
                d = np.linalg.norm(h_px - face_center)
                if d < hmin: hmin = d
                # near-face threshold (in pixels) heuristic: min(face_width, face_height) * 0.6
            if hmin < 1e8:
                hands_to_face_min_px = float(hmin)
                face_w = x2 - x1
                near_thresh = max(30, 0.6 * face_w)
                hands_near_face_flag = hmin < near_thresh
        body_cues["hands_to_face_px"] = float(hands_to_face_min_px) if hands_to_face_min_px is not None else None
        body_cues["hands_near_face"] = bool(hands_near_face_flag)

        # ---- detect emotion (separate) ----
        # 1) try FER on aligned face crop if available
        emotion_label = None
        emotion_score = 0.0
        if face_crop_for_emotion is not None:
            lbl, sc = detect_emotion_deepface(face_crop_for_emotion)
            if lbl is not None:
                emotion_label = lbl
                emotion_score = sc

        # 2) fallback to your heuristic detect_emotion if FER not available or returned None
        if emotion_label is None:
            # reuse your detect_emotion but accept face_landmarks_for_frame in normalized form and body_energy
            def heuristic_emotion(face_landmarks, body_energy):
                if not face_landmarks:
                    return "No Face"
                # indices per FaceMesh
                L_M, R_M = 61, 291
                T_L, B_L = 13, 14
                LE_T, LE_B = 159, 145
                RE_T, RE_B = 386, 374
                LB, RB = 70, 300
                def dist_idx(a, b):
                    return np.linalg.norm(np.array([a.x - b.x, a.y - b.y, a.z - b.z]))
                mouth_w = dist_idx(face_landmarks[L_M], face_landmarks[R_M])
                mouth_open = dist_idx(face_landmarks[T_L], face_landmarks[B_L])
                eye_l = dist_idx(face_landmarks[LE_T], face_landmarks[LE_B])
                eye_r = dist_idx(face_landmarks[RE_T], face_landmarks[RE_B])
                brow_l = dist_idx(face_landmarks[LB], face_landmarks[LE_T])
                brow_r = dist_idx(face_landmarks[RB], face_landmarks[RE_T])
                mouth_ratio = (mouth_open / mouth_w) if mouth_w > 0 else 0
                eye_open_ratio = (eye_l + eye_r) / 2
                brow_dist = (brow_l + brow_r) / 2
                if mouth_ratio > 0.35 and mouth_w > 0.18:
                    return "Smiling / Happy"
                if brow_dist < 0.03 or eye_open_ratio < 0.02:
                    return "Nervous / Tense"
                if body_energy > 0.5:
                    return "Excited / Nervous"
                return "Neutral / Calm"
            emotion_label = heuristic_emotion(face_landmarks_for_frame, body_energy)

        # smoothing emotion over recent frames for stability
        emotion_history.append(emotion_label)
        smoothed_emotion = max(set(emotion_history), key=emotion_history.count)

        # ---- synchronization/generic overlay ----
        energies = np.array([face_energy, hand_energy, body_energy], dtype=float)
        sync_status = "No Movement"
        if np.max(energies) > 0:
            nrg = energies / (np.max(energies) + 1e-9)
            sync_status = "In Sync" if np.std(nrg) < 0.25 else "Out of Sync"

        # ---- Compose overlay text & color map ----
        color_map = {
            "Smiling / Happy": (0,255,0),
            "Neutral / Calm": (200,200,0),
            "Nervous / Tense": (0,0,255),
            "Excited / Nervous": (0,128,255)
        }
        base_color = color_map.get(smoothed_emotion, (255,255,255))
        info_text = f"F:{frame_idx} {smoothed_emotion} | Sync:{sync_status}"
        cv2.putText(frame, info_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, base_color, 2)

        # show body cues
        cv2.putText(frame, f"BodyE:{body_energy:.3f} HandE:{hand_energy:.3f} FaceE:{face_energy:.3f}", (10,52), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220,220,220), 1)
        cv2.putText(frame, f"ShoulderT:{body_cues.get('shoulder_tension',0):.2f} HeadTilt:{body_cues.get('head_tilt_deg',0):.1f}", (10,70), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220,220,220), 1)
        if body_cues.get("hands_to_face_px") is not None:
            cv2.putText(frame, f"Hand->Face(px):{body_cues['hands_to_face_px']:.0f} NearFace:{body_cues['hands_near_face']}", (10, 88), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220,220,220), 1)

        # Draw face box and AU summary
        if face_box is not None:
            x1,y1,x2,y2 = face_box
            # small AU bar
            xbar = x1; ybar = y1 - 60
            if ybar < 0: ybar = y2 + 5
            cv2.rectangle(frame, (xbar-2, ybar-2), (xbar+140, ybar+52), (30,30,30), -1)
            idx = 0
            for k,v in aus_dict.items():
                cv2.putText(frame, f"{k}:{v:.2f}", (xbar+4, ybar+14 + idx*14), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200,255,200), 1)
                idx += 1

        # Write frame to output
        # out_writer.write(frame)

        # Append timeline row
        timeline.append({
            "frame": frame_idx,
            "time_sec": round(frame_idx / fps, 4),
            "emotion_smoothed": smoothed_emotion,
            "emotion_raw": emotion_label,
            "emotion_score": float(emotion_score),
            "body_energy": float(body_energy),
            "hand_energy": float(hand_energy),
            "face_energy": float(face_energy),
            "sync_status": sync_status,
            "au_source": au_source,
            **{f"AU_{k}": float(v) for k,v in aus_dict.items()},
            "shoulder_tension": float(body_cues.get("shoulder_tension", 0.0)),
            "head_tilt_deg": float(body_cues.get("head_tilt_deg", 0.0)),
            "hands_to_face_px": float(body_cues.get("hands_to_face_px", 0)) if body_cues.get("hands_to_face_px") is not None else None,
            "hands_near_face": bool(body_cues.get("hands_near_face", False))
        })

        # update previous
        prev_pose_landmarks = curr_pose_landmarks
        prev_hand_landmarks = curr_hand_landmarks
        prev_face_landmarks = face_landmarks_for_frame
        frame_idx += 1

        # live preview (optional)
        cv2.imshow("Enhanced Pipeline", frame)
        if cv2.waitKey(1) & 0xFF == 27:
            print("User stopped early.")
            break

    # cleanup
    cap.release()
    cv2.destroyAllWindows()

    # Skip annotated video and per-frame CSV
    print("⚙️ Generating only 5-second aggregated CSV...")

    # Create DataFrame from timeline (in-memory only)
    df = pd.DataFrame(timeline)


    # ---------- 5-second interval aggregation ----------
    # ---------- 5-second interval aggregation ----------
    try:
            if not df.empty and "time_sec" in df.columns:
                df["interval"] = (df["time_sec"] // 5).astype(int) * 5

                categorical_cols = ["emotion_smoothed", "emotion_raw", "sync_status", "au_source", "hands_near_face"]
                numeric_cols = [c for c in df.columns if c not in categorical_cols + ["interval", "frame", "time_sec"]]

                def mode_or_none(series):
                    return series.mode().iloc[0] if not series.mode().empty else None

                grouped = df.groupby("interval").agg({
                    **{col: "mean" for col in numeric_cols},
                    **{col: mode_or_none for col in categorical_cols}
                }).reset_index()

                # ---------- Save CSV ----------
                csv_path = os.path.splitext(video_path)[0] + "_5s_avg.csv"
                grouped.to_csv(csv_path, index=False)
                print(f"✅ 5-sec aggregated CSV saved to: {csv_path}")

                # ---------- Convert to JSON ----------
                json_path = os.path.splitext(video_path)[0] + "_5s_avg.json"
                grouped.to_json(json_path, orient="records", indent=2)
                print(f"✅ JSON version saved to: {json_path}")

            else:
                print("⚠ No data for 5-sec aggregation.")
                csv_path, json_path = None, None

    except Exception as e:
            print("⚠ Aggregation failed:", e)
            csv_path, json_path = None, None

        # ✅ Return both file paths
    return json_path