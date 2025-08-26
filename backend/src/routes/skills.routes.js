const { Router } = require("express");
const { listSkills, createSkill, updateSkill, deleteSkill } = require("../controllers/skills.controller");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

const r = Router();
r.get("/", requireAuth, listSkills);
r.post("/", requireAuth, requireRole("admin"), createSkill);
r.patch("/:id", requireAuth, requireRole("admin"), updateSkill);
r.delete("/:id", requireAuth, requireRole("admin"), deleteSkill);

module.exports = r;
