const { Router } = require("express");
const { listQuestions, createQuestion, updateQuestion, replaceOptions, deleteQuestion } = require("../controllers/questions.controller");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

const r = Router();
r.get("/", requireAuth, listQuestions);
r.post("/", requireAuth, requireRole("admin"), createQuestion);
r.patch("/:id", requireAuth, requireRole("admin"), updateQuestion);
r.put("/:id/options", requireAuth, requireRole("admin"), replaceOptions);
r.delete("/:id", requireAuth, requireRole("admin"), deleteQuestion);

module.exports = r;
