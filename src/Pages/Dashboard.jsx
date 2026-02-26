import React from "react";
import {
  Flame,
  Play,
  ChevronRight,
  BarChart3,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useEffect, useState } from "react";
import { FITNESS_API } from "../utils/api";
import { sampleWorkouts } from "../data/workouts";



export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const profile = user?.profile;


  console.log(user);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("titan_token");
      if (!token) return;

      const res = await axios.get(
        `${FITNESS_API}/workouts/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setStats(res.data);
    };

    fetchStats();
  }, []);

  const weeklyGoal = 5;
  const workoutsDone = stats?.workoutsCount || 0;
  const workoutsPercent = Math.min(
    100,
    Math.round((workoutsDone / weeklyGoal) * 100)
  );


  const calorieGoal = 2000;
  const caloriesBurned = stats?.totalCalories || 0;
  const caloriesPercent = Math.min(
    100,
    Math.round((caloriesBurned / calorieGoal) * 100)
  );

  const calculateStreak = (workouts = []) => {
    if (workouts.length === 0) return 0;

    // Get unique workout dates (yyyy-mm-dd)
    const dates = Array.from(
      new Set(
        workouts.map(w =>
          new Date(w.createdAt).toISOString().split("T")[0]
        )
      )
    ).sort((a, b) => new Date(b) - new Date(a)); // newest first

    let streak = 0;
    let current = new Date();

    for (let date of dates) {
      const d = new Date(date);

      // normalize both dates (remove time)
      d.setHours(0, 0, 0, 0);
      current.setHours(0, 0, 0, 0);

      if (d.getTime() === current.getTime()) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  // Simple smart recommendation logic
  const recommendedWorkout =
    sampleWorkouts.find(w => w.difficulty === profile?.fitnessLevel) ||
    sampleWorkouts[0];

  const streak = calculateStreak(stats?.workouts || []);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-teal-500 rounded-b-3xl px-6 pt-6 pb-10 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm opacity-90">Welcome back,</p>
            <h2 className="text-2xl font-semibold">
              {user?.name || "Athlete"} 👋
            </h2>

          </div>

          <div className="bg-white/20 px-4 py-2 rounded-full text-sm">
            🔥  {streak} day streak
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatCard value={profile?.goal} label="Goal" />
          <StatCard value={profile?.fitnessLevel} label="Level" />
          <StatCard value={`${profile?.weight || 0} kg`} label="Weight" />

        </div>
      </div>

      {/* CONTENT */}
      <div className="px-6 -mt-6 space-y-6">

        {/* Recommendation */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            {recommendedWorkout.name}
          </h3>

          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
            <span>⏱ {recommendedWorkout.duration} min</span>
            <span>🔥 {recommendedWorkout.calories} cal</span>
            <span>⚡ {recommendedWorkout.difficulty}</span>
          </div>

          <button
            onClick={() => navigate(`/workouts/${recommendedWorkout.id}`)}
            className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white"
          >
            <Play size={18} />
          </button>


        </div>

        {/* Weekly Progress */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Weekly Progress</h3>
            <button
              onClick={() => navigate("/progress")}
              className="text-sm text-purple-600 flex items-center gap-1"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>

          <ProgressRow
            label="Workouts Completed"
            value={`${workoutsDone}/${weeklyGoal}`}
            percent={workoutsPercent}
          />

          <ProgressRow
            label="Calories Goal"
            value={`${Math.round(caloriesBurned)}/${calorieGoal}`}
            percent={caloriesPercent}
          />

        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <QuickCard
            icon={<BarChart3 />}
            title="View Progress"
            subtitle="Track your gains"
            onClick={() => navigate("/progress")}
          />
          <QuickCard
            icon={<Sparkles />}
            title="AI Coach"
            subtitle="Get advice"
            onClick={() => navigate("/coach")}
          />
        </div>

        {/* Explore Workouts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Explore Workouts</h3>
            <button
              onClick={() => navigate("/workouts")}
              className="text-sm text-purple-600 flex items-center gap-1"
            >
              See All <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {sampleWorkouts.slice(0, 4).map((workout) => (
              <WorkoutCard
                key={workout.id}
                title={workout.name}
                meta={`${workout.duration} min • ${workout.difficulty}`}
                onClick={() => navigate(`/workouts/${workout.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


/* ================= COMPONENTS ================= */

const StatCard = ({ icon, value, label }) => (
  <div className="bg-white/20 rounded-xl p-4 text-center">
    <div className="flex justify-center mb-2">{icon}</div>
    <p className="text-xl font-semibold">{value}</p>
    <p className="text-xs opacity-90">{label}</p>
  </div>
);

const ProgressRow = ({ label, value, percent }) => (
  <div className="mb-4">
    <div className="flex justify-between text-sm mb-2">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>

    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-purple-600 to-teal-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  </div>
);

const QuickCard = ({ icon, title, subtitle, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition"
  >
    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  </div>
);

const WorkoutCard = ({ title, meta, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition"
  >
    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-3">
      ⏱
    </div>
    <p className="font-medium text-sm">{title}</p>
    <p className="text-xs text-gray-500 mt-1">{meta}</p>
  </div>
);

