const axios = require("axios");
const SecurityEvent = require("../models/SecurityEvent");

/**
 * @param {string} token 
 * @param {string} ipAddress 
 * @returns {Promise<boolean>} 
 */
const verifyCaptcha = async (token, ipAddress) => {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey) {
      console.warn("RECAPTCHA_SECRET_KEY not configured. Skipping verification.");
      return true;
    }
    const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
    const response = await axios.post(
      verifyUrl,
      null,
      {
        params: {
          secret: secretKey,
          response: token,
          remoteip: ipAddress,
        },
      }
    );

    const { success, score, "error-codes": errorCodes } = response.data;

    if (score !== undefined) {
      const threshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || "0.5");
      return success && score >= threshold;
    }

    return success;
  } catch (error) {
    console.error("CAPTCHA verification error:", error.message);
    return false;
  }
};

const captchaMiddleware = async (req, res, next) => {
  try {
    const captchaToken = req.body.captchaToken || req.headers["x-captcha-token"];
    
    if (!captchaToken) {
      return res.status(400).json({ 
        message: "CAPTCHA verification required" 
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const isValid = await verifyCaptcha(captchaToken, ipAddress);

    if (!isValid) {
      await SecurityEvent.create({
        eventType: "CAPTCHA_FAILED",
        ipAddress,
        userAgent: req.headers["user-agent"],
        email: req.body.email,
        endpoint: req.originalUrl,
        severity: "MEDIUM",
        details: {
          method: req.method,
        },
      });

      return res.status(403).json({ 
        message: "CAPTCHA verification failed. Please try again." 
      });
    }

    next();
  } catch (error) {
    console.error("CAPTCHA middleware error:", error);
    return res.status(500).json({ 
      message: "Error verifying CAPTCHA" 
    });
  }
};

const optionalCaptchaMiddleware = async (req, res, next) => {
  const captchaToken = req.body.captchaToken || req.headers["x-captcha-token"];
  
  if (captchaToken) {
    return captchaMiddleware(req, res, next);
  }
  
  next();
};

module.exports = {captchaMiddleware,optionalCaptchaMiddleware,verifyCaptcha,};
