import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import "../App.css";

export default function EventRegistrations() {
  const { eventId } = useParams();
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    api.get(`/registrations/event/${eventId}`)
      .then(res => setRegistrations(res.data));
  }, [eventId]);

  return (
    <div className="container">
      <h2>Event Registrations</h2>

      {registrations.length === 0 && <p>No registrations yet.</p>}

      {registrations.map((r) => (
        <div className="card" key={r._id}>
          <p><b>Participant:</b> {r.participant.email}</p>
          <p><b>Ticket ID:</b> {r.ticketId}</p>
        </div>
      ))}
    </div>
  );
}
