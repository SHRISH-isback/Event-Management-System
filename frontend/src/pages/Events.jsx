import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../App.css";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort state
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [tags, setTags] = useState("");
  const [minFee, setMinFee] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [startDateFrom, setStartDateFrom] = useState("");
  const [startDateTo, setStartDateTo] = useState("");
  const [sortBy, setSortBy] = useState("startDate");
  const [sortOrder, setSortOrder] = useState("asc");
  const [followedOnly, setFollowedOnly] = useState(false);

  const navigate = useNavigate();

  // Fetch top trending events (by registration count)
  const fetchTrendingEvents = async () => {
    try {
      const res = await api.get("/events/trending");
      setTrendingEvents(res.data);
    } catch (err) {
      console.error("Failed to fetch trending events:", err);
    }
  };

  // Fetch events with current filter/sort params applied as query string
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (type) params.append("type", type);
      if (tags) params.append("tags", tags);
      if (minFee) params.append("minFee", minFee);
      if (maxFee) params.append("maxFee", maxFee);
      if (startDateFrom) params.append("startDateFrom", startDateFrom);
      if (startDateTo) params.append("startDateTo", startDateTo);
      if (sortBy) params.append("sortBy", sortBy);
      if (sortOrder) params.append("sortOrder", sortOrder);
      if (followedOnly) params.append("followedOnly", followedOnly);
      const res = await api.get(`/events?${params.toString()}`);
      setEvents(res.data);
    } catch (err) {
      console.error("EVENT FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  }, [search, type, tags, minFee, maxFee, startDateFrom, startDateTo, sortBy, sortOrder, followedOnly]);

  useEffect(() => {
    fetchTrendingEvents();
  }, []);

  // Re-fetch events whenever any filter/sort value changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Reset all filters and sort to defaults
  const handleClearFilters = () => {
    setSearch("");
    setType("");
    setTags("");
    setMinFee("");
    setMaxFee("");
    setStartDateFrom("");
    setStartDateTo("");
    setSortBy("startDate");
    setSortOrder("asc");
    setFollowedOnly(false);
  };

  const hasActiveFilters = search || type || tags || minFee || maxFee || startDateFrom || startDateTo || followedOnly;

  return (
    <div className="container">
      <h2>Browse Events</h2>

      {/* Trending events section */}
      {trendingEvents.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px" }}>
            Trending Now
            <span style={{
              fontSize: "12px",
              backgroundColor: "#ef4444",
              color: "white",
              padding: "2px 8px",
              borderRadius: "12px",
              fontWeight: "600"
            }}>
              HOT
            </span>
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "15px",
            marginBottom: "20px"
          }}>
            {trendingEvents.slice(0, 5).map((event) => (
              <div
                key={event._id}
                className="card"
                style={{
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                  border: "2px solid #fbbf24",
                  transition: "all 0.3s",
                  position: "relative",
                }}
                onClick={() => navigate(`/events/${event._id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(251, 191, 36, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Registration count badge */}
                <div style={{ position: "absolute", top: "10px", right: "10px" }}>
                  <span style={{
                    backgroundColor: "#dc2626",
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "700",
                  }}>
                    {event.trendingScore} registrations
                  </span>
                </div>
                <h4 style={{ marginBottom: "8px", color: "#92400e", paddingRight: "80px" }}>
                  {event.name}
                </h4>
                <p style={{
                  fontSize: "13px",
                  color: "#78350f",
                  marginBottom: "10px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>
                  {event.description}
                </p>
                <p style={{ fontSize: "12px", color: "#92400e", marginBottom: "5px" }}>
                  {new Date(event.startDate).toLocaleDateString()}
                </p>
                {event.registrationFee > 0 && (
                  <p style={{ fontSize: "13px", fontWeight: "600", color: "#166534" }}>
                    ₹{event.registrationFee}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search input */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search events by name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            border: "2px solid #ddd",
            borderRadius: "8px",
          }}
        />
      </div>

      {/* Filter toggle and followed-clubs-only toggle */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          className="btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>

        <button
          className="btn"
          onClick={() => setFollowedOnly(!followedOnly)}
          style={{
            backgroundColor: followedOnly ? "#10b981" : "#6b7280",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {followedOnly ? "✓" : ""} Followed Clubs Only
        </button>

        {hasActiveFilters && (
          <button
            className="btn"
            onClick={handleClearFilters}
            style={{ backgroundColor: "#dc3545" }}
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Collapsible advanced filter panel */}
      {showFilters && (
        <div
          className="card"
          style={{
            marginBottom: "20px",
            padding: "20px",
            backgroundColor: "#f8f9fa",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Filters</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Event Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
              >
                <option value="">All Types</option>
                <option value="NORMAL">Normal Events</option>
                <option value="MERCH">Merchandise</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Tags (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g., workshop, tech, sports"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Min Fee (₹)
              </label>
              <input
                type="number"
                placeholder="0"
                value={minFee}
                onChange={(e) => setMinFee(e.target.value)}
                min="0"
                style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Max Fee (₹)
              </label>
              <input
                type="number"
                placeholder="No limit"
                value={maxFee}
                onChange={(e) => setMaxFee(e.target.value)}
                min="0"
                style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Start Date From
              </label>
              <input
                type="date"
                value={startDateFrom}
                onChange={(e) => setStartDateFrom(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Start Date To
              </label>
              <input
                type="date"
                value={startDateTo}
                onChange={(e) => setStartDateTo(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
              >
                <option value="startDate">Start Date</option>
                <option value="registrationFee">Fee</option>
                <option value="name">Name</option>
                <option value="createdAt">Created Date</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Sort Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Followed Clubs Only
              </label>
              <input
                type="checkbox"
                checked={followedOnly}
                onChange={(e) => setFollowedOnly(e.target.checked)}
                style={{ width: "20px", height: "20px", cursor: "pointer" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Result count */}
      <div style={{ marginBottom: "20px", color: "#666" }}>
        {loading ? (
          <p>Loading events...</p>
        ) : (
          <p>
            Found {events.length} event{events.length !== 1 ? "s" : ""}
            {hasActiveFilters && " matching your filters"}
          </p>
        )}
      </div>

      {!loading && events.length === 0 && (
        <div className="card">
          <p>No events found. Try adjusting your filters.</p>
        </div>
      )}

      {/* Event list */}
      {events.map((event) => (
        <div className="card" key={event._id}>
          <h3>{event.name}</h3>
          <p>{event.description}</p>

          <p><b>Type:</b> {event.type}</p>

          {event.tags && event.tags.length > 0 && (
            <p>
              <b>Tags:</b>{" "}
              {event.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    display: "inline-block",
                    backgroundColor: "#007bff",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    marginRight: "5px",
                    fontSize: "12px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </p>
          )}

          {event.startDate && event.endDate && (
            <p>
              <b>Dates:</b>{" "}
              {new Date(event.startDate).toLocaleDateString()} –{" "}
              {new Date(event.endDate).toLocaleDateString()}
            </p>
          )}

          {event.registrationFee > 0 ? (
            <p><b>Fee:</b> ₹{event.registrationFee}</p>
          ) : (
            <p><b>Fee:</b> Free</p>
          )}

          {event.organizer && (
            <p><b>Organizer:</b> {event.organizer.name}</p>
          )}

          <button className="btn" onClick={() => navigate(`/events/${event._id}`)}>
            View Details
          </button>
        </div>
      ))}

      <h2 style={{ marginTop: "40px" }}>Trending Events</h2>

      {/* Trending events result count */}
      <div style={{ marginBottom: "20px" }}>
        {loading ? (
          <p>Loading trending events...</p>
        ) : (
          <p>
            Found {trendingEvents.length} trending event{trendingEvents.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {!loading && trendingEvents.length === 0 && (
        <div className="card">
          <p>No trending events found.</p>
        </div>
      )}

      {/* Trending event list */}
      {trendingEvents.map((event) => (
        <div className="card" key={event._id}>
          <h3>{event.name}</h3>
          <p>{event.description}</p>

          <p><b>Type:</b> {event.type}</p>

          {event.tags && event.tags.length > 0 && (
            <p>
              <b>Tags:</b>{" "}
              {event.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    display: "inline-block",
                    backgroundColor: "#007bff",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    marginRight: "5px",
                    fontSize: "12px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </p>
          )}

          {event.startDate && event.endDate && (
            <p>
              <b>Dates:</b>{" "}
              {new Date(event.startDate).toLocaleDateString()} –{" "}
              {new Date(event.endDate).toLocaleDateString()}
            </p>
          )}

          {event.registrationFee > 0 ? (
            <p><b>Fee:</b> ₹{event.registrationFee}</p>
          ) : (
            <p><b>Fee:</b> Free</p>
          )}

          {event.organizer && (
            <p><b>Organizer:</b> {event.organizer.name}</p>
          )}

          <button className="btn" onClick={() => navigate(`/events/${event._id}`)}>
            View Details
          </button>
        </div>
      ))}
    </div>
  );
}
