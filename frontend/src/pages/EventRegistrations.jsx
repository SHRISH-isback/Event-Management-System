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
          <p><b>{r.merchDetails ? "Order ID" : "Ticket ID"}:</b> {r.ticketId}</p>
          
          {r.merchDetails && (
            <div style={{
              padding: "12px",
              backgroundColor: "#f0fdf4",
              borderRadius: "6px",
              marginTop: "10px",
              border: "1px solid #86efac"
            }}>
              <p style={{ margin: "5px 0", fontWeight: "bold", color: "#10b981" }}>
                Merchandise Order:
              </p>
              <p style={{ margin: "5px 0" }}>Size: {r.merchDetails.size}</p>
              <p style={{ margin: "5px 0" }}>Color: {r.merchDetails.color}</p>
              <p style={{ margin: "5px 0" }}>Quantity: {r.merchDetails.quantity}</p>
            </div>
          )}

          {r.formResponses && Object.keys(r.formResponses).length > 0 && (
            <div style={{
              padding: "12px",
              backgroundColor: "#f0f9ff",
              borderRadius: "6px",
              marginTop: "10px",
              border: "1px solid #bae6fd"
            }}>
              <p style={{ margin: "5px 0 10px 0", fontWeight: "bold", color: "#0284c7" }}>
                Form Responses:
              </p>
              {Object.entries(r.formResponses).map(([key, value]) => (
                <p key={key} style={{ margin: "5px 0", fontSize: "14px" }}>
                  <b>{key}:</b> {Array.isArray(value) ? value.join(", ") : value}
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
