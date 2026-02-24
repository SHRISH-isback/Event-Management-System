import { Link, useNavigate } from "react-router-dom";
import "../App.css";

export default function Navbar() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <span className="logo">EMS</span>
        <Link to="/events" className="nav-link">Events</Link>

        {/* Role-based navigation links */}
        {role === "ADMIN" && (
          <Link to="/admin" className="nav-link">Admin</Link>
        )}
        {role === "PARTICIPANT" && (
          <>
            <Link to="/my-events" className="nav-link">My Events</Link>
            <Link to="/clubs" className="nav-link">Clubs</Link>
          </>
        )}
        {role === "ORGANIZER" && (
          <>
            <Link to="/organizer" className="nav-link">My Events</Link>
            <Link to="/organizer/ongoing" className="nav-link">Ongoing Events</Link>
            <Link to="/organizer/merchandise-orders" className="nav-link">Merch Orders</Link>
          </>
        )}
      </div>

      <div className="nav-right">
        {role === "PARTICIPANT" && (
          <Link to="/profile" className="nav-link">Profile</Link>
        )}
        {role === "ORGANIZER" && (
          <Link to="/organizer/profile" className="nav-link">Profile</Link>
        )}
        <button className="btn btn-logout" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}
