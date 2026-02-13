import React, { useEffect, useRef, useState } from "react";
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
  const [data, setData] = useState("Waiting for data…");
  const [paused, setPaused] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [exerciseResults, setExerciseResults] = useState([]);
  const [exerciseDone, setExerciseDone] = useState(false);




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

    intervalRef.current = setInterval(sendFrame, 200);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, paused, activeExercise, height, weight, age]);



  const sendFrame = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

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

        const d = await res.json();
        lastMetricsRef.current = d;   // 💾 store latest good ML frame
        console.log("📥 ML response:", d);

        setData(d);

        setSessionStats(prev => ({
          maxHR: Math.max(prev.maxHR, d.heart_rate || 0),
          totalReps: d.reps || prev.totalReps,
          avgStress:
            ((prev.avgStress * prev.samples) + (d.stress || 0)) /
            (prev.samples + 1),
          samples: prev.samples + 1,
        }));

        console.log("📤 Sending frame", activeExercise);
        const reps = d.reps || 0;
        const posture = d.posture;   // expected: "good" | "bad"
        const fatigue = d.fatigue || 0;

        const now = Date.now();
        const intensity = d.intensity;
        const calories = d.calories || 0;

        /* ✅ Detect actual movement */
        const meaningfulMovement =
          reps > lastSpokenRepRef.current;


        if (meaningfulMovement) {
          lastMovementTimeRef.current = now;
        }


        /* 🗣️ USER NOT MOVING (IDLE > 5s) */
        const timeSinceStart = now - exerciseStartTimeRef.current;
        const timeSinceLastRep = now - lastRepTimeRef.current;
        const timeSinceCoach = now - lastCoachSpeakRef.current;

        if (
          timeSinceStart > 4000 &&
          timeSinceLastRep > 4000 &&   // 👈 ONLY after 3 sec idle
          timeSinceCoach > 6000
        ) {
          speak(
            `You paused. Continue ${activeExercise} when ready.`,
            "en"
          );

          lastCoachSpeakRef.current = now;
        }


        if (reps > lastSpokenRepRef.current) {
          speak(`${reps}`, "en");

          lastSpokenRepRef.current = reps;
          lastRepTimeRef.current = now;
          lastMovementTimeRef.current = now;

          // Coach cooldown after valid rep
          lastCoachSpeakRef.current = now;
        }




        /* 🗣️ WRONG EXECUTION (moving but not correct) */
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


        /* 🗣️ POSTURE FEEDBACK (every 3 reps, max once per 4s) */
        if (
          posture === "bad" &&
          reps > 0 &&
          reps % 3 === 0 &&
          now - lastPostureSpeakRef.current > 4000
        ) {
          speak("Adjust your posture", "en");
          lastPostureSpeakRef.current = now;
        }

        /* 🗣️ FATIGUE FEEDBACK (max once per 6s) */
        if (
          fatigue > 80 &&
          now - lastFatigueSpeakRef.current > 6000
        ) {
          speak("You seem tired. Take a short rest if needed.", "en");
          lastFatigueSpeakRef.current = now;
        }


      } catch (err) {
        console.error(err);
        if (Date.now() - lastCoachSpeakRef.current > 8000) {
  speak("Camera connection issue. Adjust position.", "en");
  lastCoachSpeakRef.current = Date.now();
}

      }
    }, "image/jpeg");
  };


  const finishExercise = async () => {
    if (finishLock.current) return;   // 🚫 hard lock
    finishLock.current = true;   // � lock during finish
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
    setData("Waiting for data…");
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


  const finishWorkout = async () => {
    try {
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
              const index = workout.exercises.indexOf(name);
              setCurrentIndex(index);
              setActiveExercise(name);
              setSeconds(30);
              setIsRunning(false);
              setExerciseDone(false);
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
            <span className="font-bold">{targetReps} reps</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>You</span>
            <span className="font-bold text-purple-400">
              {data.reps || 0} reps
            </span>
          </div>
        </div>

        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="rounded-xl w-[420px] h-[320px] object-cover border border-purple-500/40"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center opacity-80">
              <div className="mx-auto w-10 h-10 border-2 border-purple-500 rounded-full mb-2" />
              <p className="text-sm">Camera Preview</p>
              <p className="text-xs text-gray-400">
                AI tracking your form
              </p>
            </div>
          </div>
        </div>
        {/* ================= AI LIVE METRICS ================= */}
        {data && typeof data === "object" && (
          <div className="grid grid-cols-3 gap-3 mb-6 text-center">

            <Metric label="Reps" value={data.reps} />
            <Metric label="Calories" value={`${data.calories} kcal`} />
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
