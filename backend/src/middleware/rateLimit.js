const rateLimit = require("express-rate-limit");
const SecurityEvent = require("../models/SecurityEvent");
const BlockedIP = require("../models/BlockedIP");

const checkBlockedIP = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    const blockedIP = await BlockedIP.findOne({ ipAddress });

    if (blockedIP) {
      if (!blockedIP.permanent && blockedIP.expiresAt && new Date() > blockedIP.expiresAt) {
        await BlockedIP.deleteOne({ _id: blockedIP._id });
        return next();
      }

      blockedIP.lastAttemptAt = new Date();
      blockedIP.failedAttempts += 1;
      await blockedIP.save();
      await SecurityEvent.create({
        eventType: "IP_BLOCKED",
        ipAddress,
        userAgent: req.headers["user-agent"],
        endpoint: req.originalUrl,
        severity: "HIGH",
        details: {
          reason: blockedIP.reason,
          attempts: blockedIP.failedAttempts,
        },
      });

      return res.status(403).json({ 
        message: "Access denied. Your IP address has been blocked." 
      });
    }

    next();
  } catch (error) {
    console.error("Check blocked IP error:", error);
    next();
  }
};

const autoBlockIP = async (ipAddress, reason) => {
  try {
    const existingBlock = await BlockedIP.findOne({ ipAddress });
    
    if (existingBlock) {
      existingBlock.failedAttempts += 1;
      existingBlock.lastAttemptAt = new Date();
      await existingBlock.save();
      return;
    }

    await BlockedIP.create({
      ipAddress,
      reason,
      autoBlocked: true,
      failedAttempts: 1,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      lastAttemptAt: new Date(),
    });

    await SecurityEvent.create({
      eventType: "IP_BLOCKED",
      ipAddress,
      severity: "CRITICAL",
      details: {
        reason,
        autoBlocked: true,
      },
    });
  } catch (error) {
    console.error("Auto-block IP error:", error);
  }
};

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress;

    await SecurityEvent.create({
      eventType: "RATE_LIMIT_EXCEEDED",
      ipAddress,
      userAgent: req.headers["user-agent"],
      email: req.body.email,
      endpoint: req.originalUrl,
      severity: "HIGH",
      details: {
        limit: 5,
        window: "15 minutes",
      },
    });
    const recentEvents = await SecurityEvent.countDocuments({
      ipAddress,
      eventType: { $in: ["RATE_LIMIT_EXCEEDED", "FAILED_LOGIN"] },
      createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
    });

    if (recentEvents >= 10) {
      await autoBlockIP(ipAddress, "Excessive failed login attempts");
    }

    res.status(429).json({
      message: "Too many login attempts. Please try again later.",
    });
  },
});

const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 3,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress;

    await SecurityEvent.create({
      eventType: "RATE_LIMIT_EXCEEDED",
      ipAddress,
      userAgent: req.headers["user-agent"],
      endpoint: req.originalUrl,
      severity: "MEDIUM",
      details: {
        limit: 3,
        window: "1 hour",
        type: "registration",
      },
    });

    res.status(429).json({
      message: "Too many registration attempts. Please try again later.",
    });
  },
});

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many requests. Please try again later.",
    });
  },
});

module.exports = {checkBlockedIP,autoBlockIP,loginRateLimiter,registerRateLimiter,apiRateLimiter,};
