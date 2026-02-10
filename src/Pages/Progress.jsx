import React, { useState, useEffect } from "react";
import {
  Flame,
  Activity,
  Target,
  Check,
  Award,
  TrendingUp
} from "lucide-react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";


export default function Progress() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("titan_token");

      const res = await axios.get(
        "http://localhost:5000/workouts/stats",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setStats(res.data);
      console.log(res.data)
    };

    fetchStats();
  }, []);

  const chartData = stats?.workouts
    ?.slice()
    .reverse()
    .map(w => ({
      date: new Date(w.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      calories: w.totalCalories,
    })) || [];

  const accuracy = stats?.avgAccuracy || 0;

  const endurance = Math.min(
    100,
    Math.round((stats?.totalCalories || 0) / 10)
  );

  const consistency = Math.min(
    100,
    Math.round(((stats?.workoutsCount || 0) / 7) * 100)
  );

  // 🗓️ Days where user did workouts (0 = Sun, 1 = Mon, ...)
  const workoutDays = new Set(
    stats?.workouts?.map(w =>
      new Date(w.createdAt).getDay()
    ) || []
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

  const streak = calculateStreak(stats?.workouts || []);





  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold">Your Progress</h1>
        <p className="text-sm text-gray-500">
          Track your fitness journey
        </p>
      </div>

      {/* STREAK CARD */}
      <div className="bg-gradient-to-r from-purple-600 to-teal-500 rounded-2xl p-6 text-white flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mt-1">
            {streak} {streak === 1 ? "Day" : "Days"}
          </h2>

          <p className="text-sm opacity-90 mt-3">
            {streak === 0
              ? "Start a workout today 🚀"
              : streak < 3
                ? "Good start, keep going 💪"
                : streak < 7
                  ? "Nice streak! 🔥"
                  : "Beast mode activated 🏆"}
          </p>

        </div>
        <Award className="opacity-40" size={48} />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Activity />} value={stats?.workoutsCount || 0} label="Workouts" />
        <StatCard icon={<Flame />} value={stats?.totalCalories || 0} label="Calories" />
        <StatCard icon={<Target />} value={`${stats?.avgAccuracy || 0}%`} label="Accuracy" />

      </div>

      {/* WEEKLY ACTIVITY */}
      <Card title="Weekly Activity">
        <div className="flex justify-between items-center">
          {[
            { label: "Mon", day: 1 },
            { label: "Tue", day: 2 },
            { label: "Wed", day: 3 },
            { label: "Thu", day: 4 },
            { label: "Fri", day: 5 },
            { label: "Sat", day: 6 },
            { label: "Sun", day: 0 },
          ].map(({ label, day }) => {
            const didWorkout = workoutDays.has(day);

            return (
              <div key={label} className="flex flex-col items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center
              ${didWorkout
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-400"}`}
                >
                  {didWorkout && <Check size={14} />}
                </div>
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            );
          })}
        </div>
      </Card>


      {/* PERFORMANCE */}
      <Card title="Performance Improvement">
        <ProgressRow
          label="Form Accuracy"
          percent={accuracy}
          delta={`${accuracy >= 80 ? "+" : ""}${accuracy}% avg`}
        />

        <ProgressRow
          label="Endurance"
          percent={endurance}
          delta={`+${endurance}% this week`}
        />

        <ProgressRow
          label="Consistency"
          percent={consistency}
          delta={`${consistency}% active`}
          danger={consistency < 50}
        />
      </Card>


      <Card title="Calories Burned (History)">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="calGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.2} />
                </linearGradient>
              </defs>

              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="#7c3aed"
                strokeWidth={3}
                dot={{ r: 4 }}
                fill="url(#calGradient)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 text-center py-10">
            No workout data yet
          </p>
        )}
      </Card>


      {/* HISTORY */}
      <Card title="Workout History">
        {stats?.workouts?.length > 0 ? (
          <div className="space-y-3">
            {stats.workouts.map(w => (
              <div
                key={w._id}
                className="flex justify-between items-center border-b pb-2 text-sm"
              >
                <div>
                  <p className="font-medium">{w.workoutName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(w.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-purple-600">
                    {w.totalCalories} kcal
                  </p>
                  <p className="text-xs text-gray-500">
                    {w.duration} min
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <TrendingUp size={32} />
            <p className="text-sm mt-3">
              Complete workouts to see your history here.
            </p>
          </div>
        )}
      </Card>


    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

const Card = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm p-5">
    <h3 className="font-semibold mb-4">{title}</h3>
    {children}
  </div>
);

const StatCard = ({ icon, value, label }) => (
  <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
    <div className="flex justify-center mb-2 text-purple-600">
      {icon}
    </div>
    <p className="text-xl font-semibold">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

const ProgressRow = ({ label, percent, delta, danger }) => (
  <div className="mb-5 last:mb-0">
    <div className="flex justify-between text-sm mb-2">
      <span className="text-gray-600">{label}</span>
      <span
        className={`text-xs font-medium
          ${danger ? "text-red-500" : "text-purple-600"}`}
      >
        {delta}
      </span>
    </div>

    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-purple-600 to-teal-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  </div>
);
