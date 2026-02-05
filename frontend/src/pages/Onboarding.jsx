import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../App.css";

const INTEREST_OPTIONS = [
  "Technology",
  "Arts & Culture",
  "Sports",
  "Music",
  "Dance",
  "Drama",
  "Photography",
  "Literature",
  "Gaming",
  "Robotics",
  "Design",
  "Business",
  "Social Service",
  "Environment",
];

export default function Onboarding() {
  const [interests, setInterests] = useState([]);
  const [followedOrganizers, setFollowedOrganizers] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        const res = await api.get("/organizers");
        setOrganizers(res.data);
      } catch (err) {
        console.error("Failed to fetch organizers");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizers();
  }, []);

  const toggleInterest = (interest) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleOrganizer = (organizerId) => {
    setFollowedOrganizers((prev) =>
      prev.includes(organizerId)
        ? prev.filter((id) => id !== organizerId)
        : [...prev, organizerId]
    );
  };

  const handleSave = async () => {
    try {
      await api.put("/participants/preferences", {
        interests,
        followedOrganizers,
      });
      navigate("/participant/events");
    } catch (err) {
      alert("Failed to save preferences");
    }
  };

  const handleSkip = () => {
    navigate("/participant/events");
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h2>Welcome! Let's Personalize Your Experience</h2>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        Select your interests and clubs to follow. You can skip and set these later from your profile.
      </p>

      {/* Interests Section */}
      <div style={{ marginBottom: "30px" }}>
        <h3>Areas of Interest</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {INTEREST_OPTIONS.map((interest) => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              style={{
                padding: "8px 16px",
                border: interests.includes(interest)
                  ? "2px solid #2563eb"
                  : "1px solid #ccc",
                backgroundColor: interests.includes(interest)
                  ? "#dbeafe"
                  : "white",
                color: interests.includes(interest) ? "#2563eb" : "#333",
                borderRadius: "20px",
                cursor: "pointer",
                fontWeight: interests.includes(interest) ? "bold" : "normal",
              }}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      {/* Organizers Section */}
      <div style={{ marginBottom: "30px" }}>
        <h3>Follow Clubs / Organizers</h3>
        {organizers.length === 0 && <p>No organizers available yet.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {organizers.map((org) => (
            <div
              key={org._id}
              className="card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "15px",
              }}
            >
              <div>
                <h4 style={{ margin: "0 0 5px 0" }}>{org.name}</h4>
                <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                  {org.category}
                </p>
              </div>
              <button
                className="btn"
                onClick={() => toggleOrganizer(org._id)}
                style={{
                  backgroundColor: followedOrganizers.includes(org._id)
                    ? "#dc2626"
                    : "#2563eb",
                }}
              >
                {followedOrganizers.includes(org._id) ? "Unfollow" : "Follow"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button className="btn" onClick={handleSave}>
          Save Preferences
        </button>
        <button
          className="btn"
          onClick={handleSkip}
          style={{ backgroundColor: "#6b7280" }}
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
}
