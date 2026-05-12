import { useEffect, useMemo, useState } from "react";
import { Plus, Edit2, Trash2, Code2, Palette, Database, Globe, Music, Camera, BookOpen, Cpu, Pencil, GraduationCap, Sparkles, X } from "lucide-react";
import { getSkills, createSkill, updateSkill, deleteSkill } from "../../../api/skillService";

const skillIcons = {
  Code2,
  Palette,
  Database,
  Globe,
  Music,
  Camera,
  BookOpen,
  Cpu,
};

const levelColor = {
  Expert: "#4ade80",
  Advanced: "#60a5fa",
  Intermediate: "#fbbf24",
  Beginner: "#a78bfa",
};

const levelBg = {
  Expert: "rgba(74,222,128,0.1)",
  Advanced: "rgba(96,165,250,0.1)",
  Intermediate: "rgba(251,191,36,0.1)",
  Beginner: "rgba(167,139,250,0.1)",
};

const typeDefaults = {
  teach: {
    icon: "Code2",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.15)",
  },
  learn: {
    icon: "Cpu",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.15)",
  },
};

const defaultForm = {
  title: "",
  type: "teach",
  level: "Beginner",
  category: "",
  description: "",
  sessions_completed: 0,
  icon: "Code2",
};

function SkillCard({ skill, onEdit, onDelete }) {
  const Icon = skillIcons[skill.icon] || Code2;
  const color = skill.color || typeDefaults[skill.type]?.color || "#3b82f6";
  const bg = skill.bg || typeDefaults[skill.type]?.bg || "rgba(59,130,246,0.15)";
  const level = skill.level || "Beginner";

  return (
    <div className="sw-skill-card">
      <div className="sw-skill-icon-wrap" style={{ background: bg }}>
        <Icon size={24} color={color} />
      </div>
      <div className="sw-skill-card-name">{skill.title}</div>
      <div className="sw-skill-card-level">{skill.sessions_completed ?? 0} sessions completed</div>
      <div style={{ marginBottom: 16 }}>
        <span
          className="sw-chip"
          style={{
            background: levelBg[level],
            borderColor: levelColor[level] + "55",
            color: levelColor[level],
          }}
        >
          {level}
        </span>
      </div>
      <div className="sw-skill-card-description">{skill.description || "No description added yet."}</div>
      <div style={{ margin: "12px 0" }}>
        <span className="sw-chip sw-chip-outline">{skill.type === "teach" ? "Teaching" : "Learning"}</span>
        {skill.category && <span className="sw-chip sw-chip-outline">{skill.category}</span>}
      </div>
      <div className="sw-skill-actions">
        <button className="sw-btn-ghost" onClick={onEdit} type="button">
          <Edit2 size={13} />
          Edit
        </button>
        <button type="button" className="sw-btn-outline-danger" onClick={onDelete}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function MySkills({ user }) {
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState(defaultForm);
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [categoryInput, setCategoryInput] = useState("");

  const fetchSkills = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getSkills();
      setSkills(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || "Unable to load skills. Please refresh the page.";
      setError(`Error loading skills: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSkills();
    }
  }, [user]);

  const teachingSkills = useMemo(() => skills.filter((skill) => skill.type === "teach"), [skills]);
  const learningSkills = useMemo(() => skills.filter((skill) => skill.type === "learn"), [skills]);

  const openModal = (type = "teach", skill = null) => {
    if (skill) {
      setEditingSkillId(skill.id);
      setFormState({
        title: skill.title,
        type: skill.type,
        level: skill.level,
        category: skill.category || "",
        description: skill.description || "",
        sessions_completed: skill.sessions_completed ?? 0,
        icon: skill.icon || typeDefaults[skill.type]?.icon || "Code2",
      });
    } else {
      setEditingSkillId(null);
      setFormState({ ...defaultForm, type, icon: typeDefaults[type]?.icon || "Code2" });
    }
    setCategoryInput("");
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError("");
    setFormState(defaultForm);
    setEditingSkillId(null);
    setCategoryInput("");
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    const payload = {
      title: formState.title,
      type: formState.type,
      level: formState.level,
      category: formState.category,
      description: formState.description,
      sessions_completed: Number(formState.sessions_completed || 0),
      icon: formState.icon || typeDefaults[formState.type]?.icon || "Code2",
    };

    try {
      const response = editingSkillId
        ? await updateSkill(editingSkillId, payload)
        : await createSkill(payload);

      const updatedSkill = response.data;
      setSkills((current) => {
        if (editingSkillId) {
          return current.map((item) => (item.id === updatedSkill.id ? updatedSkill : item));
        }
        return [updatedSkill, ...current];
      });
      closeModal();
    } catch (err) {
      console.error(err.response?.data);
      const errorMessage = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      setError(`Unable to save skill: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (skill) => {
    const confirmed = window.confirm(`Delete ${skill.title}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setSkills((current) =>
      current.map((item) => (item.id === skill.id ? { ...item, deleting: true } : item))
    );

    try {
      await deleteSkill(skill.id);
      setSkills((current) => current.filter((item) => item.id !== skill.id));
    } catch (err) {
      setError("Unable to delete skill. Please try again.");
      setSkills((current) => current.map((item) => (item.id === skill.id ? { ...item, deleting: false } : item)));
    }
  };

  return (
    <div className="sw-page-enter">
      <div className="sw-page-header">
        <div className="sw-page-title">Skills Management</div>
        <div className="sw-page-subtitle">Manage skills you teach and learn on SwapWise</div>
      </div>

      <div className="sw-section-head" style={{ marginBottom: 24 }}>
        <div className="sw-section-title">Skills I Teach</div>
        <button className="sw-btn-primary" type="button" onClick={() => openModal("teach")}>
          <Plus size={14} />
          Add Teaching Skill
        </button>
      </div>

      {error && (
        <div className="sw-empty-state" style={{ marginBottom: 24 }}>
          <div className="sw-empty-title">{error}</div>
        </div>
      )}

      <div className="sw-skills-grid">
        {isLoading ? (
          <div className="sw-empty-state" style={{ gridColumn: "1/-1" }}>
            <div className="sw-empty-title">Loading skills...</div>
          </div>
        ) : teachingSkills.length > 0 ? (
          teachingSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onEdit={() => openModal(skill.type, skill)}
              onDelete={() => handleDelete(skill)}
            />
          ))
        ) : (
          <div className="sw-empty-state" style={{ gridColumn: "1/-1" }}>
            <div className="sw-empty-title">You have not added any teaching skills yet.</div>
            <div className="sw-empty-text">Add your first teaching skill to keep your profile up to date.</div>
          </div>
        )}

        <div
          className="sw-skill-card sw-add-card"
          role="button"
          tabIndex={0}
          onClick={() => openModal("teach")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              openModal("teach");
            }
          }}
        >
          <div className="sw-add-card-icon">
            <Plus size={22} />
          </div>
          <div className="sw-add-card-text">Add a new skill</div>
        </div>
      </div>

      <div style={{ marginTop: 48 }}>
        <div className="sw-section-head" style={{ marginBottom: 24 }}>
          <div className="sw-section-title">Skills I'm Learning</div>
          <button className="sw-btn-primary" type="button" onClick={() => openModal("learn")}>
            <Plus size={14} />
            Add Learning Goal
          </button>
        </div>

        <div className="sw-skills-grid">
          {learningSkills.length > 0 ? (
            learningSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onEdit={() => openModal(skill.type, skill)}
                onDelete={() => handleDelete(skill)}
              />
            ))
          ) : (
            <div className="sw-empty-state" style={{ gridColumn: "1/-1" }}>
              <div className="sw-empty-title">You have not added any learning goals yet.</div>
              <div className="sw-empty-text">Add a new learning goal to track what you're working on.</div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="sw-modal-overlay" role="dialog" aria-modal="true">
          <div className="sw-skill-modal">
            <div className="sw-modal-header">
              <div>
                <div className="sw-modal-title">{editingSkillId ? "Edit Skill" : "Add Skill"}</div>
                <div className="sw-modal-subtitle">Define your skill journey.</div>
              </div>
              <button className="sw-btn-glass-cancel" style={{ padding: '6px 10px' }} type="button" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitForm} className="sw-skill-form">
              <label className="sw-form-label">
                Title
                <div className="sw-glass-input-wrapper">
                  <div className="sw-glass-input-icon">
                    <Pencil size={16} />
                  </div>
                  <input
                    className="sw-glass-input"
                    value={formState.title}
                    onChange={(event) => setFormState({ ...formState, title: event.target.value })}
                    required
                    placeholder="e.g. React Fundamentals"
                  />
                </div>
              </label>

              <div className="sw-form-row">
                <label className="sw-form-label">
                  Skill Type
                  <div className="sw-glass-input-wrapper">
                    <div className="sw-glass-input-icon">
                      {formState.type === 'teach' ? <GraduationCap size={16} /> : <Sparkles size={16} />}
                    </div>
                    <select
                      className="sw-glass-select"
                      value={formState.type}
                      onChange={(event) => {
                        const newType = event.target.value;
                        setFormState({
                          ...formState,
                          type: newType,
                          icon: typeDefaults[newType]?.icon || formState.icon,
                        });
                      }}
                    >
                      <option value="teach">Teaching</option>
                      <option value="learn">Learning</option>
                    </select>
                  </div>
                </label>

                <label className="sw-form-label">
                  Level
                  <div className="sw-glass-input-wrapper">
                    <div className="sw-glass-input-icon">
                      <Code2 size={16} />
                    </div>
                    <select
                      className="sw-glass-select"
                      value={formState.level}
                      onChange={(event) => setFormState({ ...formState, level: event.target.value })}
                    >
                      <option value="Beginner">Beginner ★</option>
                      <option value="Intermediate">Intermediate ★★</option>
                      <option value="Advanced">Advanced ★★★</option>
                      <option value="Expert">Expert ★★★★</option>
                    </select>
                  </div>
                </label>
              </div>

              <label className="sw-form-label">
                Category (optional)
                <div className="sw-glass-input-wrapper">
                  <div className="sw-glass-input-icon">
                    <Database size={16} />
                  </div>
                  <input
                    className="sw-glass-input"
                    value={categoryInput}
                    onChange={(event) => setCategoryInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ',') {
                        event.preventDefault();
                        const val = categoryInput.trim();
                        if (val) {
                          const currentTags = formState.category ? formState.category.split(',').map(t => t.trim()).filter(Boolean) : [];
                          if (!currentTags.includes(val)) {
                            setFormState({ ...formState, category: [...currentTags, val].join(', ') });
                          }
                          setCategoryInput("");
                        }
                      }
                    }}
                    placeholder="Type and press Enter (e.g. Frontend, Design)"
                  />
                </div>
                {formState.category && (
                  <div className="sw-glass-tags">
                    {formState.category.split(',').map(t => t.trim()).filter(Boolean).map((tag) => (
                      <span key={tag} className="sw-glass-tag">
                        {tag}
                        <button
                          type="button"
                          className="sw-glass-tag-remove"
                          onClick={() => {
                            const currentTags = formState.category.split(',').map(t => t.trim()).filter(Boolean);
                            const newTags = currentTags.filter(t => t !== tag);
                            setFormState({ ...formState, category: newTags.join(', ') });
                          }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </label>

              <label className="sw-form-label" style={{ marginTop: '16px', display: 'block' }}>
                Description
                <textarea
                  className="sw-glass-textarea"
                  value={formState.description}
                  onChange={(event) => setFormState({ ...formState, description: event.target.value })}
                  rows={4}
                  placeholder="Describe this skill or what you want to learn."
                />
              </label>

              <label className="sw-form-label" style={{ marginTop: '16px', display: 'block' }}>
                Sessions Completed
                <div className="sw-glass-input-wrapper">
                  <div className="sw-glass-input-icon">
                    <BookOpen size={16} />
                  </div>
                  <input
                    className="sw-glass-input"
                    type="number"
                    min="0"
                    value={formState.sessions_completed}
                    onChange={(event) => setFormState({ ...formState, sessions_completed: event.target.value })}
                  />
                </div>
              </label>

              {error && <div className="sw-form-error">{error}</div>}

              <div className="sw-form-actions">
                <button className="sw-btn-glass-cancel" type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button className="sw-btn-glass-submit" type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingSkillId ? "Update Skill" : "Create Skill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}