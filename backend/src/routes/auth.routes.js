const { Router } = require("express");
const { register, login, me } = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");

const r = Router();
r.post("/register", register);
r.post("/login", login);
r.get("/me", requireAuth, me);

module.exports = r;
