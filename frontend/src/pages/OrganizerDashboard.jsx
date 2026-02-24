import { useEffect, useState } from "react";
import api from "../api/axios";
import "../App.css";
import { useNavigate } from "react-router-dom";

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  const fetchEvents = () => api.get("/events/my").then((res) => setEvents(res.data));

  useEffect(() => { fetchEvents(); }, []);

  const hasMerchEvents = events.some((e) => e.type === "MERCH");
  const hasPaidEvents = events.some((e) => e.registrationFee > 0);

  const publishEvent = async (eventId) => {
    try {
      await api.patch(`/events/${eventId}/publish`);
      fetchEvents();
    } catch (err) {
      alert("Failed to publish event");
    }
  };

  const statusColor = {
    DRAFT: "#f59e0b", PUBLISHED: "#10b981",
    ONGOING: "#3b82f6", COMPLETED: "#6b7280", CLOSED: "#ef4444"
  };

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
        <button className="btn" onClick={() => navigate("/organizer/create")}>+ Create New Event</button>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {hasPaidEvents && (
            <button className="btn" onClick={() => navigate("/organizer/payment-verification")}
              style={{ backgroundColor: "#4f46e5", color: "#fff", border: "none" }}>
              Payment Verification
            </button>
          )}
          {hasMerchEvents && (
            <button className="btn" onClick={() => navigate("/organizer/merchandise-orders")}
              style={{ backgroundColor: "#f59e0b", color: "#fff", border: "none" }}>
              Merchandise Orders
            </button>
          )}
        </div>
      </div>
      <h2>My Events</h2>

      {events.length === 0 && <p>No events created yet.</p>}

      {events.map((event) => (
        <div className="card" key={event._id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
            <h3 style={{ margin: 0 }}>{event.name}</h3>
            <span style={{
              padding: "3px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 700,
              backgroundColor: (statusColor[event.status] || "#6b7280") + "22",
              color: statusColor[event.status] || "#6b7280",
              border: `1px solid ${statusColor[event.status] || "#6b7280"}`,
            }}>
              {event.status}
            </span>
          </div>
          <p>{event.description}</p>
          <p><b>Type:</b> {event.type}</p>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
            {event.status === "DRAFT" && (
              <>
                <button className="btn" onClick={() => publishEvent(event._id)}>Publish</button>
                <button className="btn" onClick={() => navigate(`/organizer/event/${event._id}/edit`)}
                  style={{ backgroundColor: "#6b7280" }}>Edit</button>
              </>
            )}

            {event.status === "PUBLISHED" && (
              <>
                <button className="btn" onClick={() => navigate(`/organizer/event/${event._id}/registrations`)}>
                  View Registrations
                </button>
                {event.type === "NORMAL" && (
                  <button className="btn" onClick={() => navigate(`/organizer/event/${event._id}/attendance`)}
                    style={{ backgroundColor: "#10b981" }}>
                    Attendance Tracking
                  </button>
                )}
                <button className="btn" onClick={() => navigate(`/organizer/event/${event._id}/edit`)}
                  style={{ backgroundColor: "#6b7280" }}>Edit</button>
              </>
            )}

            {event.status === "ONGOING" && (
              <>
                <button className="btn" onClick={() => navigate(`/organizer/event/${event._id}/registrations`)}>
                  View Registrations
                </button>
                {event.type === "NORMAL" && (
                  <button className="btn" onClick={() => navigate(`/organizer/event/${event._id}/attendance`)}
                    style={{ backgroundColor: "#10b981" }}>
                    Attendance
                  </button>
                )}
                <button className="btn" onClick={() => navigate(`/organizer/event/${event._id}/edit`)}
                  style={{ backgroundColor: "#3b82f6" }}>Mark Completed</button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
