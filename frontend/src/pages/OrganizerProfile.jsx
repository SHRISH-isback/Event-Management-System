import { useState, useEffect } from "react";
import api from "../api/axios";
import PasswordResetRequest from "../components/PasswordResetRequest";
import "../App.css";

export default function OrganizerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    contactEmail: "",
    contactNumber: "",
    discordWebhook: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/organizers/profile");
      setProfile(res.data);
      setForm({
        name: res.data.name || "",
        category: res.data.category || "",
        description: res.data.description || "",
        contactEmail: res.data.contactEmail || "",
        contactNumber: res.data.contactNumber || "",
        discordWebhook: res.data.discordWebhook || "",
      });
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!form.name || !form.category) {
      setError("Name and category are required");
      return;
    }

    try {
      await api.put("/organizers/profile", form);
      setSuccess("Profile updated successfully!");
      setEditing(false);
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const testWebhook = async () => {
    if (!form.discordWebhook) {
      setError("Please enter a Discord webhook URL first");
      return;
    }

    try {
      await api.post("/organizers/test-webhook");
      setSuccess("Test message sent to Discord! Check your channel.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send test message");
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
      <h2>Organizer Profile</h2>

      {error && <p className="error">{error}</p>}
      {success && <p style={{ color: "green", marginBottom: "15px" }}>{success}</p>}

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3>Organization Details</h3>
          {!editing && (
            <button className="btn" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>

        {!editing ? (
          <div>
            <p><b>Login Email:</b> {profile.loginEmail} <span style={{ color: "#666", fontSize: "12px" }}>(non-editable)</span></p>
            <p><b>Organization Name:</b> {profile.name}</p>
            <p><b>Category:</b> {profile.category}</p>
            <p><b>Description:</b> {profile.description || "No description set"}</p>
            <p><b>Contact Email:</b> {profile.contactEmail || "Not set"}</p>
            <p><b>Contact Number:</b> {profile.contactNumber || "Not set"}</p>
          </div>
        ) : (
          <div>
            <p><b>Login Email:</b> {profile.loginEmail} <span style={{ color: "#666", fontSize: "12px" }}>(non-editable)</span></p>
            
            <input
              className="input"
              name="name"
              placeholder="Organization Name"
              value={form.name}
              onChange={handleChange}
            />

            <input
              className="input"
              name="category"
              placeholder="Category (e.g., Technical, Cultural, Sports)"
              value={form.category}
              onChange={handleChange}
            />

            <textarea
              className="input"
              name="description"
              placeholder="Organization Description"
              value={form.description}
              onChange={handleChange}
              rows={4}
            />

            <input
              className="input"
              name="contactEmail"
              type="email"
              placeholder="Contact Email"
              value={form.contactEmail}
              onChange={handleChange}
            />

            <input
              className="input"
              name="contactNumber"
              placeholder="Contact Number"
              value={form.contactNumber}
              onChange={handleChange}
            />

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button className="btn" onClick={handleSave}>
                Save Changes
              </button>
              <button
                className="btn"
                style={{ backgroundColor: "#6b7280" }}
                onClick={() => {
                  setEditing(false);
                  setError("");
                  setSuccess("");
                  setForm({
                    name: profile.name || "",
                    category: profile.category || "",
                    description: profile.description || "",
                    contactEmail: profile.contactEmail || "",
                    contactNumber: profile.contactNumber || "",
                    discordWebhook: profile.discordWebhook || "",
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Discord Integration</h3>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}>
          Connect your Discord webhook to automatically post new events to your Discord channel.
        </p>

        <input
          className="input"
          name="discordWebhook"
          placeholder="Discord Webhook URL"
          value={form.discordWebhook}
          onChange={handleChange}
          disabled={!editing}
        />

        {form.discordWebhook && (
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button
              className="btn"
              onClick={testWebhook}
              style={{ backgroundColor: "#5865F2" }}
            >
              Test Webhook
            </button>
            {editing && (
              <button
                className="btn"
                onClick={() => setForm({ ...form, discordWebhook: "" })}
                style={{ backgroundColor: "#dc2626" }}
              >
                Clear Webhook
              </button>
            )}
          </div>
        )}

        {!form.discordWebhook && (
          <p style={{ color: "#666", fontSize: "14px", marginTop: "10px" }}>
            No Discord webhook configured. {editing ? "Add one above to enable Discord notifications." : "Edit profile to add."}
          </p>
        )}
      </div>

      <div className="card">
        <h3>Profile Statistics</h3>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "15px",
          marginTop: "15px"
        }}>
          <div style={{ 
            padding: "15px", 
            backgroundColor: "#f9fafb", 
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <p style={{ fontSize: "28px", fontWeight: "bold", margin: "0", color: "#2563eb" }}>
              {profile.eventsCreated || 0}
            </p>
            <p style={{ margin: "5px 0 0 0", color: "#666" }}>Events Created</p>
          </div>

          <div style={{ 
            padding: "15px", 
            backgroundColor: "#f9fafb", 
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <p style={{ fontSize: "28px", fontWeight: "bold", margin: "0", color: "#10b981" }}>
              {profile.followers || 0}
            </p>
            <p style={{ margin: "5px 0 0 0", color: "#666" }}>Followers</p>
          </div>

          <div style={{ 
            padding: "15px", 
            backgroundColor: "#f9fafb", 
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <p style={{ fontSize: "28px", fontWeight: "bold", margin: "0", color: "#f59e0b" }}>
              {profile.totalRegistrations || 0}
            </p>
            <p style={{ margin: "5px 0 0 0", color: "#666" }}>Total Registrations</p>
          </div>
        </div>
      </div>

      <PasswordResetRequest />
    </div>
  );
}
