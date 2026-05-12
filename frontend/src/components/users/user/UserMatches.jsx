import { useState, useMemo, useEffect } from "react";
import { Search, Star, UserPlus, Filter, MapPin, X, Calendar, Clock } from "lucide-react";
import { getMatches, connectUser } from "../../../api/skillService";

const Avatar = ({ item, size = 50 }) => (
  <div
    className="sw-match-avatar"
    style={{
      background: `linear-gradient(135deg, ${item.color || '#3b82f6'}, ${(item.color || '#3b82f6')}88)`,
      width: size,
      height: size,
    }}
  >
    {item.image ? (
      <img
        src={item.image}
        alt={item.full_name}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
    ) : (
      item.initials || (item.full_name ? item.full_name.substring(0, 2).toUpperCase() : 'U')
    )}
  </div>
);

export default function Matches() {
  const [allMatches, setAllMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All Levels");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [availabilityFilter, setAvailabilityFilter] = useState("Any Time");
  const [showFilters, setShowFilters] = useState(false);
  const [connecting, setConnecting] = useState({});

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await getMatches();
        setAllMatches(response.data);
      } catch (error) {
        console.error("Error fetching matches", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const handleConnect = async (userId) => {
    setConnecting((prev) => ({ ...prev, [userId]: true }));
    try {
      await connectUser({ receiver_id: userId });
      // Leave it in "Pending" state
    } catch (error) {
      console.error("Error connecting user", error);
      setConnecting((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // Advanced Filtering Logic
  const filtered = useMemo(() => {
    return allMatches.filter((m) => {
      const matchesSearch =
        (m.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.teaching_skills || []).some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
        (m.learning_skills || []).some((l) => l.toLowerCase().includes(search.toLowerCase()));

      const matchesLevel = levelFilter === "All Levels" || m.level === levelFilter;
      const matchesCategory = categoryFilter === "All Categories" || m.category === categoryFilter;
      const matchesAvailability = availabilityFilter === "Any Time" || m.availability === availabilityFilter;

      return matchesSearch && matchesLevel && matchesCategory && matchesAvailability;
    });
  }, [allMatches, search, levelFilter, categoryFilter, availabilityFilter]);

  const resetFilters = () => {
    setSearch("");
    setLevelFilter("All Levels");
    setCategoryFilter("All Categories");
    setAvailabilityFilter("Any Time");
  };

  return (
    <div className="sw-page-enter">
      <div className="sw-page-header">
        <div className="sw-page-title">Matching System</div>
        <div className="sw-page-subtitle">Connect with experts ready to trade skills</div>
      </div>

      {/* Search & Filter Controls */}
      <div className="sw-search-controls">
        <div className="sw-search-bar">
          <Search size={16} />
          <input
            placeholder="Search skills (e.g. React, Python)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          className={`sw-filter-toggle ${showFilters ? 'active' : ''}`} 
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={14} />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="sw-filter-panel">
          <div className="sw-filter-grid">
            <div className="sw-filter-group">
              <label className="sw-filter-label">Skill Level</label>
              <select 
                className="sw-filter-select"
                value={levelFilter} 
                onChange={(e) => setLevelFilter(e.target.value)}
              >
                <option>All Levels</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            
            <div className="sw-filter-group">
              <label className="sw-filter-label">Category</label>
              <select 
                className="sw-filter-select"
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option>All Categories</option>
                <option>Development</option>
                <option>Design</option>
                <option>Data Science</option>
                <option>Mobile</option>
              </select>
            </div>
            
            <div className="sw-filter-group">
              <label className="sw-filter-label">Availability</label>
              <select 
                className="sw-filter-select"
                value={availabilityFilter} 
                onChange={(e) => setAvailabilityFilter(e.target.value)}
              >
                <option>Any Time</option>
                <option>Weekdays</option>
                <option>Weeknights</option>
                <option>Weekends</option>
              </select>
            </div>
          </div>
          
          <button onClick={resetFilters} className="sw-filter-reset">
            <X size={14} />
            Reset all filters
          </button>
        </div>
      )}

      {/* Matches Grid */}
      <div className="sw-matches-grid">
        {loading ? (
          <div className="sw-empty">Loading matches...</div>
        ) : filtered.map((m) => (
          <div className="sw-match-card" key={m.id || m.full_name}>
            <div className="sw-match-header">
              <Avatar item={m} size={48} />
              <div>
                <div className="sw-match-name">{m.full_name}</div>
                <div className="sw-match-role">{m.role || 'Learner'}</div>
              </div>
              <div className="sw-match-score">
                {m.match_percentage}% MATCH
              </div>
            </div>

            <div className="sw-match-meta">
              <span><MapPin size={12} /> {m.location}</span>
              <span><Calendar size={12} /> {m.availability}</span>
            </div>

            <div>
              <div className="sw-match-section-title">TEACHES</div>
              <div className="sw-skill-chips">
                {(m.teaching_skills || []).map((t, i) => (
                  <span className={`sw-chip sw-chip-blue`} key={`${t}-${i}`}>{t}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="sw-match-section-title">WANTS TO LEARN</div>
              <div className="sw-skill-chips">
                {(m.learning_skills || []).map((l, i) => (
                  <span className={`sw-chip sw-chip-purple`} key={`${l}-${i}`}>{l}</span>
                ))}
              </div>
            </div>

            <div className="sw-match-rating">
              <Star size={14} fill="currentColor" />
              <span>{m.rating || "5.0"}</span>
              <span>({m.reviews || 0} reviews)</span>
            </div>

            <div className="sw-match-actions">
              <button 
                className="sw-btn-primary" 
                onClick={() => handleConnect(m.id)}
                disabled={connecting[m.id]}
              >
                {connecting[m.id] ? (
                  <>
                    <Clock size={14} />
                    Pending
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    Connect
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty Result State */}
      {!loading && filtered.length === 0 && (
        <div className="sw-empty">
          <Search size={48} />
          <div className="sw-empty-title">No matches found</div>
          <div className="sw-empty-sub">Try relaxing your filters or searching for a broader skill.</div>
          <button onClick={resetFilters} className="sw-filter-reset">
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
