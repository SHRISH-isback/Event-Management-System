import { useEffect, useState } from "react";
import api from "../api/axios";
import "../App.css";

export default function Events() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.get("/events").then((res) => setEvents(res.data));
  }, []);

  return (
    <div className="container">
      <h2>Browse Events</h2>

      {events.map((event) => (
        <div className="card" key={event._id}>
          <h3>{event.name}</h3>
          <p>{event.description}</p>
          <button className="btn">View Details</button>
        </div>
      ))}
    </div>
  );
}
