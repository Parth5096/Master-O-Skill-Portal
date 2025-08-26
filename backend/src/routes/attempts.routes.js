const { Router } = require("express");
const { answerQuestion, listAttempts, startAttempt, submitAttempt } = require("../controllers/attempts.controller");
const { requireAuth } = require("../middleware/auth");

const r = Router();
r.use(requireAuth);
r.post("/start", startAttempt);
r.post("/:id/answer", answerQuestion);
r.post("/:id/submit", submitAttempt);
r.get("/", listAttempts);

module.exports = r;
