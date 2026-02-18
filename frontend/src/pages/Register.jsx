import { useState } from "react";
import api from "../api/axios";
import "../App.css";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [collegeOrOrg, setCollegeOrOrg] = useState("");
  const [participantType, setParticipantType] = useState("IIIT");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError("");
    setSuccess("");

    if (!email || !password || !confirmPassword || !firstName || !lastName || !contactNumber || !collegeOrOrg) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (participantType === "IIIT" && !email.endsWith("@iiit.ac.in")) {
      setError("IIIT participants must use an @iiit.ac.in email");
      return;
    }

    if (!/^\d{10}$/.test(contactNumber)) {
      setError("Contact number must be 10 digits");
      return;
    }

    try {
      const response = await api.post("/auth/register", {
        email,
        password,
        participantType,
        firstName,
        lastName,
        contactNumber,
        collegeOrOrg,
      });

      setSuccess("Registration successful! Redirecting to preferences...");
      
      setTimeout(() => {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", response.data.role);
        navigate("/onboarding");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="container">
      <h2>Create Account</h2>

      {error && <p className="error">{error}</p>}
      {success && <p style={{ color: "green", marginBottom: "15px" }}>{success}</p>}

      <input
        className="input"
        placeholder="First Name"
        type="text"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />

      <input
        className="input"
        placeholder="Last Name"
        type="text"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />

      <input
        className="input"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="input"
        placeholder="Contact Number (10 digits)"
        type="tel"
        value={contactNumber}
        onChange={(e) => setContactNumber(e.target.value)}
      />

      <input
        className="input"
        placeholder="College / Organization Name"
        type="text"
        value={collegeOrOrg}
        onChange={(e) => setCollegeOrOrg(e.target.value)}
      />

      <input
        className="input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        className="input"
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <div style={{ marginBottom: "15px" }}>
        <label style={{ marginRight: "10px" }}>
          <b>Participant Type:</b>
        </label>
        <select
          className="input"
          value={participantType}
          onChange={(e) => setParticipantType(e.target.value)}
          style={{ width: "auto", display: "inline-block" }}
        >
          <option value="IIIT">IIIT Student</option>
          <option value="NON_IIIT">External Participant</option>
        </select>
      </div>

      <button className="btn" onClick={handleRegister}>
        Register
      </button>

      <p style={{ marginTop: "20px" }}>
        Already have an account?{" "}
        <span
          style={{ color: "#2563eb", cursor: "pointer", textDecoration: "underline" }}
          onClick={() => navigate("/")}
        >
          Login here
        </span>
      </p>
    </div>
  );
}
