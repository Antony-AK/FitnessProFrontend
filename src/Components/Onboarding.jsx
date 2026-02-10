import React, { useState } from "react";
import {
    User,
    Heart,
    Camera,
    Mic,
    ChevronRight,
    ChevronLeft
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";


export default function Onboarding() {
    const [step, setStep] = useState(1);
    const [permissions, setPermissions] = useState({
        camera: false,
        mic: false,
    });


    const { saveProfile } = useAuth();
    const navigate = useNavigate();

    const submit = (data) => {
        saveProfile(data);
        navigate("/");
    };




    const [formData, setFormData] = useState({
        fullName: "",
        age: "",
        gender: "male",
        height: "",
        weight: "",
        fitnessLevel: "Beginner",
        injuries: "",
        conditions: "",
        goal: "Overall Fitness",
    });

    const update = (key, value) =>
        setFormData((p) => ({ ...p, [key]: value }));

    const progress = step === 1 ? 33 : step === 2 ? 67 : 100;

    const requestCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });

            // 🔥 Immediately stop camera after permission is granted
            stream.getTracks().forEach(track => track.stop());

            setPermissions(p => ({ ...p, camera: true }));
        } catch {
            alert("Camera permission is required to use AI workouts.");
        }
    };
    const requestMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // stop mic immediately
            stream.getTracks().forEach(track => track.stop());

            setPermissions(p => ({ ...p, mic: true }));
        } catch {
            alert("Microphone permission denied (optional).");
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 px-4 py-10">

            {/* PROGRESS HEADER */}
            <div className="max-w-3xl mx-auto mb-12">
                <div className="flex justify-between text-sm mb-2">
                    <span>Step {step} of 3</span>
                    <span className="text-purple-600 font-medium">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-600 to-teal-500 transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* CARD */}
            <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-8">

                {step === 1 && (
                    <>
                        <IconCircle icon={<User />} />

                        <h2 className="text-xl font-bold text-center mb-1">
                            Let's set up your profile
                        </h2>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            This helps us personalize your workouts.
                        </p>

                        <Input label="Full Name" value={formData.fullName} onChange={(v) => update("fullName", v)} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Age" value={formData.age} onChange={(v) => update("age", v)} />
                            <Gender value={formData.gender} onChange={(v) => update("gender", v)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <Input label="Height (cm)" value={formData.height} onChange={(v) => update("height", v)} />
                            <Input label="Weight (kg)" value={formData.weight} onChange={(v) => update("weight", v)} />
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <IconCircle icon={<Heart />} />

                        <h2 className="text-xl font-bold text-center mb-1">
                            Your health comes first
                        </h2>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            We use this to recommend safe workouts.
                        </p>

                        <Label>Fitness Level</Label>
                        <div className="grid grid-cols-3 gap-3 mb-5">
                            {["Beginner", "Intermediate", "Advanced"].map((l) => (
                                <SelectCard
                                    key={l}
                                    active={formData.fitnessLevel === l}
                                    onClick={() => update("fitnessLevel", l)}
                                    title={l}
                                />
                            ))}
                        </div>

                        <Textarea
                            label="Any injuries? (optional)"
                            placeholder="E.g. knee injury, back pain..."
                            value={formData.injuries}
                            onChange={(v) => update("injuries", v)}
                        />

                        <Textarea
                            label="Health conditions (optional)"
                            placeholder="E.g. asthma, diabetes..."
                            value={formData.conditions}
                            onChange={(v) => update("conditions", v)}
                        />

                        <Label>Fitness Goal</Label>
                        <div className="grid grid-cols-2 gap-4">
                            {["Weight Loss", "Muscle Strength", "Flexibility", "Overall Fitness"].map((g) => (
                                <SelectCard
                                    key={g}
                                    active={formData.goal === g}
                                    onClick={() => update("goal", g)}
                                    title={g}
                                />
                            ))}
                        </div>
                    </>
                )}

                {step === 3 && (
                    <>
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500">
                            <Camera />
                        </div>

                        <h2 className="text-xl font-bold text-center mb-1">
                            Enable smart features
                        </h2>

                        <p className="text-sm text-gray-500 text-center mb-6">
                            These permissions help us provide real-time guidance during workouts.
                        </p>

                        {/* CAMERA */}
                        <PermissionCard
                            icon={<Camera />}
                            title="Camera Permission"
                            desc="Camera access is required for posture tracking and rep counting."
                            enabled={permissions.camera}
                            onClick={requestCamera}
                            required
                        />

                        {/* MIC */}
                        <PermissionCard
                            icon={<Mic />}
                            title="Microphone Permission (Optional)"
                            desc="Enable voice feedback during workouts."
                            enabled={permissions.mic}
                            onClick={requestMic}
                        />

                        <p className="text-xs text-gray-400 text-center mt-4">
                            You can change these permissions anytime in settings.
                        </p>
                    </>
                )}

            </div>

            {/* FOOTER BUTTONS */}
            <div className="max-w-lg mx-auto flex justify-between mt-8">
                {step > 1 && (
                    <button
                        onClick={() => setStep(step - 1)}
                        className="flex items-center gap-2 px-6 py-2 border rounded-lg"
                    >
                        <ChevronLeft size={16} /> Back
                    </button>
                )}

                <button
                    onClick={() => {
                        if (step < 3) setStep(step + 1);
                        else {
                            if (!permissions.camera) {
                                alert("Camera permission is required to continue.");
                                return;
                            }
                            submit({ ...formData, permissions });
                        }
                    }}
                    className="ml-auto flex items-center gap-2 px-8 py-2 bg-purple-600 text-white rounded-lg"
                >
                    {step === 3 ? "Go to Dashboard" : "Continue"}
                    <ChevronRight size={16} />
                </button>

            </div>
        </div>
    );
}

/* ---------- SMALL UI COMPONENTS ---------- */

const IconCircle = ({ icon }) => (
    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
        {icon}
    </div>
);

const Label = ({ children }) => (
    <p className="text-sm font-medium mb-2 mt-4">{children}</p>
);

const Input = ({ label, value, onChange }) => (
    <div className="mb-4">
        <Label>{label}</Label>
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
        />
    </div>
);

const Textarea = ({ label, placeholder, value, onChange }) => (
    <div className="mb-4">
        <Label>{label}</Label>
        <textarea
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg min-h-[80px]"
        />
    </div>
);

const Gender = ({ value, onChange }) => (
    <div>
        <Label>Gender</Label>
        <div className="flex gap-4 mt-2">
            {["male", "female"].map(g => (
                <label key={g} className="flex items-center gap-2">
                    <input type="radio" checked={value === g} onChange={() => onChange(g)} />
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                </label>
            ))}
        </div>
    </div>
);

const SelectCard = ({ title, active, onClick }) => (
    <button
        onClick={onClick}
        className={`border rounded-lg px-3 py-3 text-sm text-center ${active ? "border-purple-600 bg-purple-50" : "hover:bg-gray-50"
            }`}
    >
        {title}
    </button>
);



const PermissionCard = ({ icon, title, desc, enabled, onClick, required }) => (
    <div
        className={`flex items-center justify-between border rounded-xl p-4 mb-4 ${enabled ? "border-purple-600 bg-purple-50" : "hover:bg-gray-50"
            }`}
    >
        <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                {icon}
            </div>
            <div>
                <p className="font-medium text-sm">
                    {title}
                    {required && <span className="text-red-500">*</span>}
                </p>
                <p className="text-xs text-gray-500">{desc}</p>
            </div>
        </div>

        <button
            onClick={onClick}
            className={`w-5 h-5 rounded-full border ${enabled ? "bg-purple-600 border-purple-600" : ""
                }`}
        />
    </div>
);
