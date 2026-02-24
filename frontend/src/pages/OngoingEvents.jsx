import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../App.css";

export default function OngoingEvents() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get("/events/my/ongoing")
            .then(res => setEvents(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="container">Loading ongoing events...</div>;

    return (
        <div className="container">
            <h2>Ongoing Events</h2>
            <p style={{ color: "#6b7280", marginBottom: "20px" }}>
                Events that are currently in progress (status: Ongoing or active dates).
            </p>

            {events.length === 0 ? (
                <div style={{
                    textAlign: "center", padding: "60px 20px",
                    backgroundColor: "#f9fafb", borderRadius: "12px",
                    border: "1px solid #e5e7eb", color: "#9ca3af"
                }}>
                    <p style={{ fontSize: "18px", marginBottom: "8px" }}>No ongoing events right now.</p>
                    <p style={{ fontSize: "14px" }}>Events appear here when they are marked as Ongoing or their start date has passed.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {events.map(event => (
                        <div key={event._id} className="card" style={{
                            borderLeft: "5px solid #3b82f6",
                            display: "flex", justifyContent: "space-between",
                            alignItems: "flex-start", flexWrap: "wrap", gap: "12px"
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                    <h3 style={{ margin: 0 }}>{event.name}</h3>
                                    <span style={{
                                        padding: "2px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 700,
                                        backgroundColor: "#dbeafe", color: "#1e40af"
                                    }}>
                                        {event.status}
                                    </span>
                                    <span style={{
                                        padding: "2px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 600,
                                        backgroundColor: event.type === "MERCH" ? "#fef3c7" : "#e0f2fe",
                                        color: event.type === "MERCH" ? "#92400e" : "#0369a1"
                                    }}>
                                        {event.type}
                                    </span>
                                </div>
                                <p style={{ margin: "0 0 8px 0", color: "#6b7280", fontSize: "14px" }}>
                                    {event.description?.slice(0, 120)}{event.description?.length > 120 ? "…" : ""}
                                </p>
                                <div style={{ fontSize: "13px", color: "#9ca3af", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                                    {event.startDate && (
                                        <span>{new Date(event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                    )}
                                    {event.endDate && (
                                        <span>Ends {new Date(event.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <button className="btn"
                                    onClick={() => navigate(`/organizer/event/${event._id}/registrations`)}
                                    style={{ fontSize: "13px", padding: "8px 14px" }}>
                                    Registrations
                                </button>
                                {event.type === "NORMAL" && (
                                    <button className="btn"
                                        onClick={() => navigate(`/organizer/event/${event._id}/attendance`)}
                                        style={{ fontSize: "13px", padding: "8px 14px", backgroundColor: "#10b981" }}>
                                        Attendance
                                    </button>
                                )}
                                <button className="btn"
                                    onClick={() => navigate(`/organizer/event/${event._id}/edit`)}
                                    style={{ fontSize: "13px", padding: "8px 14px", backgroundColor: "#6b7280" }}>
                                    Mark Completed
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
