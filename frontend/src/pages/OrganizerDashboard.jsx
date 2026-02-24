import { useEffect, useState } from "react";
import api from "../api/axios";
import "../App.css";
import { useNavigate } from "react-router-dom";

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/events/my").then((res) => setEvents(res.data));
  }, []);

  const hasMerchEvents = events.some((e) => e.type === "MERCH");
  const hasPaidEvents = events.some((e) => e.registrationFee > 0);
  const publishEvent = async (eventId) => {
    try {
      await api.patch(`/events/${eventId}/publish`);
      const res = await api.get("/events/my");
      setEvents(res.data);
    } catch (err) {
      alert("Failed to publish event");
    }
  };

  const viewRegistrations = (eventId) => {
    navigate(`/organizer/event/${eventId}/registrations`);
  };

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
        <button
          className="btn"
          onClick={() => navigate("/organizer/create")}
        >
          + Create New Event
        </button>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {hasPaidEvents && (
            <button
              className="btn"
              onClick={() => navigate("/organizer/payment-verification")}
              style={{ backgroundColor: "#4f46e5", color: "#fff", border: "none" }}
            >
              Payment Verification
            </button>
          )}
          {hasMerchEvents && (
            <button
              className="btn"
              onClick={() => navigate("/organizer/merchandise-orders")}
              style={{ backgroundColor: "#f59e0b", color: "#fff", border: "none" }}
            >
              Merchandise Orders
            </button>
          )}
        </div>
      </div>
      <h2>My Events</h2>

      {events.length === 0 && <p>No events created yet.</p>}

      {events.map((event) => (
        <div className="card" key={event._id}>
          <h3>{event.name}</h3>
          <p>{event.description}</p>

          <p>
            <b>Status:</b>{" "}
            <span
              style={{
                color: event.status === "PUBLISHED" ? "green" : "orange",
              }}
            >
              {event.status}
            </span>
          </p>

          <p>
            <b>Type:</b> {event.type}
          </p>
          {}
          {event.status === "DRAFT" && (
            <button
              className="btn"
              style={{ marginRight: "10px" }}
              onClick={() => publishEvent(event._id)}
            >
              Publish
            </button>
          )}

          {event.status === "PUBLISHED" && (
            <>
              <button
                className="btn"
                style={{ marginRight: "10px" }}
                onClick={() => viewRegistrations(event._id)}
              >
                View Registrations
              </button>
              {event.type === "NORMAL" && (
                <button
                  className="btn"
                  onClick={() => navigate(`/organizer/event/${event._id}/attendance`)}
                  style={{ backgroundColor: "#10b981", marginRight: "10px" }}
                >
                  Attendance Tracking
                </button>
              )}

            </>
          )}
        </div>
      ))}

    </div>
  );
}
