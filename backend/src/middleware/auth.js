const { verifyJwt } = require("../utils/jwt");

function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = verifyJwt(token); // { sub, role, email }
    req.user = { id: BigInt(payload.sub), role: payload.role, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = { requireAuth };
