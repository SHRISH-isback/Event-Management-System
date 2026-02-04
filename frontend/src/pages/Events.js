import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        setEvents(res.data);
      } catch (err) {
        console.error("Failed to fetch events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) return <p>Loading events...</p>;

  return (
    <div>
      <h2>Browse Events</h2>

      {events.length === 0 && <p>No events available</p>}

      {events.map((event) => (
        <div
          key={event._id}
          style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}
        >
          <h3>{event.name}</h3>
          <p>{event.description}</p>
          <p>
            <b>Type:</b> {event.type}
          </p>
          <p>
            <b>Organizer:</b> {event.organizer?.name}
          </p>
        </div>
      ))}
    </div>
  );
}
