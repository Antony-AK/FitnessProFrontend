import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./Components/Sidebar";

import Dashboard from "./Pages/Dashboard";
import Workouts from "./Pages/Workouts";
import WorkoutDetails from "./Pages/WorkoutDetails";
import Progress from "./Pages/Progress";
import AICoach from "./Pages/AICoach";
import Profile from "./Pages/Profile";
import LiveTracker from "./LiveTracker/LiveTracker";
import WorkoutComplete from "./Pages/WorkoutComplete";
import { useAuth } from "./context/AuthContext";
import Login from "./Components/Login";
import Onboarding from "./Components/Onboarding";
import { stopSpeak } from "./utils/speak";

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    stopSpeak();
  }, [location.pathname]);

  if (loading) return null; // ⏳ wait for auth check




  const isInsideApp = user && user.onboardingCompleted;


  return (
    <div className="flex min-h-[96vh] ">
      {/* SIDEBAR */}
      {isInsideApp && <Sidebar />}


      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Routes>

          {!user && <Route path="*" element={<Login />} />}

          {user && !user.onboardingCompleted && <Route path="*" element={<Onboarding />} />}

          {isInsideApp && (
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/workouts" element={<Workouts />} />
              <Route path="/workouts/:id" element={<WorkoutDetails />} />
              <Route path="/live/:id" element={<LiveTracker />} />
              <Route path="/workout-complete" element={<WorkoutComplete />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/coach" element={<AICoach />} />
              <Route path="/profile" element={<Profile />} />
            </>
          )}

        </Routes>

      </main>
    </div>
  );
}

export default App;
