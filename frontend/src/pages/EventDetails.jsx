import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../App.css";

export default function EventDetails() {
    const { eventId } = useParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [registrationCount, setRegistrationCount] = useState(0);
    const [isRegistered, setIsRegistered] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const role = localStorage.getItem("role");

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await api.get(`/events/${eventId}`);
                setEvent(res.data);
                
                // Check if already registered
                if (role === "PARTICIPANT") {
                    try {
                        const regRes = await api.get(`/registrations/check/${eventId}`);
                        setIsRegistered(regRes.data.isRegistered);
                    } catch (err) {
                    }
                }

                try {
                    const countRes = await api.get(`/registrations/count/${eventId}`);
                    setRegistrationCount(countRes.data.count);
                } catch (err) {
                }
            } catch {
                setError("Failed to load event details");
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId, role]);

    const handleRegister = async () => {
        setError("");
        setMessage("");

        try {
            const res = await api.post(`/registrations/${eventId}`);
            setMessage(`Registered successfully! Your Ticket ID: ${res.data.ticketId}`);
            setIsRegistered(true);
            setRegistrationCount(prev => prev + 1);
        } catch (err) {
            setError(
                err.response?.data?.message || "Registration failed"
            );
        }
    };

    const isDeadlinePassed = () => {
        if (!event?.registrationDeadline) return false;
        return new Date() > new Date(event.registrationDeadline);
    };

    const isEventFull = () => {
        if (!event?.registrationLimit) return false;
        return registrationCount >= event.registrationLimit;
    };

    const canRegister = () => {
        if (role !== "PARTICIPANT") return false;
        if (isRegistered) return false;
        if (isDeadlinePassed()) return false;
        if (isEventFull()) return false;
        return true;
    };

    const getRegistrationButtonText = () => {
        if (isRegistered) return "Already Registered";
        if (isDeadlinePassed()) return "Registration Closed";
        if (isEventFull()) return "Event Full";
        if (event?.type === "MERCH") return "Purchase";
        return "Register Now";
    };

    if (loading) {
        return <div className="container">Loading event...</div>;
    }

    if (!event) {
        return <div className="container">
            <p className="error">Event not found</p>
            <button className="btn" onClick={() => navigate("/events")}>Back to Events</button>
        </div>;
    }

    return (
        <div className="container">
            <h2>{event.name}</h2>
            
            {/* Event Type Badge */}
            <span style={{
                display: "inline-block",
                padding: "4px 12px",
                backgroundColor: event.type === "MERCH" ? "#10b981" : "#2563eb",
                color: "white",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "bold",
                marginBottom: "15px"
            }}>
                {event.type === "MERCH" ? "MERCHANDISE" : "NORMAL EVENT"}
            </span>

            <p style={{ fontSize: "16px", lineHeight: "1.6", marginBottom: "20px" }}>
                {event.description}
            </p>

            {/* Event Details Grid */}
            <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
                gap: "15px",
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px"
            }}>
                <div>
                    <p style={{ margin: "5px 0" }}><b>Start Date:</b></p>
                    <p style={{ margin: "5px 0", color: "#666" }}>
                        {new Date(event.startDate).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        })}
                    </p>
                </div>

                <div>
                    <p style={{ margin: "5px 0" }}><b>End Date:</b></p>
                    <p style={{ margin: "5px 0", color: "#666" }}>
                        {new Date(event.endDate).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        })}
                    </p>
                </div>

                {event.registrationDeadline && (
                    <div>
                        <p style={{ margin: "5px 0" }}><b>Registration Deadline:</b></p>
                        <p style={{ margin: "5px 0", color: isDeadlinePassed() ? "#dc2626" : "#666" }}>
                            {new Date(event.registrationDeadline).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                            })}
                            {isDeadlinePassed() && " (Closed)"}
                        </p>
                    </div>
                )}

                {event.organizer && (
                    <div>
                        <p style={{ margin: "5px 0" }}><b>Organizer:</b></p>
                        <p style={{ margin: "5px 0", color: "#666" }}>{event.organizer.name}</p>
                    </div>
                )}

                {event.eligibility && (
                    <div>
                        <p style={{ margin: "5px 0" }}><b>Eligibility:</b></p>
                        <p style={{ margin: "5px 0", color: "#666" }}>{event.eligibility}</p>
                    </div>
                )}

                {event.registrationFee !== undefined && (
                    <div>
                        <p style={{ margin: "5px 0" }}><b>Fee:</b></p>
                        <p style={{ margin: "5px 0", color: "#666" }}>
                            {event.registrationFee === 0 ? "Free" : `₹${event.registrationFee}`}
                        </p>
                    </div>
                )}

                {event.registrationLimit && (
                    <div>
                        <p style={{ margin: "5px 0" }}><b>Seats:</b></p>
                        <p style={{ 
                            margin: "5px 0", 
                            color: isEventFull() ? "#dc2626" : "#666",
                            fontWeight: isEventFull() ? "bold" : "normal"
                        }}>
                            {registrationCount} / {event.registrationLimit}
                            {isEventFull() && " (Full)"}
                        </p>
                    </div>
                )}

                {event.tags && event.tags.length > 0 && (
                    <div style={{ gridColumn: "1 / -1" }}>
                        <p style={{ margin: "5px 0" }}><b>Tags:</b></p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                            {event.tags.map((tag, index) => (
                                <span key={index} style={{
                                    padding: "4px 10px",
                                    backgroundColor: "#e5e7eb",
                                    borderRadius: "12px",
                                    fontSize: "12px"
                                }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Messages */}
            {message && <div style={{ 
                padding: "12px", 
                backgroundColor: "#d1fae5", 
                border: "1px solid #10b981",
                borderRadius: "6px",
                marginBottom: "15px",
                color: "#065f46"
            }}>
                {message}
            </div>}
            
            {error && <div style={{ 
                padding: "12px", 
                backgroundColor: "#fee2e2", 
                border: "1px solid #dc2626",
                borderRadius: "6px",
                marginBottom: "15px",
                color: "#991b1b"
            }}>
                {error}
            </div>}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                {role === "PARTICIPANT" && (
                    <button 
                        className="btn" 
                        onClick={handleRegister}
                        disabled={!canRegister()}
                        style={{
                            opacity: canRegister() ? 1 : 0.5,
                            cursor: canRegister() ? "pointer" : "not-allowed"
                        }}
                    >
                        {getRegistrationButtonText()}
                    </button>
                )}

                <button
                    className="btn"
                    style={{ backgroundColor: "#6b7280" }}
                    onClick={() => navigate(-1)}
                >
                    ← Back
                </button>
            </div>
        </div>
    );
}