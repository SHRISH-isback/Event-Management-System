const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const { requireAuth } = require("./middleware/auth");
const adminRoutes = require("./routes/admin.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

//TEMP TEST ROUTE
app.get("/api/protected", requireAuth, (req, res) => {
  res.json({
    message: "Access granted",
    user: req.user,
  });
});
module.exports = app;
