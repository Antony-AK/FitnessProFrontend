import React, { useState } from "react";
import { categories, sampleWorkouts } from "../data/workouts";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Workouts() {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const filtered = sampleWorkouts.filter(w =>
    (active === "all" || w.category === active) &&
    w.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-xl font-semibold">Choose your workout</h1>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          placeholder="Search workouts..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* FILTERS */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            className={`px-4 py-1.5 rounded-full text-sm border
              ${active === c.id
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600"}
            `}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {filtered.map(w => (
          <div
            key={w.id}
            onClick={() => navigate(`/workouts/${w.id}`)}
            className="bg-white rounded-xl p-5 shadow-sm border cursor-pointer hover:shadow-md transition"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{w.name}</h3>
              <span className={`text-xs px-3 py-1 rounded-full
                ${w.difficulty === "Easy" && "bg-green-100 text-green-700"}
                ${w.difficulty === "Medium" && "bg-yellow-100 text-yellow-700"}
                ${w.difficulty === "Hard" && "bg-red-100 text-red-700"}
              `}>
                {w.difficulty}
              </span>
            </div>

            <div className="flex gap-4 text-sm text-gray-500 mt-2">
              <span>⏱ {w.duration} min</span>
              <span>🔥 {w.calories} cal</span>
              <span>⚡ {w.exercises.length} exercises</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
