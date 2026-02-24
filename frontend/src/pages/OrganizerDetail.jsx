import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../App.css";

export default function OrganizerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organizer, setOrganizer] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);

  const fetchOrganizerData = useCallback(async () => {
    try {
      setLoading(true);
      
      const orgRes = await api.get(`/organizers/${id}`);
      setOrganizer(orgRes.data);

      const eventsRes = await api.get("/events");
      const organizerEvents = eventsRes.data.filter(
        (event) => event.organizer._id === id || event.organizer === id
      );

      const now = new Date();
      const upcoming = organizerEvents.filter(
        (event) => new Date(event.startDate) >= now
      );
      const past = organizerEvents.filter(
        (event) => new Date(event.endDate) < now
      );

      setUpcomingEvents(upcoming);
      setPastEvents(past);
    } catch (err) {
      console.error("Failed to load organizer data:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrganizerData();
  }, [fetchOrganizerData]);

  if (loading) {
    return <div className="container">Loading organizer details...</div>;
  }

  if (!organizer) {
    return (
      <div className="container">
        <p>Organizer not found.</p>
        <button className="btn" onClick={() => navigate("/clubs")}>
          Back to Clubs
        </button>
      </div>
    );
  }

  const EventsList = ({ events, emptyMessage }) => (
    <div style={{ marginTop: "20px" }}>
      {events.length === 0 ? (
        <p style={{ color: "#666", fontStyle: "italic" }}>{emptyMessage}</p>
      ) : (
        <div style={{ display: "grid", gap: "15px" }}>
          {events.map((event) => (
            <div
              key={event._id}
              className="card"
              style={{
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
              onClick={() => navigate(`/event/${event._id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginBottom: "8px" }}>{event.name}</h3>
                  
                  <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        backgroundColor: event.type === "MERCH" ? "#fef3c7" : "#dbeafe",
                        color: event.type === "MERCH" ? "#92400e" : "#1e40af",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      {event.type === "MERCH" ? "Merchandise" : "Event"}
                    </span>
                    
                    {event.registrationFee > 0 && (
                      <span
                        style={{
                          padding: "4px 10px",
                          backgroundColor: "#dcfce7",
                          color: "#166534",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        ₹{event.registrationFee}
                      </span>
                    )}
                  </div>

                  <p style={{ color: "#666", marginBottom: "10px", lineHeight: "1.5" }}>
                    {event.description?.substring(0, 150)}
                    {event.description?.length > 150 ? "..." : ""}
                  </p>

                  <p style={{ color: "#888", fontSize: "14px" }}>
                     {new Date(event.startDate).toLocaleDateString()} -{" "}
                    {new Date(event.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="container">
      <button
        className="btn"
        onClick={() => navigate("/clubs")}
        style={{ marginBottom: "20px", backgroundColor: "#6b7280" }}
      >
        ← Back to Clubs
      </button>

      {}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          marginBottom: "30px",
        }}
      >
        <h1 style={{ margin: "0 0 10px 0", color: "white" }}>
          {organizer.name}
        </h1>

        {organizer.category && (
          <span
            style={{
              display: "inline-block",
              padding: "6px 16px",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: "16px",
              fontSize: "14px",
              fontWeight: "500",
              marginBottom: "15px",
            }}
          >
            {organizer.category}
          </span>
        )}

        {organizer.description && (
          <p style={{ fontSize: "16px", lineHeight: "1.6", margin: "15px 0" }}>
            {organizer.description}
          </p>
        )}

        {organizer.contactEmail && (
          <p style={{ fontSize: "14px", opacity: "0.9", margin: "10px 0 0 0" }}>
             Contact: {organizer.contactEmail}
          </p>
        )}

        {organizer.contactNumber && (
          <p style={{ fontSize: "14px", opacity: "0.9", margin: "5px 0 0 0" }}>
            📞 {organizer.contactNumber}
          </p>
        )}
      </div>

      {}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "30px" }}>
        <div className="card" style={{ textAlign: "center", padding: "20px" }}>
          <h2 style={{ color: "#2563eb", margin: "0 0 5px 0" }}>
            {upcomingEvents.length}
          </h2>
          <p style={{ color: "#666", margin: 0 }}>Upcoming Events</p>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "20px" }}>
          <h2 style={{ color: "#6b7280", margin: "0 0 5px 0" }}>
            {pastEvents.length}
          </h2>
          <p style={{ color: "#666", margin: 0 }}>Past Events</p>
        </div>
      </div>

      {}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            gap: "10px",
            borderBottom: "2px solid #e5e7eb",
          }}
        >
          <button
            onClick={() => setActiveTab("upcoming")}
            style={{
              padding: "12px 24px",
              backgroundColor: "transparent",
              border: "none",
              borderBottom: activeTab === "upcoming" ? "3px solid #2563eb" : "3px solid transparent",
              color: activeTab === "upcoming" ? "#2563eb" : "#6b7280",
              fontWeight: activeTab === "upcoming" ? "600" : "400",
              cursor: "pointer",
              fontSize: "16px",
              transition: "all 0.2s",
            }}
          >
            Upcoming Events ({upcomingEvents.length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            style={{
              padding: "12px 24px",
              backgroundColor: "transparent",
              border: "none",
              borderBottom: activeTab === "past" ? "3px solid #2563eb" : "3px solid transparent",
              color: activeTab === "past" ? "#2563eb" : "#6b7280",
              fontWeight: activeTab === "past" ? "600" : "400",
              cursor: "pointer",
              fontSize: "16px",
              transition: "all 0.2s",
            }}
          >
            Past Events ({pastEvents.length})
          </button>
        </div>
      </div>

      {}
      {activeTab === "upcoming" && (
        <EventsList
          events={upcomingEvents}
          emptyMessage="No upcoming events at the moment."
        />
      )}
      {activeTab === "past" && (
        <EventsList
          events={pastEvents}
          emptyMessage="No past events to display."
        />
      )}
    </div>
  );
}
