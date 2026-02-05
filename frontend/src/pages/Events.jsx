import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../App.css";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        console.log("EVENTS RESPONSE:", res.data);
        setEvents(res.data);
      } catch (err) {
        console.error("EVENT FETCH ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return <div className="container">Loading events...</div>;
  }

  return (
    <div className="container">
      <h2>Browse Events</h2>

      {events.length === 0 && <p>No events available at the moment.</p>}

      {events.map((event) => (
        <div className="card" key={event._id}>
          <h3>{event.name}</h3>
          <p>{event.description}</p>
          
          <p>
            <b>Type:</b> {event.type}
          </p>
          
          {event.startDate && event.endDate && (
            <p>
              <b>Dates:</b>{" "}
              {new Date(event.startDate).toLocaleDateString()} –{" "}
              {new Date(event.endDate).toLocaleDateString()}
            </p>
          )}
          
          {event.registrationFee > 0 && (
            <p>
              <b>Fee:</b> ₹{event.registrationFee}
            </p>
          )}
          
          {event.organizer && (
            <p>
              <b>Organizer:</b> {event.organizer.name}
            </p>
          )}
          
          <button
            className="btn"
            onClick={() => navigate(`/events/${event._id}`)}
          >
            View Details
          </button>
        </div>
      ))}
    </div>
  );
}
