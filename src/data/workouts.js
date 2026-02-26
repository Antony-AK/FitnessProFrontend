export const ML_EXERCISES = [

  {
    name: "Head Rotation",
    type: "stretching",
    difficulty: "Easy",
    target: {
      reps: 10,
      note: "Slow controlled neck rotations to improve cervical mobility."
    }
  },
  {
    name: "Squats",
    type: "lower-body",
    difficulty: "Medium",
    target: {
      reps: 15,
      note: "Keep chest up and go deep to activate glutes and quads."
    }
  },
  {
    name: "Jumping Jacks",
    type: "cardio",
    difficulty: "Medium",
    target: {
      reps: 25,
      note: "Full arm and leg extension to increase heart rate."
    }
  },
  {
    name: "Push-ups",
    type: "upper-body",
    difficulty: "Hard",
    target: {
      reps: 12,
      note: "Maintain straight body line while lowering chest."
    }
  },
  {
    name: "Plank",
    type: "core",
    difficulty: "Medium",
    target: {
      reps: 30, // seconds
      note: "Hold a straight line from head to heels. Engage your core."
    }
  },
  {
    name: "Wall Sit",
    type: "lower-body",
    difficulty: "Medium",
    target: {
      reps: 30, // seconds
      note: "Keep thighs parallel to floor. Back flat against the wall."
    }
  },
  {
    name: "Superman Hold",
    type: "core",
    difficulty: "Medium",
    target: {
      reps: 20, // seconds
      note: "Lift arms and legs simultaneously. Squeeze lower back."
    }
  }
];


export const categories = [
  { id: "all", label: "All" },
  { id: "stretching", label: "🧘 Stretching" },
  { id: "lower-body", label: "🦵 Lower Body" },
  { id: "cardio", label: "❤️ Cardio" },
  { id: "upper-body", label: "🏋️ Upper Body" },
  { id: "core", label: "🔥 Core" },
];

export const sampleWorkouts = [
  {
    id: "1",
    name: "Neck Mobility Routine",
    category: "stretching",
    difficulty: "Easy",
    duration: 5,
    calories: 20,
    exercises: ["Head Rotation"]
  },
  {
    id: "2",
    name: "Lower Body Builder",
    category: "lower-body",
    difficulty: "Medium",
    duration: 10,
    calories: 80,
    exercises: ["Squats", "Wall Sit"]
  },
  {
    id: "3",
    name: "Quick Cardio Blast",
    category: "cardio",
    difficulty: "Medium",
    duration: 8,
    calories: 100,
    exercises: ["Jumping Jacks"]
  },
  {
    id: "4",
    name: "Upper Body Strength",
    category: "upper-body",
    difficulty: "Hard",
    duration: 12,
    calories: 120,
    exercises: ["Push-ups"]
  },
  {
    id: "5",
    name: "Core Stability Builder",
    category: "core",
    difficulty: "Medium",
    duration: 10,
    calories: 70,
    exercises: ["Plank", "Superman Hold"]
  },
  {
    id: "6",
    name: "AI Combo Routine",
    category: "all",
    difficulty: "Medium",
    duration: 15,
    calories: 150,
    exercises: [
      "Head Rotation",
      "Squats",
      "Jumping Jacks",
      "Push-ups",
      "Plank"
    ]
  }
];