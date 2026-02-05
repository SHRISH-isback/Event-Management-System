import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../App.css";

export default function Events() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();


  useEffect(() => {
    api.get("/events").then((res) => setEvents(res.data));
  }, []);

  return (
    <div className="container">
      <h2>Browse Events</h2>

      {events.map((event) => (
        <button
          className="btn"
          onClick={() => navigate(`/events/${event._id}`)}
        >
          View Details
        </button>
      ))}
    </div>
  );
}
