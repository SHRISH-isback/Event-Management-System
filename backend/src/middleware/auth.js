const jwt = require("jsonwebtoken");
const Organizer = require("../models/Organizer");

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);

  try {
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    
    if (req.user.role === "ORGANIZER") {
      const organizer = await Organizer.findOne({ user: req.user.id });
      if (organizer) {
        req.user.organizerId = organizer._id.toString();
      }
    }
    
    next();
  } catch {
    res.sendStatus(401);
  }
};

const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) return res.sendStatus(403);
  next();
};

const verifyToken = requireAuth;
const verifyAdmin = (req, res, next) => {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    requireRole('admin')(req, res, next);
  });
};

module.exports = { requireAuth, requireRole, verifyToken, verifyAdmin };
