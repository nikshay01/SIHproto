import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "ecycle_secure_jwt_secret_sih_2026_key_99812";

export function generateToken(user) {
  return jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

export async function authenticate(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: "Access denied. Authentication token is missing."
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ userId: decoded.userId });

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "User associated with this token no longer exists."
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      ok: false,
      error: "Invalid or expired authentication token."
    });
  }
}

export function optionalAuthenticate(req, res, next) {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      User.findOne({ userId: decoded.userId }).then(user => {
        if (user) req.user = user;
        next();
      }).catch(() => next());
    } else {
      next();
    }
  } catch (err) {
    next();
  }
}
