const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const { requireAuth } = require("./middleware/auth");
const adminRoutes = require("./routes/admin.routes");
const eventRoutes = require("./routes/event.routes");
const registrationRoutes = require("./routes/registration.routes");
const participantRoutes = require("./routes/participant.routes");
const organizerRoutes = require("./routes/organizer.routes");

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://event-management-system-iiit.vercel.app"
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Event Management System API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/participants", participantRoutes);
app.use("/api/organizers", organizerRoutes);

//TEMP TEST ROUTE
app.get("/api/protected", requireAuth, (req, res) => {
  res.json({
    message: "Access granted",
    user: req.user,
  });
});
module.exports = app;
