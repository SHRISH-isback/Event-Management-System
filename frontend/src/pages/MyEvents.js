import { useEffect, useState } from "react";
import api from "../api/axios";
import "../App.css";

export default function MyEvents() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const res = await api.get("/registrations/my");
        setRegistrations(res.data);
      } catch (err) {
        console.error("Failed to load registrations");
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, []);

  if (loading) {
    return <div className="container">Loading your events...</div>;
  }

  return (
    <div className="container">
      <h2>My Registered Events</h2>

      {registrations.length === 0 && (
        <p>You have not registered for any events.</p>
      )}

      {registrations.map((reg) => (
        <div className="card" key={reg._id}>
          <h3>{reg.event.name}</h3>
          <p>{reg.event.description}</p>

          <p>
            <b>Dates:</b>{" "}
            {new Date(reg.event.startDate).toLocaleDateString()} –{" "}
            {new Date(reg.event.endDate).toLocaleDateString()}
          </p>

          <p>
            <b>Ticket ID:</b>{" "}
            <span style={{ color: "#2563eb", fontWeight: "bold" }}>
              {reg.ticketId}
            </span>
          </p>

          <p>
            <b>Status:</b> {reg.status}
          </p>
        </div>
      ))}
    </div>
  );
}
