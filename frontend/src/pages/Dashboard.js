import "../App.css";

export default function Dashboard() {
  const role = localStorage.getItem("role");

  return (
    <div className="container">
      <h2>Dashboard</h2>
      <p><b>Role:</b> {role}</p>

      {role === "PARTICIPANT" && (
        <p>You can browse events and register.</p>
      )}

      {role === "ORGANIZER" && (
        <p>You can create and manage events.</p>
      )}

      {role === "ADMIN" && (
        <p>You can manage organizers and system settings.</p>
      )}
    </div>
  );
}
