import React, { useState } from "react";
import {
  Home,
  Dumbbell,
  BarChart3,
  Sparkles,
  User,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  return (
    <div
      className={`h-screen bg-white border-r border-purple-600/30 transition-all duration-300
      ${open ? "w-64" : "w-20"}`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between p-4">
        {open && (
          <h1 className="text-lg font-bold text-purple-600">
            TitanFit Ai
          </h1>
        )}

        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* MENU */}
      <nav className="mt-6 space-y-2 px-2">
        <NavItem to="/" icon={<Home />} label="Home" open={open} />
        <NavItem to="/workouts" icon={<Dumbbell />} label="Workouts" open={open} />
        <NavItem to="/progress" icon={<BarChart3 />} label="Progress" open={open} />
        <NavItem to="/coach" icon={<Sparkles />} label="AI Coach" open={open} />
        <NavItem to="/profile" icon={<User />} label="Profile" open={open} />
      </nav>
    </div>
  );
}

const NavItem = ({ to, icon, label, open }) => (
  <NavLink
    to={to}
    end
    className={({ isActive }) =>
      `w-full flex items-center gap-4 px-4 py-3 rounded-lg transition
      ${isActive ? "bg-purple-50 text-purple-600" : "text-gray-600 hover:bg-gray-100"}`
    }
  >
    <span>{icon}</span>
    {open && <span className="text-sm font-medium">{label}</span>}
  </NavLink>
);
