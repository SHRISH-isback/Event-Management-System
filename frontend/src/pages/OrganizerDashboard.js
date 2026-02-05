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

  return (
    <div className="container">
      <button
        className="btn"
        style={{ marginBottom: "15px" }}
        onClick={() => navigate("/organizer/create")}
      >
        Create New Event
      </button>
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
                color:
                  event.status === "PUBLISHED" ? "green" : "orange",
              }}
            >
              {event.status}
            </span>
          </p>

          <p>
            <b>Type:</b> {event.type}
          </p>
        </div>
      ))}
    </div>
  );
}
