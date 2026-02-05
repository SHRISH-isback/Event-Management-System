import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../App.css";

export default function EventDetails() {
    const { eventId } = useParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const role = localStorage.getItem("role");

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await api.get(`/events/${eventId}`);
                setEvent(res.data);
            } catch {
                setError("Failed to load event details");
            }
        };

        fetchEvent();
    }, [eventId]);

    const handleRegister = async () => {
        try {
            const res = await api.post(`/registrations/${eventId}`);
            setMessage(`Registered successfully! Ticket ID: ${res.data.ticketId}`);
        } catch (err) {
            setError(
                err.response?.data?.message || "Registration failed"
            );
        }
    };

    if (!event) {
        return <div className="container">Loading event...</div>;
    }

    return (
        <div className="container">
            <h2>{event.name}</h2>
            <p>{event.description}</p>

            <p><b>Type:</b> {event.type}</p>
            <p>
                <b>Dates:</b>{" "}
                {new Date(event.startDate).toLocaleDateString()} –{" "}
                {new Date(event.endDate).toLocaleDateString()}
            </p>

            {event.registrationLimit && (
                <p><b>Registration Limit:</b> {event.registrationLimit}</p>
            )}

            {message && <p style={{ color: "green" }}>{message}</p>}
            {error && <p className="error">{error}</p>}

            {role === "PARTICIPANT" && (
                <button className="btn" onClick={handleRegister}>
                    Register
                </button>
            )}

            <button
                className="btn"
                style={{ marginLeft: "10px", backgroundColor: "#6b7280" }}
                onClick={() => navigate("/events")}
            >
                Back
            </button>
        </div>
    );
}