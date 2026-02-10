import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Trophy,
  Flame,
  Clock,
  Activity,
  ArrowLeft,
  RefreshCw
} from "lucide-react";
import axios from "axios";
import { useEffect, useState } from "react";


export default function WorkoutComplete() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const [workout, setWorkout] = useState(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      const token = localStorage.getItem("titan_token");

      const res = await axios.get(
        "http://localhost:5000/workouts/latest",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setWorkout(res.data);
    };

    fetchWorkout();
  }, []);


  const exercises = workout?.exercises || [];
  const vitals = workout?.vitals || {};
  const workoutName = workout?.workoutName || "Workout";
  const accuracy = workout?.accuracy || 0;
  const duration = workout?.duration || 0;


  const totalReps = exercises.reduce((s, e) => s + e.reps, 0);
  const calories = exercises.reduce((s, e) => s + e.calories, 0);

  const improvements = exercises
    .filter(e => e.reps < e.target)
    .map(e => `Increase ${e.name} reps to ${e.target}`);
  const coachNote =
    improvements.length === 0
      ? "Amazing! You hit all your AI targets 💪"
      : "Good job! Focus on the highlighted areas to improve your strength & mobility.";



  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 to-teal-500 text-white py-10 text-center rounded-b-3xl">
        <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
          <Trophy />
        </div>
        <h1 className="text-xl font-semibold">Workout Complete! 🎉</h1>
        <p className="text-sm opacity-90">{workoutName}</p>
      </div>

      {/* STATS */}
      <div className="max-w-5xl mx-auto px-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Stat icon={<Activity />} value={totalReps} label="Total Reps" />
        <Stat icon={<Flame />} value={calories} label="Calories Burned" />
        <Stat icon={<Activity />} value={`${accuracy}%`} label="Form Accuracy" />
        <Stat icon={<Clock />} value={`${duration}`} label="Minutes" />
        {exercises.map((e, i) => (
          <div key={`${e.name}-${i}`} className="bg-white p-4 rounded-xl">
            <h3 className="font-semibold">{e.name}</h3>
            <p>Reps: {e.reps}</p>
            <p>Calories: {e.calories}</p>
            <p>HR: {e.hr}</p>
            <p>Fatigue: {e.fatigue}</p>
            <p>Stress: {e.stress}</p>
          </div>
        ))}

      </div>



      <Section title="Body Metrics">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>❤️ Heart Rate: {vitals.heart_rate} bpm</div>
          <div>🫁 Breath Rate: {vitals.breath_rate}</div>
          <div>🩸 SpO₂: {vitals.spo2}%</div>
          <div>🌡 Skin Temp: {vitals.skin_temp}°C</div>
          <div>💉 BP: {vitals.bp}</div>
          <div>⚡ Intensity: {vitals.intensity}</div>
        </div>
      </Section>


      {/* FORM ANALYSIS */}
      <Section title="Form Analysis">
        <p className="text-sm mb-2">Overall Form</p>
        <ProgressBar percent={accuracy} />
      </Section>

      {/* IMPROVEMENTS */}
      <Section title="Areas to Improve">
        {improvements.map(i => (
          <div
            key={i}
            className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg"
          >
            • {i}
          </div>
        ))}
      </Section>

      {/* COACH NOTE */}
      <Section title="Coach’s Note" soft>
        <p className="text-sm text-gray-600">{coachNote}</p>
      </Section>

      {/* ACTIONS */}
      <div className="max-w-5xl mx-auto px-6 mt-8 space-y-3">
        <button
          onClick={() => navigate("/")}
          className="w-full py-3 bg-purple-600 text-white rounded-xl flex items-center justify-center gap-2"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <button
          onClick={() => navigate("/workouts")}
          className="w-full py-3 border rounded-xl flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} /> Start Another Workout
        </button>
      </div>
    </div>
  );
}

/* ---------- UI PARTS ---------- */

const Stat = ({ icon, value, label }) => (
  <div className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-sm">
    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  </div>
);

const Section = ({ title, children, soft }) => (
  <div
    className={`max-w-5xl mx-auto px-6 mt-6 bg-white rounded-xl p-5 shadow-sm ${soft && "bg-purple-50"
      }`}
  >
    <h3 className="font-semibold mb-3">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const ProgressBar = ({ percent }) => (
  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
    <div
      className="h-full bg-gradient-to-r from-purple-600 to-teal-500"
      style={{ width: `${percent}%` }}
    />
  </div>
);
