const { Router } = require("express");
const { listUsers, getUser, createUser, updateUser, deleteUser } = require("../controllers/users.controller");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

const r = Router();
r.use(requireAuth, requireRole("admin"));
r.get("/", listUsers);
r.get("/:id", getUser);
r.post("/", createUser);
r.patch("/:id", updateUser);
r.delete("/:id", deleteUser);

module.exports = r;
