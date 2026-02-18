import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../App.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    name: "",
    category: "",
    description: "",
    contactEmail: "",
  });

  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState("");
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/organizers");
      setOrganizers(res.data);
    } catch (err) {
      console.error("Failed to fetch organizers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCredentials(null);

    try {
      const res = await api.post("/admin/organizers", form);
      setCredentials(res.data.credentials);
      setForm({
        email: "",
        name: "",
        category: "",
        description: "",
        contactEmail: "",
      });
      fetchOrganizers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create organizer");
    }
  };

  const toggleOrganizerStatus = async (organizerId) => {
    if (!window.confirm("Are you sure you want to change this organizer's status?")) {
      return;
    }

    try {
      await api.patch(`/admin/organizers/${organizerId}/toggle`);
      fetchOrganizers();
    } catch (err) {
      alert("Failed to update organizer status");
    }
  };

  const deleteOrganizer = async (organizerId, organizerName) => {
    if (!window.confirm(
      ` WARNING: Are you sure you want to PERMANENTLY DELETE "${organizerName}"?\n\n` + 
      `Type the organizer name to confirm deletion.`
    )) {
      return;
    }

    const confirmation = window.prompt(
      `To confirm deletion, type the organizer name: "${organizerName}"`
    );

    if (confirmation !== organizerName) {
      alert("Organizer name doesn't match. Deletion cancelled.");
      return;
    }

    try {
      await api.delete(`/admin/organizers/${organizerId}`);
      alert("Organizer permanently deleted successfully.");
      fetchOrganizers();
    } catch (err) {
      alert("Failed to delete organizer: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>

      {}
      <div style={{ marginBottom: "30px" }}>
        <button
          className="btn"
          onClick={() => navigate("/admin/password-resets")}
          style={{
            backgroundColor: "#f59e0b",
            marginRight: "10px",
          }}
        >
           Manage Password Resets
        </button>
      </div>

      <h3>Create Organizer</h3>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          className="input"
          name="name"
          placeholder="Organizer Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          className="input"
          name="email"
          placeholder="Organizer Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          className="input"
          name="contactEmail"
          placeholder="Contact Email"
          value={form.contactEmail}
          onChange={handleChange}
        />

        <input
          className="input"
          name="category"
          placeholder="Category (Technical / Cultural)"
          value={form.category}
          onChange={handleChange}
        />

        <textarea
          className="input"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />

        <button className="btn" type="submit">
          Create Organizer
        </button>
      </form>

      {credentials && (
        <div className="card" style={{ marginTop: "20px" }}>
          <h3>Organizer Credentials</h3>
          <p><b>Email:</b> {credentials.email}</p>
          <p><b>Password:</b> {credentials.password}</p>
          <p style={{ color: "red" }}>
            ⚠ Save this password now. It will not be shown again.
          </p>
        </div>
      )}

      {}
      <div style={{ marginTop: "40px" }}>
        <h3>Manage Organizers</h3>
        
        {loading ? (
          <p>Loading organizers...</p>
        ) : organizers.length === 0 ? (
          <p>No organizers created yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse",
              backgroundColor: "white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderRadius: "8px",
              overflow: "hidden"
            }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6" }}>
                  <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Name</th>
                  <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Email</th>
                  <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Category</th>
                  <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>Status</th>
                  <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #e5e7eb" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizers.map((org) => (
                  <tr key={org._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px" }}>{org.name}</td>
                    <td style={{ padding: "12px" }}>{org.user?.email || "N/A"}</td>
                    <td style={{ padding: "12px" }}>{org.category || "N/A"}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        backgroundColor: org.user?.isActive ? "#dcfce7" : "#fee2e2",
                        color: org.user?.isActive ? "#166534" : "#991b1b",
                      }}>
                        {org.user?.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button
                        className="btn"
                        onClick={() => toggleOrganizerStatus(org._id)}
                        style={{
                          padding: "6px 12px",
                          fontSize: "13px",
                          marginRight: "8px",
                          backgroundColor: org.user?.isActive ? "#f59e0b" : "#10b981",
                        }}
                      >
                        {org.user?.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        className="btn"
                        onClick={() => deleteOrganizer(org._id, org.name)}
                        style={{
                          padding: "6px 12px",
                          fontSize: "13px",
                          backgroundColor: "#dc2626",
                        }}
                      >
                         Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
