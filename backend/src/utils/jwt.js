const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function signJwt(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function verifyJwt(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

module.exports = { signJwt, verifyJwt };
