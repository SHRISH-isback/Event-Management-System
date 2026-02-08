import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../App.css";

export default function Clubs() {
  const [organizers, setOrganizers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [organizersRes, profileRes] = await Promise.all([
        api.get("/organizers"),
        api.get("/participants/profile"),
      ]);
      setOrganizers(organizersRes.data);
      setProfile(profileRes.data);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const isFollowing = (organizerId) => {
    if (!profile?.followedOrganizers) return false;
    return profile.followedOrganizers.some(
      (org) => org._id === organizerId || org === organizerId
    );
  };

  const toggleFollow = async (organizerId) => {
    try {
      setFollowLoading({ ...followLoading, [organizerId]: true });

      const following = isFollowing(organizerId);
      let updatedFollowed;

      if (following) {
        updatedFollowed = profile.followedOrganizers.filter(
          (org) => (org._id || org) !== organizerId
        );
      } else {
        updatedFollowed = [...profile.followedOrganizers, organizerId];
      }

      await api.put("/participants/profile", {
        followedOrganizers: updatedFollowed,
      });

      const profileRes = await api.get("/participants/profile");
      setProfile(profileRes.data);
    } catch (err) {
      console.error("Failed to update follow status:", err);
      alert("Failed to update. Please try again.");
    } finally {
      setFollowLoading({ ...followLoading, [organizerId]: false });
    }
  };

  if (loading) {
    return <div className="container">Loading clubs and organizers...</div>;
  }

  return (
    <div className="container">
      <h2>Clubs & Organizers</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Discover and follow clubs to get personalized event recommendations
      </p>

      {organizers.length === 0 && (
        <p>No clubs or organizers available at the moment.</p>
      )}

      <div style={{ display: "grid", gap: "20px" }}>
        {organizers.map((org) => (
          <div
            className="card"
            key={org._id}
            style={{
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              onClick={() => navigate(`/organizers/${org._id}`)}
              style={{ flex: 1 }}
            >
              <h3 style={{ marginBottom: "8px", color: "#1a1a1a" }}>
                {org.name}
              </h3>

              {org.category && (
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    backgroundColor: "#e0f2fe",
                    color: "#0369a1",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "500",
                    marginBottom: "10px",
                  }}
                >
                  {org.category}
                </span>
              )}

              <p style={{ color: "#666", marginTop: "10px", lineHeight: "1.6" }}>
                {org.description || "No description available"}
              </p>

              {org.contactEmail && (
                <p style={{ color: "#888", fontSize: "14px", marginTop: "10px" }}>
                   {org.contactEmail}
                </p>
              )}
            </div>

            <div style={{ marginTop: "15px" }}>
              <button
                className="btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollow(org._id);
                }}
                disabled={followLoading[org._id]}
                style={{
                  backgroundColor: isFollowing(org._id) ? "#dc3545" : "#2563eb",
                  opacity: followLoading[org._id] ? 0.6 : 1,
                  cursor: followLoading[org._id] ? "not-allowed" : "pointer",
                }}
              >
                {followLoading[org._id]
                  ? "Loading..."
                  : isFollowing(org._id)
                  ? "Unfollow"
                  : "Follow"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
