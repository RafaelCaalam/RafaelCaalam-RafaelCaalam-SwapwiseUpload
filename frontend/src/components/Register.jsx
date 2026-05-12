import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Check,
  CircleCheck,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  MonitorCheck,
  Plus,
  RefreshCw,
  Sparkles,
  User,
  X,
} from "lucide-react";
import api from "../api";
import "../components/styles/Register.css";

const roleOptions = [
  {
    value: "learner",
    title: "Learner",
    description: "I want to learn new skills from experienced mentors.",
    icon: GraduationCap,
  },
  {
    value: "teacher",
    title: "Teacher",
    description: "I want to share my knowledge and expertise.",
    icon: MonitorCheck,
  },
  {
    value: "both",
    title: "Both",
    description: "I want to learn and teach interchangeably.",
    icon: ArrowLeftRight,
  },
];

const recommendedTeachSkills = [
  "Graphic Design",
  "JavaScript",
  "Public Speaking",
  "Video Editing",
  "Digital Marketing",
];

const recommendedLearnSkills = [
  "Python",
  "Photography",
  "Business English",
  "Data Analysis",
  "Cooking Basics",
];

function Register({ goToLogin }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "teacher",
  });
  const [teachSkills, setTeachSkills] = useState(["UI/UX Design", "Frontend Development"]);
  const [learnSkills, setLearnSkills] = useState(["Conversational Spanish", "Data Science Basics"]);
  const [teachInput, setTeachInput] = useState("");
  const [learnInput, setLearnInput] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const goNextFromAccount = (e) => {
    e.preventDefault();
    setMessage("");

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setStep(2);
  };

  const addSkill = (type) => {
    const value = type === "teach" ? teachInput.trim() : learnInput.trim();
    if (!value) return;

    if (type === "teach") {
      setTeachSkills((skills) => [...skills, value]);
      setTeachInput("");
      return;
    }

    setLearnSkills((skills) => [...skills, value]);
    setLearnInput("");
  };

  const removeSkill = (type, skillToRemove) => {
    if (type === "teach") {
      setTeachSkills((skills) => skills.filter((skill) => skill !== skillToRemove));
      return;
    }

    setLearnSkills((skills) => skills.filter((skill) => skill !== skillToRemove));
  };

  const handleSkillKeyDown = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(type);
    }
  };

  const chooseRecommendedSkill = (type, skill) => {
    if (type === "teach") {
      setTeachSkills((skills) => skills.includes(skill) ? skills : [...skills, skill]);
      return;
    }

    setLearnSkills((skills) => skills.includes(skill) ? skills : [...skills, skill]);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!teachSkills.length || !learnSkills.length) {
      setMessage("Add at least one skill for each section");
      return;
    }

    const payload = {
      username: formData.email,
      full_name: formData.fullName,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      teach_skills: teachSkills,
      learn_skills: learnSkills,
    };

    try {
      const response = await api.post("/register/", payload);

      setMessage(response.data.message);
      alert("Successfully registered! Please sign in to continue.");
      goToLogin();
    } catch (error) {
      const errorData = error.response?.data;
      const firstError = errorData && typeof errorData === "object"
        ? Object.values(errorData).flat().join(" ")
        : null;

      setMessage(firstError || "Registration failed. Make sure the backend server is running.");
      console.log(errorData || error.message);
    }
  };

  if (step === 2) {
    return (
      <div className="register-flow-page register-role-page">

        <main className="role-layout">
          <div className="role-progress">
            <div>
              <span>STEP 2 OF 3</span>
              <div className="role-progress-track">
                <div></div>
              </div>
            </div>
            <span>ROLE SELECTION</span>
          </div>

          <section className="role-header">
            <h2>What&apos;s your primary role?</h2>
            <p>
              Select how you primarily plan to engage with the community. You can always
              adjust your preferences later.
            </p>
          </section>

          <section className="role-card-grid" aria-label="Primary role">
            {roleOptions.map((role) => {
              const Icon = role.icon;
              const selected = formData.role === role.value;

              return (
                <button
                  className={`role-card ${selected ? "selected" : ""}`}
                  type="button"
                  key={role.value}
                  onClick={() => setFormData((data) => ({ ...data, role: role.value }))}
                >
                  {selected && (
                    <span className="role-selected-icon">
                      <Check size={14} />
                    </span>
                  )}
                  <span className="role-icon">
                    <Icon size={24} />
                  </span>
                  <strong>{role.title}</strong>
                  <small>{role.description}</small>
                </button>
              );
            })}
          </section>
        </main>

        <footer className="register-flow-footer">
          <button className="register-back-link" type="button" onClick={() => setStep(1)}>
            <ArrowLeft size={16} />
            Back
          </button>
          <button className="register-pill-button" type="button" onClick={() => setStep(3)}>
            Continue
            <ArrowRight size={16} />
          </button>
        </footer>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="register-flow-page register-skills-page">

        <form onSubmit={handleRegister} className="skills-card">
          <div className="skills-progress" aria-label="Step 3 of 3">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="skills-step-label">STEP 3 OF 3</div>

          <header className="skills-header">
            <h2>Define your exchange.</h2>
            <p>
              What knowledge are you bringing to the community, and what are you hoping
              to take away? Add at least one skill for each to continue.
            </p>
          </header>

          <section className="skill-panel">
            <div className="skill-panel-title">
              <span className="skill-title-icon teach">
                <GraduationCap size={19} />
              </span>
              <h3>Skills you can Teach</h3>
            </div>
            <div className="skill-entry-row">
              <input
                type="text"
                placeholder="e.g. Advanced CSS, Italian Cooking, Piano..."
                value={teachInput}
                onChange={(e) => setTeachInput(e.target.value)}
                onKeyDown={(e) => handleSkillKeyDown(e, "teach")}
              />
              <button type="button" onClick={() => addSkill("teach")}>
                <Plus size={16} />
                Add Skill
              </button>
            </div>
            <div className="recommended-skills" aria-label="Recommended teaching skills">
              <span>Recommended</span>
              <div>
                {recommendedTeachSkills.map((skill) => (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => chooseRecommendedSkill("teach", skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
            <div className="skill-tags">
              {teachSkills.map((skill) => (
                <span className="skill-chip filled" key={skill}>
                  {skill}
                  <button type="button" onClick={() => removeSkill("teach", skill)}>
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          </section>

          <section className="skill-panel">
            <div className="skill-panel-title">
              <span className="skill-title-icon learn">
                <Sparkles size={18} />
              </span>
              <h3>Skills you want to Learn</h3>
            </div>
            <div className="skill-entry-row">
              <input
                type="text"
                placeholder="e.g. Machine Learning, Conversational Spanish..."
                value={learnInput}
                onChange={(e) => setLearnInput(e.target.value)}
                onKeyDown={(e) => handleSkillKeyDown(e, "learn")}
              />
              <button type="button" onClick={() => addSkill("learn")}>
                <Plus size={16} />
                Add Skill
              </button>
            </div>
            <div className="recommended-skills" aria-label="Recommended learning skills">
              <span>Recommended</span>
              <div>
                {recommendedLearnSkills.map((skill) => (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => chooseRecommendedSkill("learn", skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
            <div className="skill-tags">
              {learnSkills.map((skill) => (
                <span className="skill-chip outline" key={skill}>
                  {skill}
                  <button type="button" onClick={() => removeSkill("learn", skill)}>
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          </section>

          {message && <p className="register-message">{message}</p>}

          <footer className="skills-actions">
            <button className="skills-back-button" type="button" onClick={() => setStep(2)}>
              <ArrowLeft size={16} />
              Back to Profile Info
            </button>
            <button className="skills-submit" type="submit">
              Complete Registration
              <CircleCheck size={18} />
            </button>
          </footer>
        </form>
      </div>
    );
  }

  return (
    <div className="register-page">
      <form onSubmit={goNextFromAccount} className="register-card">
        <header className="register-header">
          <h2>Create Account</h2>
          <p>Join the community of lifelong learners.</p>
        </header>

        <div className="register-steps" aria-label="Registration steps">
          <div className="register-step active">
            <span>1</span>
            <strong>Account Info</strong>
          </div>
          <div className="register-step-line"></div>
          <div className="register-step">
            <span>2</span>
            <strong>Role</strong>
          </div>
          <div className="register-step-line"></div>
          <div className="register-step">
            <span>3</span>
            <strong>Exchange</strong>
          </div>
        </div>

        <label className="register-field">
          <span>Full Name</span>
          <div className="register-input-wrap">
            <User size={19} />
            <input
              type="text"
              name="fullName"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
        </label>

        <label className="register-field">
          <span>Email Address</span>
          <div className="register-input-wrap">
            <Mail size={19} />
            <input
              type="email"
              name="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </label>

        <label className="register-field">
          <span>Password</span>
          <div className="register-input-wrap">
            <LockKeyhole size={19} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="........."
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              className="register-password-toggle"
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        </label>

        <label className="register-field">
          <span>Confirm Password</span>
          <div className="register-input-wrap">
            <RefreshCw size={18} />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="........."
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <button
              className="register-password-toggle"
              type="button"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              onClick={() => setShowConfirmPassword((visible) => !visible)}
            >
              {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        </label>

        <button type="submit" className="register-submit">
          Continue
          <ArrowRight size={18} />
        </button>

        {message && <p className="register-message">{message}</p>}

        <p className="register-login-text">
          Already have an account?{" "}
          <button type="button" onClick={goToLogin}>
            Log in here
          </button>
        </p>
      </form>
    </div>
  );
}

export default Register;
