import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Volume2,
  Pause,
  SkipForward,
  ChevronRight,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { sampleWorkouts } from "../data/workouts";
import { ML_EXERCISES } from "../data/workouts";
import { useAuth } from "../context/AuthContext"
import axios from "axios";
import { speak } from "../utils/speak";
import { FITNESS_API } from "../utils/api";
import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";




export default function LiveTracker() {
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const lastMetricsRef = useRef(null);
  const finishLock = useRef(false);
  const { user } = useAuth();

  const weight = user?.profile?.weight;
  const height = user?.profile?.height;
  const age = user?.profile?.age;
  const lastSpokenRepRef = useRef(0);
  const exerciseSpokenRef = useRef(false);
  const lastMovementTimeRef = useRef(Date.now());
  const lastIdleSpeakRef = useRef(0);
  const lastWrongSpeakRef = useRef(0);
  const lastPostureSpeakRef = useRef(0);
  const lastFatigueSpeakRef = useRef(0);
  const exerciseStartTimeRef = useRef(0);
  const lastCoachSpeakRef = useRef(0);
  const lastRepTimeRef = useRef(0);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);
  const repStageRef = useRef(null);
  const lastRepTimestampRef = useRef(0);
  const canvasRef = useRef(null);
  const accuracyRef = useRef(100);








  const { id } = useParams();
  const navigate = useNavigate();


  const workout = sampleWorkouts.find(w => w.id === id);
  if (!workout) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        Workout not found
      </div>
    );
  }

  const [activeExercise, setActiveExercise] = useState(null);   // name

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentExercise = { name: activeExercise || workout.exercises[currentIndex] };
  const [data, setData] = useState(null);
  const [paused, setPaused] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [exerciseResults, setExerciseResults] = useState([]);
  const [exerciseDone, setExerciseDone] = useState(false);
  const [accuracyScore, setAccuracyScore] = useState(100);



  const streamRef = useRef(null);
  const [sessionStats, setSessionStats] = useState({
    maxHR: 0,
    totalReps: 0,
    avgStress: 0,
    samples: 0,
  });

  const totalDuration = workout.duration;
  const totalCalories = workout.calories;
  const totalReps = workout.exercises.reduce(
    (sum, e) => sum + (e.reps || 0),
    0
  );

  const aiExercise = ML_EXERCISES.find(e => e.name === activeExercise);
  const targetReps = aiExercise?.target?.reps || 0;
  const aiNote = aiExercise?.target?.note || "";



  const [seconds, setSeconds] = useState(30);
  const progress = Math.round(
    (exerciseResults.length / workout.exercises.length) * 100
  );


  /* 🎥 CAMERA */
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isRunning || paused) return;

    const t = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current); // 🔴 STOP ML LOOP
          finishExercise();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [isRunning, paused]);



  useEffect(() => {
    setSeconds(currentExercise.duration || 30);
  }, [currentIndex]);






  useEffect(() => {
    if (!isRunning || paused || !activeExercise) return;

    if (HOLD_EXERCISES.includes(activeExercise)) {

      intervalRef.current = setInterval(sendFrame, 200);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, paused, activeExercise]);


  useEffect(() => {
    if (!isRunning || paused || !activeExercise) return;

    const needsCamera =
      activeExercise === "Head Rotation" ||
      !HOLD_EXERCISES.includes(activeExercise);

    if (needsCamera && cameraRef.current) {
      cameraRef.current.start().catch(() => { });
    }

    return () => {
      if (needsCamera && cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, [isRunning, paused, activeExercise]);


  const FRONTEND_ONLY_EXERCISES = [
    "Pushups",
    "Plank",
    "Wall Sit",
    "Superman Hold",
    "Jumping Jacks"
  ];

  const calculateAngle = (a, b, c) => {
    const radians =
      Math.atan2(c.y - b.y, c.x - b.x) -
      Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const calculateRealtimeAccuracy = (
    angle,
    idealMin,
    idealMax,
    posturePenalty = 0
  ) => {
    let score = 100;

    if (angle < idealMin || angle > idealMax) {
      const diff =
        angle < idealMin
          ? idealMin - angle
          : angle - idealMax;

      score -= Math.min(40, diff * 0.8);
    }

    score -= posturePenalty;

    return Math.max(50, Math.min(100, Math.round(score)));
  };

  const onPoseResults = useCallback((results) => {
    if (!results.poseLandmarks) return;
    if (!isRunning || paused) return;
    if (!activeExercise) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const rect = video.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;

    const landmarks = results.poseLandmarks;
    const now = Date.now();
    const debounceDelay = 800;

    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawPoint = (x, y) => {
      ctx.beginPath();
      ctx.arc(x * canvas.width, y * canvas.height, 4, 0, 2 * Math.PI);
      ctx.fillStyle = "#00ff88";
      ctx.fill();
    };

    const drawLine = (a, b) => {
      ctx.beginPath();
      ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
      ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
      ctx.strokeStyle =
        accuracyRef.current > 85
          ? "#00ff88"
          : accuracyRef.current > 70
            ? "#ffaa00"
            : "#ff4444"; ctx.lineWidth = 2;
      ctx.stroke();
    };

    // Draw all points
    // Optional: draw only main joints
    [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach(i => {
      if (landmarks[i]) {
        drawPoint(landmarks[i].x, landmarks[i].y);
      }
    });
    // Draw skeleton connections
    const connections = [
      [11, 12], [11, 13], [13, 15],
      [12, 14], [14, 16],
      [11, 23], [12, 24],
      [23, 24], [23, 25], [25, 27],
      [24, 26], [26, 28]
    ];

    connections.forEach(([a, b]) => {
      if (landmarks[a] && landmarks[b]) {
        drawLine(landmarks[a], landmarks[b]);
      }
    });

    // Face lines (draw once)
    if (landmarks[1] && landmarks[2]) {
      drawLine(landmarks[1], landmarks[2]);
    }
    if (landmarks[0] && landmarks[11]) {
      drawLine(landmarks[0], landmarks[11]);
    }

    // Helper to safely get landmark
    const safe = (i) => landmarks[i] || null;

    // ================= PUSH-UPS =================
    if (activeExercise === "Push-ups") {
      const shoulder = safe(12);
      const elbow = safe(14);
      const wrist = safe(16);

      if (!shoulder || !elbow || !wrist) return;

      const angle = calculateAngle(shoulder, elbow, wrist);
      console.log("Push-up angle:", angle);

      if (angle > 175 && repStageRef.current === "up") {
        if (now - lastPostureSpeakRef.current > 5000) {
          speak("Keep your elbows controlled. Avoid locking arms.", "en");
          lastPostureSpeakRef.current = now;
        }
      }

      const accuracy = calculateRealtimeAccuracy(
        angle,
        80,   // ideal min elbow angle
        170,  // ideal max
        angle > 175 ? 10 : 0
      );

      accuracyRef.current = accuracy;
      setAccuracyScore(accuracy);
      // Initialize stage
      if (!repStageRef.current) {
        repStageRef.current = angle > 150 ? "up" : "down";
      }

      // Going down
      if (angle < 100 && repStageRef.current === "up") {
        repStageRef.current = "down";
        console.log("⬇ PUSH DOWN");
      }

      // Coming up = rep
      if (
        angle > 165 &&
        repStageRef.current === "down" &&
        now - lastRepTimestampRef.current > 700
      ) {
        repStageRef.current = "up";
        lastRepTimestampRef.current = now;
        console.log("⬆ PUSH REP");
        incrementRep();
      }


    }

    // ================= SQUATS =================
    if (activeExercise === "Squats") {
      const hip = safe(24);
      const knee = safe(26);
      const ankle = safe(28);

      if (!hip || !knee || !ankle) return;

      const angle = calculateAngle(hip, knee, ankle);

      // POSTURE CHECK
      if (angle < 70) {
        if (now - lastPostureSpeakRef.current > 5000) {
          speak("Do not bend too deep. Maintain control.", "en");
          lastPostureSpeakRef.current = now;
        }
      }

      const accuracy = calculateRealtimeAccuracy(
        angle,
        90,
        170,
        angle < 70 ? 15 : 0
      );

      accuracyRef.current = accuracy;
      setAccuracyScore(accuracy);
      // Initialize stage if null
      if (!repStageRef.current) {
        repStageRef.current = angle > 150 ? "up" : "down";
      }

      // Going down
      if (angle < 120 && repStageRef.current === "up") {
        repStageRef.current = "down";
        console.log("⬇ DOWN");
      }

      // Coming up = rep
      if (
        angle > 160 &&
        repStageRef.current === "down" &&
        now - lastRepTimestampRef.current > 700
      ) {
        repStageRef.current = "up";
        lastRepTimestampRef.current = now;
        console.log("⬆ REP COUNTED");
        incrementRep();
      }
    }
    // ================= JUMPING JACKS =================
    // ================= JUMPING JACKS =================
    if (activeExercise === "Jumping Jacks") {
      const leftWrist = safe(15);
      const rightWrist = safe(16);
      const head = safe(0);
      const leftAnkle = safe(27);
      const rightAnkle = safe(28);

      if (!leftWrist || !rightWrist || !head || !leftAnkle || !rightAnkle) return;

      const handsUp =
        leftWrist.y < head.y &&
        rightWrist.y < head.y;

      const legsApart =
        Math.abs(leftAnkle.x - rightAnkle.x) > 0.25;

      // Initialize stage
      if (!repStageRef.current) {
        repStageRef.current = "down";
      }

      // Up position (arms up + legs apart)
      if (handsUp && legsApart && repStageRef.current === "down") {
        repStageRef.current = "up";
        console.log("⬆ JACK UP");
      }

      // Down position = rep
      if (
        !handsUp &&
        !legsApart &&
        repStageRef.current === "up" &&
        now - lastRepTimestampRef.current > 600
      ) {
        repStageRef.current = "down";
        lastRepTimestampRef.current = now;
        console.log("⬇ JACK REP");
        incrementRep();
      }
    }

    // ================= HEAD ROTATION =================
    if (activeExercise === "Head Rotation") {
      const nose = safe(0);
      const leftShoulder = safe(11);
      const rightShoulder = safe(12);

      if (!nose || !leftShoulder || !rightShoulder) return;

      const shoulderCenterX =
        (leftShoulder.x + rightShoulder.x) / 2;

      const diff = nose.x - shoulderCenterX;

      // sensitivity threshold
      const threshold = 0.04;

      if (!repStageRef.current) {
        repStageRef.current = "center";
      }

      // Turn left
      if (diff < -threshold && repStageRef.current === "center") {
        repStageRef.current = "left";
        console.log("Head Left");
      }

      // Turn right
      if (diff > threshold && repStageRef.current === "left") {
        repStageRef.current = "right";
        console.log("Head Right");
      }

      // Back to center = 1 rep
      if (
        Math.abs(diff) < threshold &&
        repStageRef.current === "right" &&
        Date.now() - lastRepTimestampRef.current > 800
      ) {
        repStageRef.current = "center";
        lastRepTimestampRef.current = Date.now();
        console.log("Head Rotation REP");
        incrementRep();
      }
    }

    // ================= IDLE DETECTION =================
    const idleTime = now - lastMovementTimeRef.current;

    if (
      idleTime > 4000 &&
      now - lastCoachSpeakRef.current > 6000
    ) {
      speak("You are being idle. Please continue the exercise.", "en");
      lastCoachSpeakRef.current = now;
    }

  }, [activeExercise, isRunning, paused]);

  const incrementRep = () => {
    setData(prev => {
      const prevReps = prev?.reps || 0;
      const newReps = prevReps + 1;

      // 🔊 Speak rep number
      if (newReps !== lastSpokenRepRef.current) {
        speak(`${newReps}`, "en");
        lastSpokenRepRef.current = newReps;
        lastRepTimeRef.current = Date.now();
        lastMovementTimeRef.current = Date.now();
      }

      const heart_rate = Math.min(170, 90 + newReps * 1.2);

      const updated = {
        reps: newReps,
        calories: Number((newReps * 0.5).toFixed(2)),
        heart_rate,
        breath_rate: (14 + newReps * 0.3).toFixed(1),
        spo2: (97 - Math.min(2, newReps * 0.05)).toFixed(1),
        skin_temp: (36.5 + newReps * 0.02).toFixed(2),
        bp: `${110 + Math.floor(heart_rate * 0.4)}/${70 + Math.floor(heart_rate * 0.25)}`,
        fatigue: Math.min(100, newReps * 2),
        stress: Math.min(100, 30 + newReps),
        intensity:
          heart_rate < 110
            ? "Low"
            : heart_rate < 140
              ? "Moderate"
              : "High",
        accuracy: accuracyRef.current,
      };

      lastMetricsRef.current = updated;
      return updated;
    });
  };

  useEffect(() => {
    if (!videoRef.current) return;

    const pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults(onPoseResults);

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (poseRef.current) {
          await poseRef.current.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });

    poseRef.current = pose;
    cameraRef.current = camera;

    return () => {
      try {
        camera.stop();
      } catch { }
    };
  }, [onPoseResults]);


  const HOLD_EXERCISES = [
    "Plank",
    "Wall Sit",
    "Superman Hold"
  ];

  const sendFrame = async () => {
    if (!activeExercise) return;


    // Hold exercises only
    if (HOLD_EXERCISES.includes(activeExercise)) {
      handleSimulatedWorkout();
      return;
    }

    // Pose exercises do nothing here
  };


  const handleHeadRotationML = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const form = new FormData();
      form.append("file", blob);
      form.append("exercise", activeExercise);
      form.append("weight", weight);
      form.append("height_cm", height);
      form.append("age", age);

      try {
        const res = await fetch(`${FITNESS_API}/ml/analyze`, {
          method: "POST",
          body: form,
        });

        const response = await res.json();
        console.log("Full ML response:", response);


        if (!response || response.error) return;

        const d = response.metrics || response;

        // 🔥 Store safely
        lastMetricsRef.current = d;
        setData(d);

        // 🔥 Session stats
        setSessionStats(prev => ({
          maxHR: Math.max(prev.maxHR, d.heart_rate || 0),
          totalReps: d.reps ?? prev.totalReps,
          avgStress:
            ((prev.avgStress * prev.samples) + (d.stress || 0)) /
            (prev.samples + 1),
          samples: prev.samples + 1,
        }));

        const reps = d.reps ?? 0;
        const posture = d.posture ?? null;
        const fatigue = d.fatigue ?? 0;

        const now = Date.now();
        const timeSinceStart = now - exerciseStartTimeRef.current;
        const timeSinceLastRep = now - lastRepTimeRef.current;
        const timeSinceCoach = now - lastCoachSpeakRef.current;

        /* ✅ REP DETECTION */
        if (reps > lastSpokenRepRef.current) {
          speak(`${reps}`, "en");

          lastSpokenRepRef.current = reps;
          lastRepTimeRef.current = now;
          lastMovementTimeRef.current = now;
          lastCoachSpeakRef.current = now;
        }

        /* 🗣️ IDLE FEEDBACK */
        if (
          timeSinceStart > 4000 &&
          timeSinceLastRep > 4000 &&
          timeSinceCoach > 6000
        ) {
          speak(
            `You paused. Continue ${activeExercise} when ready.`,
            "en"
          );
          lastCoachSpeakRef.current = now;
        }

        /* 🗣️ WRONG EXECUTION */
        if (
          reps === lastSpokenRepRef.current &&
          timeSinceLastRep > 3000 &&
          timeSinceLastRep < 7000 &&
          timeSinceCoach > 8000
        ) {
          speak(
            "Slow down. Focus on proper range and control.",
            "en"
          );
          lastCoachSpeakRef.current = now;
        }

        /* 🗣️ POSTURE CHECK */
        if (
          posture === "bad" &&
          reps > 0 &&
          reps % 3 === 0 &&
          now - lastPostureSpeakRef.current > 4000
        ) {
          speak("Adjust your posture", "en");
          lastPostureSpeakRef.current = now;
        }

        /* 🗣️ FATIGUE CHECK */
        if (
          fatigue > 80 &&
          now - lastFatigueSpeakRef.current > 6000
        ) {
          speak("You seem tired. Take a short rest if needed.", "en");
          lastFatigueSpeakRef.current = now;
        }

      } catch (err) {
        console.error("ML Error:", err);

        if (Date.now() - lastCoachSpeakRef.current > 8000) {
          speak("Camera connection issue. Adjust position.", "en");
          lastCoachSpeakRef.current = Date.now();
        }
      }
    }, "image/jpeg");
  };

  const handleSimulatedWorkout = () => {
    const now = Date.now();
    const elapsedSeconds = Math.floor(
      (now - exerciseStartTimeRef.current) / 1000
    );

    setData(prev => {
      const prevData = prev && typeof prev === "object" ? prev : {};

      // ================= HOLD EXERCISES =================
      if (HOLD_EXERCISES.includes(activeExercise)) {

        const heart_rate = Math.min(
          160,
          85 + elapsedSeconds * 1.5
        );

        const simulated = {
          reps: 0, // ❌ No reps for hold exercises
          calories: Number((elapsedSeconds * 0.3).toFixed(2)),
          heart_rate: Math.floor(heart_rate),
          breath_rate: (14 + Math.random() * 3).toFixed(1),
          spo2: (96 + Math.random() * 1.5).toFixed(1),
          skin_temp: (36.5 + Math.random() * 0.3).toFixed(2),
          bp: `${100 + Math.floor(heart_rate * 0.4)}/${70 + Math.floor(heart_rate * 0.25)}`,
          intensity:
            heart_rate < 110
              ? "Low"
              : heart_rate < 140
                ? "Moderate"
                : "High",
          fatigue: Math.min(100, elapsedSeconds * 3),
          stress: Math.min(100, 30 + elapsedSeconds * 1.5),
        };

        lastMetricsRef.current = simulated;
        return simulated;
      }

      // ================= NORMAL (REPS BASED) =================
      const repInterval =
        activeExercise === "Jumping Jacks" ? 1 : 2;

      const newReps = Math.floor(elapsedSeconds / repInterval);

      const heart_rate = Math.min(
        170,
        90 + Math.floor(newReps * 1.3)
      );

      const simulated = {
        reps: newReps,
        calories: Number((newReps * 0.5).toFixed(2)),
        heart_rate,
        breath_rate: (12 + Math.random() * 4).toFixed(1),
        spo2: (96 + Math.random() * 2).toFixed(1),
        skin_temp: (36.4 + Math.random() * 0.3).toFixed(2),
        bp: `${100 + Math.floor(heart_rate * 0.4)}/${70 + Math.floor(heart_rate * 0.25)}`,
        intensity:
          heart_rate < 110
            ? "Low"
            : heart_rate < 140
              ? "Moderate"
              : "High",
        fatigue: Math.min(100, newReps * 2),
        stress: Math.min(100, 30 + newReps),
      };

      lastMetricsRef.current = simulated;
      return simulated;
    });
  };

  const finishExercise = async () => {
    if (finishLock.current) return;   // 🚫 hard lock
    finishLock.current = true;   // � lock during finish
    if (cameraRef.current) {
      cameraRef.current.stop();
    }
    setExerciseDone(true);
    setIsRunning(false);
    clearInterval(intervalRef.current);


    await fetch(`${FITNESS_API}/ml/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exercise: activeExercise })
    });

    const final = lastMetricsRef.current || {};

    setExerciseResults(prev => [
      ...prev,
      {
        name: activeExercise,
        reps: final.reps || 0,
        target: targetReps,
        calories: final.calories || 0,
        hr: final.heart_rate || 0,
        fatigue: final.fatigue || 0,
        stress: final.stress || 0
      }
    ]);

    const accuracy = final.accuracy || 0;

    if (accuracy >= 90) {
      speak("Excellent form. You nailed it.", "en");
    } else if (accuracy >= 70) {
      speak("Good effort. Try to improve your posture.", "en");
    } else {
      speak("Focus on your form. Slow down and maintain structure.", "en");
    }


    console.log("🏁 Finished:", activeExercise, data);

  };

  const repeatExercise = async () => {
    if (!activeExercise) return;

    console.log("🔁 Repeating:", activeExercise);

    // 🔴 STOP EVERYTHING FIRST
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setPaused(false);

    // 🔄 RESET FRONTEND STATE
    resetExerciseState();
    setExerciseDone(false);
    setData(null);
    setSeconds(30);

    // 🔄 RESET ML BACKEND
    await fetch(`${FITNESS_API}/ml/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exercise: activeExercise })
    });

    // 🟢 RESTART CLEAN
    setTimeout(() => {
      setIsRunning(true);
    }, 300); // tiny delay avoids race condition
  };


  const resetExerciseState = () => {
    lastMetricsRef.current = null;
    finishLock.current = false;

    lastSpokenRepRef.current = 0;
    lastRepTimeRef.current = Date.now();
    lastMovementTimeRef.current = Date.now();

    lastIdleSpeakRef.current = 0;
    lastWrongSpeakRef.current = 0;
    lastPostureSpeakRef.current = 0;
    lastFatigueSpeakRef.current = 0;
    lastCoachSpeakRef.current = 0;

    exerciseStartTimeRef.current = Date.now();
  };

  const shutdownCameraSystem = () => {
    console.log("🛑 Shutting down camera system...");

    // Stop MediaPipe camera
    if (cameraRef.current) {
      try {
        cameraRef.current.stop();
      } catch (e) {
        console.log("Camera already stopped");
      }
    }

    // Stop pose processing
    if (poseRef.current) {
      try {
        poseRef.current.close();
      } catch (e) {
        console.log("Pose already closed");
      }
    }

    // Stop interval loop
    clearInterval(intervalRef.current);

    // Stop raw video stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    setIsRunning(false);
    setPaused(false);
  };


  const finishWorkout = async () => {
    try {
      shutdownCameraSystem();
      const token = localStorage.getItem("titan_token");

      await axios.post(
        `${FITNESS_API}/workouts`,
        {
          workoutName: workout.name,
          duration: workout.duration,
          accuracy: data?.accuracy || 90,
          exercises: exerciseResults,
          vitals: data,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      navigate("/workout-complete");
    } catch (err) {
      console.error("Workout save failed", err);
      alert("Failed to save workout");
    }
  };

  const isHoldExercise = HOLD_EXERCISES.includes(activeExercise);

  const elapsedSeconds = Math.floor(
    (Date.now() - exerciseStartTimeRef.current) / 1000
  );


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-950 text-white flex flex-col">

      {/* ================= TOP BAR ================= */}
      <div className="flex items-center justify-between px-6 py-4">
        <X
          className="opacity-80 cursor-pointer"
          onClick={() => {
            const ok = window.confirm(
              "Workout not completed. Progress will not be saved. Exit?"
            );
            if (ok) {
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
              }
              navigate("/workouts");
            }
          }}
        />
        {/* <Volume2 className="opacity-80 cursor-pointer" /> */}
      </div>

      {/* FEEDBACK */}
      <div className="mx-6 mb-4 bg-purple-600 rounded-xl py-2 text-center text-sm font-medium">
        Perfect tempo, maintain it!
      </div>

      <div className="flex flex-wrap gap-2 justify-center px-4 mb-4 ms-10">
        {workout.exercises.map(name => (
          <button
            key={name}
            onClick={() => {
              if (cameraRef.current) {
                cameraRef.current.stop();
                cameraRef.current.started = false;
              }
              const index = workout.exercises.indexOf(name);
              setCurrentIndex(index);
              setActiveExercise(name);
              setSeconds(30);
              setIsRunning(false);
              setExerciseDone(false);
              repStageRef.current = null;
              accuracyRef.current = 100;
              setAccuracyScore(100);
              finishLock.current = false;   // 🔓 unlock for next exercise

              lastSpokenRepRef.current = 0;
              exerciseSpokenRef.current = false;

              lastMovementTimeRef.current = Date.now();
              lastIdleSpeakRef.current = 0;
              lastWrongSpeakRef.current = 0;
              lastSpokenRepRef.current = 0;
              exerciseStartTimeRef.current = Date.now();
              lastPostureSpeakRef.current = 0;
              lastFatigueSpeakRef.current = 0;


              speak(`${name} selected. Get ready.`, "en");


              fetch(`${FITNESS_API}/ml/reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ exercise: name })
              });
            }}

            className={`px-3 py-1 rounded-full text-xs border
        ${activeExercise === name
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600"}
      `}
          >
            {name}
          </button>
        ))}
      </div>


      {/* ================= CAMERA ================= */}
      <div className="flex-1 flex  gap-20 items-center justify-center">

        <div className="bg-white/10 rounded-xl p-4 w-64">
          <h3 className="text-sm font-semibold mb-2">AI Coach Target</h3>

          <p className="text-xs text-gray-300">
            {aiNote}
          </p>

          <div className="mt-3 flex justify-between text-sm">
            <span>Target</span>
            <span className="font-bold">
              {isHoldExercise ? `${targetReps} sec` : `${targetReps} reps`}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span>You</span>
            <span className="font-bold text-purple-400">
              {isHoldExercise
                ? `${elapsedSeconds} sec`
                : `${data?.reps || 0} reps`}
            </span>
          </div>
        </div>

        <div className="relative w-[420px] h-[320px]">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="absolute top-0 left-0 w-full h-full object-cover rounded-xl border border-purple-500/40"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
        </div>
        {/* ================= AI LIVE METRICS ================= */}
        {data && typeof data === "object" && (
          <div className="grid grid-cols-3 gap-3 mb-6 text-center">

            {!HOLD_EXERCISES.includes(activeExercise) && (
              <Metric label="Reps" value={data.reps} />
            )}            <Metric label="Calories" value={`${data.calories} kcal`} />
            <Metric label="HR" value={`${data.heart_rate} bpm`} />

            <Metric label="Breath" value={`${data.breath_rate} bpm`} />
            <Metric label="SpO₂" value={`${data.spo2}%`} />
            <Metric label="Temp" value={`${data.skin_temp}°C`} />

            <Metric label="BP" value={data.bp} />
            <Metric label="Fatigue" value={data.fatigue} />
            <Metric label="Stress" value={data.stress} />

            <div className="col-span-3 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium
        ${data.intensity === "Low" && "bg-green-100 text-green-700"}
        ${data.intensity === "Moderate" && "bg-yellow-100 text-yellow-700"}
        ${data.intensity === "High" && "bg-red-100 text-red-700"}
      `}
              >
                Intensity: {data.intensity}
              </span>
            </div>

          </div>
        )}
      </div>

      {/* ================= BOTTOM PANEL ================= */}
      <div className="bg-white text-gray-900 rounded-t-3xl px-6 py-6">

        {/* PROGRESS */}
        <div className="flex justify-between text-xs mb-2">
          <span>
            Exercise {currentIndex + 1} of {workout.exercises.length}
          </span>
          <span>{progress}%</span>
        </div>

        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-teal-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* EXERCISE INFO */}
        <h2 className="text-lg font-semibold text-center">
          {currentExercise.name}
        </h2>

        <p className="text-sm text-gray-500 text-center mb-6">
          {currentExercise.instructions}
        </p>


        {/* TIMER */}
        {!isRunning ? (
          <button
            disabled={!activeExercise}
            onClick={() => {
              setData({
                reps: 0,
                calories: 0,
                heart_rate: 90,
                breath_rate: "14.0",
                spo2: "98.0",
                skin_temp: "36.5",
                bp: "110/70",
                fatigue: 0,
                stress: 30,
                intensity: "Low"
              });
              console.log("▶ START:", activeExercise);
              setIsRunning(true);
              setPaused(false);
              setExerciseDone(false);

              exerciseStartTimeRef.current = Date.now();
              lastMovementTimeRef.current = Date.now();

              speak("Start now. Maintain proper posture.", "en");

            }}
            className={`w-96 py-3 rounded-xl flex justify-center items-center mx-auto mt-4
    ${activeExercise ? "bg-purple-600 text-white" : "bg-gray-300 text-gray-500"}
  `}
          >
            ▶ Start {activeExercise || "Select an exercise"}
          </button>


        ) : (
          <div className="text-center">
            <p className="text-5xl font-bold text-purple-600">{seconds}</p>
            <p className="text-sm text-gray-500">seconds</p>
          </div>
        )}





        {/* CONTROLS */}
        <div className="flex items-center justify-center gap-4 mt-5">

          {/* Finish Exercise */}
          <button
            onClick={finishExercise}
            className="w-40 py-2 border rounded-xl mt-3"
          >
            Finish Exercise
          </button>

          {/* Pause OR Repeat */}
          {isRunning ? (
            <button
              onClick={() => {
                setPaused(p => {
                  if (!p) clearInterval(intervalRef.current);
                  return !p;
                });
              }}
              className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center text-white"
            >
              <Pause />
            </button>
          ) : (
            <button
              onClick={repeatExercise}
              disabled={!activeExercise}
              className="w-14 h-14 border border-purple-400 text-purple-600 rounded-full flex items-center justify-center hover:bg-purple-50"
            >
              🔁
            </button>
          )}

          {/* Finish Workout */}
          <button
            disabled={exerciseResults.length === 0}
            onClick={finishWorkout}
            className="w-40 py-3 bg-purple-600 text-white rounded-xl mt-4 disabled:opacity-50"
          >
            Finish Workout
          </button>

        </div>

      </div>
    </div>
  );
}


const Metric = ({ label, value }) => (
  <div className="bg-gray-100 rounded-lg py-2">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold text-purple-600">{value}</p>
  </div>
);
