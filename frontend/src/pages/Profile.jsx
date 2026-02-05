import { useState, useEffect } from "react";
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

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    contactNumber: "",
    collegeOrOrg: "",
    interests: [],
    followedOrganizers: [],
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });


  useEffect(() => {
    fetchProfile();
    fetchOrganizers();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/participants/profile");
      setProfile(res.data);
      setForm({
        firstName: res.data.firstName || "",
        lastName: res.data.lastName || "",
        contactNumber: res.data.contactNumber || "",
        collegeOrOrg: res.data.collegeOrOrg || "",
        interests: res.data.interests || [],
        followedOrganizers: res.data.followedOrganizers?.map(org => org._id || org) || [],
      });
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizers = async () => {
    try {
      const res = await api.get("/organizers");
      setOrganizers(res.data);
    } catch (err) {
      console.error("Failed to fetch organizers");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleInterest = (interest) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const toggleOrganizer = (organizerId) => {
    setForm(prev => ({
      ...prev,
      followedOrganizers: prev.followedOrganizers.includes(organizerId)
        ? prev.followedOrganizers.filter(id => id !== organizerId)
        : [...prev.followedOrganizers, organizerId]
    }));
  };

  const handleSaveProfile = async () => {
    setError("");
    setSuccess("");

    if (!form.firstName || !form.lastName || !form.contactNumber || !form.collegeOrOrg) {
      setError("All fields are required");
      return;
    }

    if (!/^\d{10}$/.test(form.contactNumber)) {
      setError("Contact number must be 10 digits");
      return;
    }

    try {
      await api.put("/participants/profile", form);
      setSuccess("Profile updated successfully!");
      setEditing(false);
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handlePasswordChange = async () => {
    setError("");
    setSuccess("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError("All password fields are required");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    try {
      await api.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setSuccess("Password changed successfully!");
      setChangingPassword(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    }
  };

  if (loading) {
    return <div className="container">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="container"><p className="error">Profile not found</p></div>;
  }

  return (
    <div className="container">
      <h2>My Profile</h2>

      {error && <p className="error">{error}</p>}
      {success && <p style={{ color: "green", marginBottom: "15px" }}>{success}</p>}

      {}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3>Profile Information</h3>
          {!editing && (
            <button className="btn" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>

        {!editing ? (
          <div>
            <p><b>Email:</b> {profile.email} <span style={{ color: "#666", fontSize: "12px" }}>(non-editable)</span></p>
            <p><b>First Name:</b> {profile.firstName || "Not set"}</p>
            <p><b>Last Name:</b> {profile.lastName || "Not set"}</p>
            <p><b>Contact Number:</b> {profile.contactNumber || "Not set"}</p>
            <p><b>College/Organization:</b> {profile.collegeOrOrg || "Not set"}</p>
            <p><b>Participant Type:</b> {profile.participantType === "IIIT" ? "IIIT Student" : "External Participant"} <span style={{ color: "#666", fontSize: "12px" }}>(non-editable)</span></p>
          </div>
        ) : (
          <div>
            <p><b>Email:</b> {profile.email} <span style={{ color: "#666", fontSize: "12px" }}>(non-editable)</span></p>
            
            <input
              className="input"
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
            />

            <input
              className="input"
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
            />

            <input
              className="input"
              name="contactNumber"
              placeholder="Contact Number (10 digits)"
              value={form.contactNumber}
              onChange={handleChange}
            />

            <input
              className="input"
              name="collegeOrOrg"
              placeholder="College / Organization Name"
              value={form.collegeOrOrg}
              onChange={handleChange}
            />

            <p><b>Participant Type:</b> {profile.participantType === "IIIT" ? "IIIT Student" : "External Participant"} <span style={{ color: "#666", fontSize: "12px" }}>(non-editable)</span></p>

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button className="btn" onClick={handleSaveProfile}>
                Save Changes
              </button>
              <button
                className="btn"
                style={{ backgroundColor: "#6b7280" }}
                onClick={() => {
                  setEditing(false);
                  setError("");
                  setSuccess("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {}
      <div className="card">
        <h3>Areas of Interest</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {INTEREST_OPTIONS.map((interest) => (
            <button
              key={interest}
              onClick={() => editing && toggleInterest(interest)}
              disabled={!editing}
              style={{
                padding: "8px 16px",
                border: form.interests.includes(interest)
                  ? "2px solid #2563eb"
                  : "1px solid #ccc",
                backgroundColor: form.interests.includes(interest)
                  ? "#dbeafe"
                  : "white",
                color: form.interests.includes(interest) ? "#2563eb" : "#333",
                borderRadius: "20px",
                cursor: editing ? "pointer" : "default",
                fontWeight: form.interests.includes(interest) ? "bold" : "normal",
                opacity: editing ? 1 : 0.7,
              }}
            >
              {interest}
            </button>
          ))}
        </div>
        {form.interests.length === 0 && <p style={{ color: "#666", marginTop: "10px" }}>No interests selected</p>}
      </div>

      {}
      <div className="card">
        <h3>Followed Clubs / Organizers</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {organizers.map((org) => (
            <div
              key={org._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px",
                backgroundColor: "#f9fafb",
                borderRadius: "6px",
              }}
            >
              <div>
                <h4 style={{ margin: "0 0 5px 0" }}>{org.name}</h4>
                <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                  {org.category}
                </p>
              </div>
              {editing && (
                <button
                  className="btn"
                  onClick={() => toggleOrganizer(org._id)}
                  style={{
                    backgroundColor: form.followedOrganizers.includes(org._id)
                      ? "#dc2626"
                      : "#2563eb",
                    padding: "6px 12px",
                    fontSize: "14px",
                  }}
                >
                  {form.followedOrganizers.includes(org._id) ? "Unfollow" : "Follow"}
                </button>
              )}
              {!editing && form.followedOrganizers.includes(org._id) && (
                <span style={{ color: "#10b981", fontWeight: "bold" }}>✓ Following</span>
              )}
            </div>
          ))}
        </div>
        {profile.followedOrganizers?.length === 0 && <p style={{ color: "#666", marginTop: "10px" }}>Not following any clubs yet</p>}
      </div>

      {}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3>Security Settings</h3>
          {!changingPassword && (
            <button className="btn" onClick={() => setChangingPassword(true)}>
              Change Password
            </button>
          )}
        </div>

        {changingPassword && (
          <div>
            <input
              className="input"
              type="password"
              placeholder="Current Password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            />

            <input
              className="input"
              type="password"
              placeholder="New Password (min 6 characters)"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            />

            <input
              className="input"
              type="password"
              placeholder="Confirm New Password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            />

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button className="btn" onClick={handlePasswordChange}>
                Update Password
              </button>
              <button
                className="btn"
                style={{ backgroundColor: "#6b7280" }}
                onClick={() => {
                  setChangingPassword(false);
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  setError("");
                  setSuccess("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
