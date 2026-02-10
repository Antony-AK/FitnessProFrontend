import React, { useState } from "react";
import {
  User,
  Target,
  Heart,
  Ruler,
  Settings,
  Volume2,
  Bell,
  Globe,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";


export default function Profile() {
  const [voice, setVoice] = useState(false);
  const [notify, setNotify] = useState(true);
  const { user, logout, updateProfile } = useAuth();
  const profile = user?.profile;

  const [form, setForm] = useState({
    age: profile?.age || "",
    weight: profile?.weight || "",
  });

  const [success, setSuccess] = useState(false);



  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* ================= HEADER ================= */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-b-3xl px-6 pt-6 pb-12 text-white">
        <h1 className="text-lg font-semibold mb-4">Profile</h1>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <User />
          </div>
          <div>
            <p className="font-semibold">{profile?.fullName}</p>
            <p className="text-sm opacity-90">{user?.email}</p>

          </div>
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="px-6 -mt-6">
        <div className="bg-white rounded-2xl shadow-sm grid grid-cols-3 text-center py-4">

          <Stat icon={<Target />} label="Goal" value={profile?.goal} />
          <Stat icon={<Heart />} label="Level" value={profile?.fitnessLevel} />
          <Stat icon={<Ruler />} label="Height" value={`${profile?.height} cm`} />


        </div>
      </div>

      {/* ================= BODY DETAILS ================= */}
      <Card title="Body Details">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Age"
            value={form.age}
            onChange={e => setForm({ ...form, age: e.target.value })}
          />

          <Input
            label="Weight (kg)"
            value={form.weight}
            onChange={e => setForm({ ...form, weight: e.target.value })}
          />


        </div>


        <button
          onClick={async () => {
            await updateProfile(form);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
          }}
          className="mt-4 w-full border rounded-lg py-2 text-sm text-purple-600 hover:bg-purple-50"
        >
          Update Details
        </button>

            {success && (
        <div className="mb-4 mt-5 text-sm text-green-700 bg-green-100 px-4 py-2 rounded-lg">
          ✅ Profile updated successfully
        </div>
      )}


      </Card>

      {/* ================= PREFERENCES ================= */}
      <Card title="Preferences">
        <Toggle
          icon={<Volume2 />}
          label="Voice Feedback"
          sub="Audio cues during workouts"
          value={voice}
          onChange={setVoice}
        />

        <Toggle
          icon={<Bell />}
          label="Notifications"
          sub="Workout reminders"
          value={notify}
          onChange={setNotify}
        />

        <Row
          icon={<Globe />}
          label="Language"
          value="English"
        />
      </Card>

      {/* ================= ACCOUNT ================= */}
      <Card title="Account">
        <button
          onClick={logout}
          className="w-full bg-red-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
        >
          <LogOut size={16} /> Logout
        </button>

      </Card>

      {/* FOOTER */}
      <p className="text-center text-xs text-gray-400 mt-6">
        AI Fitness Trainer v1.0.0
      </p>

  

    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

const Card = ({ title, children }) => (
  <div className="px-6 mt-6">
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Settings size={16} />
        {title}
      </h3>
      {children}
    </div>
  </div>
);

const Stat = ({ icon, label, value }) => (
  <div>
    <div className="flex justify-center text-purple-600 mb-1">
      {icon}
    </div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-medium">{value}</p>
  </div>
);

const Input = ({ label, value, onChange }) => (
  <div>
    <label className="text-sm text-gray-500">{label}</label>
    <input
      value={value}
      onChange={onChange}
      className="mt-1 w-full px-4 py-2 border rounded-lg"
    />
  </div>
);


const Toggle = ({ icon, label, sub, value, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b last:border-none">
    <div className="flex gap-3 items-center">
      <div className="w-9 h-9 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
    </div>

    <button
      onClick={() => onChange(!value)}
      className={`w-10 h-6 rounded-full relative transition ${value ? "bg-purple-600" : "bg-gray-300"
        }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${value ? "right-0.5" : "left-0.5"
          }`}
      />
    </button>
  </div>
);

const Row = ({ icon, label, value }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex gap-3 items-center">
      <div className="w-9 h-9 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm font-medium">{label}</p>
    </div>
    <p className="text-sm text-gray-500">{value}</p>
  </div>
);
