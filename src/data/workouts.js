export const ML_EXERCISES = [
  {
    name: "Straight Posture",
    type: "stretching",
    difficulty: "Easy",
    target: {
      reps: 8,
      note: "Stand tall with shoulders back and spine aligned to improve posture and reduce neck strain"
    }
  },
  {
    name: "Head Rotation",
    type: "stretching",
    difficulty: "Easy",
    target: {
      reps: 10,
      note: "Slow controlled neck rotations to improve cervical mobility and reduce stiffness"
    }
  },
  {
    name: "Jumping Jacks",
    type: "cardio",
    difficulty: "Medium",
    target: {
      reps: 30,
      note: "Full arm and leg extension to elevate heart rate and activate full body muscles"
    }
  },
  {
    name: "Push-ups",
    type: "upper-body",
    difficulty: "Hard",
    target: {
      reps: 12,
      note: "Maintain a straight body line to build chest, shoulders and core strength"
    }
  },
  {
    name: "Pull-ups",
    type: "upper-body",
    difficulty: "Hard",
    target: {
      reps: 8,
      note: "Engage lats and upper back while pulling up with controlled motion"
    }
  },
  {
    name: "Squats",
    type: "lower-body",
    difficulty: "Medium",
    target: {
      reps: 15,
      note: "Deep squats activate glutes, quads and improve lower body stability"
    }
  },
  {
    name: "Lunges",
    type: "lower-body",
    difficulty: "Medium",
    target: {
      reps: 12,
      note: "Step forward with control to strengthen legs and improve balance"
    }
  },
  {
    name: "Bicep Curls",
    type: "upper-body",
    difficulty: "Easy",
    target: {
      reps: 15,
      note: "Slow and controlled curls to build arm strength without straining joints"
    }
  },
  {
    name: "Leg Raise",
    type: "core",
    difficulty: "Medium",
    target: {
      reps: 12,
      note: "Engage core muscles to lift legs and improve abdominal strength"
    }
  },
  {
    name: "Burpees",
    type: "cardio",
    difficulty: "Hard",
    target: {
      reps: 10,
      note: "Explosive full-body movement to burn fat and boost cardiovascular endurance"
    }
  },
  {
    name: "Plank",
    type: "core",
    difficulty: "Medium",
    target: {
      reps: 1,
      note: "Hold for 30–60 seconds keeping core tight and back straight"
    }
  },
  {
    name: "Walking",
    type: "cardio",
    difficulty: "Easy",
    target: {
      reps: 300,
      note: "Steady walking to improve circulation and aid active recovery"
    }
  },
  {
    name: "Calf Raises",
    type: "lower-body",
    difficulty: "Easy",
    target: {
      reps: 20,
      note: "Lift heels slowly to strengthen calves and improve ankle stability"
    }
  }
];


export const categories = [
  { id: "all", label: "All" },
  { id: "cardio", label: "❤️ Cardio" },
  { id: "upper-body", label: "🏋️ Upper Body" },
  { id: "lower-body", label: "🦵 Lower Body" },
  { id: "core", label: "🧠 Core" },
  { id: "stretching", label: "🧘 Stretching" },
];

export const sampleWorkouts = [
  {
    id: "1",
    name: "AI Full Body",
    category: "all",
    difficulty: "Medium",
    exercises: [
      "Jumping Jacks",
      "Push-ups",
      "Squats",
      "Plank",
      "Burpees",
      "Lunges",
      "Bicep Curls",
      "Leg Raise",
      "Calf Raises"
    ]
  },

  {
    id: "2",
    name: "AI Cardio Burn",
    category: "cardio",
    difficulty: "Hard",
    exercises: [
      "Jumping Jacks",
      "Burpees",
      "Walking",
      "High Knees", // Optional future
      "Jumping Jacks"
    ].filter(e =>
      ["Jumping Jacks", "Burpees", "Walking"].includes(e)
    )
  },

  {
    id: "3",
    name: "AI Strength Builder",
    category: "upper-body",
    difficulty: "Hard",
    exercises: [
      "Push-ups",
      "Pull-ups",
      "Bicep Curls",
      "Plank",
      "Leg Raise"
    ]
  },

  {
    id: "4",
    name: "AI Leg Day",
    category: "lower-body",
    difficulty: "Medium",
    exercises: [
      "Squats",
      "Lunges",
      "Calf Raises",
      "Walking",
      "Leg Raise"
    ]
  },

  {
    id: "5",
    name: "AI Core Crusher",
    category: "core",
    difficulty: "Medium",
    exercises: [
      "Plank",
      "Leg Raise",
      "Burpees",
      "Squats"
    ]
  },

  {
    id: "6",
    name: "AI Mobility & Recovery",
    category: "stretching",
    difficulty: "Easy",
    exercises: [
      "Straight Posture",
      "Head Rotation",
      "Walking",
      "Calf Raises"
    ]
  }
];
