import React from "react";
import { Play } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { sampleWorkouts } from "../data/workouts";


export default function WorkoutDetails() {
  const { id } = useParams();
  const workout = sampleWorkouts.find(w => w.id === id);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 to-teal-500 text-white p-6 rounded-b-3xl">
        <button onClick={() => navigate(-1)} className="text-sm opacity-90 mb-2">← Back</button>
        <h1 className="text-xl font-semibold">Get ready to train</h1>
        <p className="opacity-90">{workout.name}</p>

        <div className="flex gap-4 text-sm mt-2">
          <span>⏱ {workout.duration} min</span>
          <span>🔥 {workout.calories} cal</span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6 space-y-6 flex-1">

        <Section title="Warm-up Suggestions">
          <li>5 minutes of light cardio</li>
          <li>Stretch major muscle groups</li>
          <li>Stay hydrated</li>
        </Section>

        <Section title="Safety Reminders" danger>
          <li>Listen to your body</li>
          <li>Maintain proper form</li>
          <li>Take breaks if needed</li>
        </Section>

        <Section title="Today's Exercises">
          {workout.exercises.map((name, i) => (
            <div key={name} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg">
              <span className="w-6 h-6 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full text-xs">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-sm">{name}</p>
                <p className="text-xs text-gray-500">
                  AI-tracked exercise
                </p>
              </div>
            </div>
          ))}

        </Section>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate(`/live/${workout.id}`)}
        className="m-6 py-3 bg-purple-600 text-white rounded-xl flex items-center justify-center gap-2">
        <Play size={16} /> Start Workout
      </button>
    </div>
  );
}

const Section = ({ title, children, danger }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm">
    <h3 className={`font-semibold mb-3 ${danger && "text-red-600"}`}>
      {title}
    </h3>
    <ul className="space-y-2 text-sm text-gray-600">
      {children}
    </ul>
  </div>
);
