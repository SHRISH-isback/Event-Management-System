require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const User = require("./models/User");
const { ADMIN } = require("./utils/roles");
const http = require("http");
const { Server } = require("socket.io");
const { initializeSocket } = require("./utils/socketService");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://event-management-system-iiit.vercel.app",
      /\.vercel\.app$/
    ],
    credentials: true,
  },
});

initializeSocket(io);

const seedAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log("Admin credentials not provided in env");
    return;
  }

  const existingAdmin = await User.findOne({ role: ADMIN });

  if (existingAdmin) {
    console.log("Admin already exists");
    return;
  }

  await User.create({
    email: adminEmail,
    password: adminPassword,
    role: ADMIN,
  });

  console.log("Admin user created");
};

const startServer = async () => {
  await connectDB();
  await seedAdmin();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
