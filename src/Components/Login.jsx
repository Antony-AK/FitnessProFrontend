import React, { useState } from "react";
import { Mail, Lock, User } from "lucide-react";
import loginimg from "../assets/hero-fitness.jpg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");


  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email || !password || (isSignup && !name)) {
      alert("Please fill all fields");
      return;
    }

    try {
      if (isSignup) {
        await signup(name, email, password);
        navigate("/onboarding");
      } else {
        await login(email, password);
        navigate("/");
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Authentication failed");
    }
  };



  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

      {/* LEFT SIDE */}
      <div className="relative hidden lg:flex items-center justify-center">
        <img
          src={loginimg}
          alt="Fitness"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 via-indigo-600/70 to-teal-500/70" />

        <div className="relative z-10 max-w-md px-10 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              🏋️
            </div>
            <h1 className="text-3xl font-bold">AI Fitness</h1>
          </div>

          <p className="text-lg leading-relaxed mb-10">
            Train smarter with real-time AI guidance. Get personalized workouts,
            track your progress, and achieve your fitness goals.
          </p>

          <div className="flex gap-10">
            <Stat value="10K+" label="Active Users" />
            <Stat value="500+" label="Workouts" />
            <Stat value="98%" label="Success Rate" />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">

          <h2 className="text-2xl font-bold text-center mb-2">
            {isSignup ? "Create an account" : "Welcome back"}
          </h2>

          <p className="text-sm text-gray-500 text-center mb-8">
            {isSignup
              ? "Create your account to start training smarter"
              : "Enter your credentials to access your workouts"}
          </p>

          {/* FULL NAME (SIGN UP ONLY) */}
          {isSignup && (
            <>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <div className="relative mb-5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  type="text"
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg"
                />

              </div>
            </>
          )}

          {/* EMAIL */}
          <label className="block text-sm font-medium mb-1">Email</label>
          <div className="relative mb-5">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg"
              required
            />

          </div>

          {/* PASSWORD */}
          <label className="block text-sm font-medium mb-1">Password</label>
          <div className="relative mb-6">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg"
              required
            />

          </div>

          {/* MAIN BUTTON */}
          <button
            onClick={handleSubmit}
            className="w-full bg-purple-600 text-white py-3 rounded-lg"
          >
            {isSignup ? "Create Account" : "Login"}
          </button>


          {/* DIVIDER */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-3 text-xs text-gray-400">
              OR CONTINUE WITH
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* GOOGLE */}
          <button className="w-full border py-2.5 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition">
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-5"
              alt="Google"
            />
            Continue with Google
          </button>

          {/* TOGGLE */}
          <p className="text-sm text-center text-gray-500 mt-6">
            {isSignup ? "Already have an account?" : "Don’t have an account?"}{" "}
            <span
              className="text-purple-600 font-medium cursor-pointer"
              onClick={() => setIsSignup(!isSignup)}
            >
              {isSignup ? "Login" : "Sign up"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  );
}
