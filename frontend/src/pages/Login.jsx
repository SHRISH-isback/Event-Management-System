import { useState } from "react";
import api from "../api/axios";
import "../App.css";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

const handleLogin = async () => {
  try {
    const res = await api.post("/auth/login", { email, password });

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("role", res.data.role);

    if (res.data.role === "ADMIN") {
      navigate("/admin");
    } else if (res.data.role === "ORGANIZER") {
      navigate("/organizer");
    } else {
      navigate("/events");
    }
  } catch {
    setError("Invalid email or password");
  }
};


  return (
    <div className="container">
      <h2>Login</h2>

      {error && <p className="error">{error}</p>}

      <input
        className="input"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="btn" onClick={handleLogin}>
        Login
      </button>

      <p style={{ marginTop: "20px" }}>
        Don't have an account?{" "}
        <span
          style={{ color: "#2563eb", cursor: "pointer", textDecoration: "underline" }}
          onClick={() => navigate("/register")}
        >
          Register here
        </span>
      </p>
    </div>
  );
}
