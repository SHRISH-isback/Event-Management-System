import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../App.css";

export default function CreateEvent() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        description: "",
        type: "NORMAL",
        startDate: "",
        endDate: "",
        registrationLimit: "",
    });

    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await api.post("/events", {
                ...form,
                registrationLimit: Number(form.registrationLimit),
            });
            navigate("/organizer", { replace: true });
            window.location.reload();

        } catch (err) {
            setError(err.response?.data?.message || "Failed to create event");
        }
    };

    return (
        <div className="container">
            <h2>Create Event</h2>

            {error && <p className="error">{error}</p>}

            <form onSubmit={handleSubmit}>
                <input
                    className="input"
                    name="name"
                    placeholder="Event Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                />

                <textarea
                    className="input"
                    name="description"
                    placeholder="Description"
                    value={form.description}
                    onChange={handleChange}
                    required
                />

                <select
                    className="input"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                >
                    <option value="NORMAL">Normal Event</option>
                    <option value="MERCH">Merchandise Event</option>
                </select>

                <input
                    className="input"
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    required
                />

                <input
                    className="input"
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                    required
                />

                <input
                    className="input"
                    type="number"
                    name="registrationLimit"
                    placeholder="Registration Limit"
                    value={form.registrationLimit}
                    onChange={handleChange}
                />

                <button className="btn" type="submit">
                    Create Event
                </button>
            </form>
        </div>
    );
}
