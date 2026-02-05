import { useState } from "react";
import api from "../api/axios";
import "../App.css";

export default function AdminDashboard() {
  const [form, setForm] = useState({
    email: "",
    name: "",
    category: "",
    description: "",
    contactEmail: "",
  });

  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState("");

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
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create organizer");
    }
  };

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>

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
    </div>
  );
}
